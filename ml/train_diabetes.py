# app/ml/train_diabetes_ensemble.py
import os
import joblib
import json
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, precision_score, recall_score, f1_score, accuracy_score
import xgboost as xgb
from sklearn.base import clone

# Optional: SHAP
try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False

# === Config ===
DATA_PATH = Path("data/diabetes_prediction_dataset (1).csv")
OUT_DIR = Path("app/ml/models")
OUT_DIR.mkdir(parents=True, exist_ok=True)
TARGET = "diabetes"

# === Load & Clean ===
df = pd.read_csv(DATA_PATH)
print("Loaded data:", df.shape)

cat_features = ["gender", "smoking_history"]
num_features = ["age", "bmi", "HbA1c_level", "blood_glucose_level"]
bin_features = ["hypertension", "heart_disease"]

df["bmi"] = df["bmi"].clip(lower=10, upper=70)
df["age"] = df["age"].clip(lower=0, upper=120)

# === Train/test split ===
X = df[cat_features + num_features + bin_features]
y = df[TARGET]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)

# === Preprocessing Definition ===
numeric_transformer = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler())
])
categorical_transformer = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("onehot", OneHotEncoder(handle_unknown="ignore"))
])
preprocessor = ColumnTransformer(transformers=[
    ("num", numeric_transformer, num_features),
    ("cat", categorical_transformer, cat_features),
], remainder="passthrough")

# === Base Model Definitions ===
lr_pipeline = Pipeline(steps=[
    ("preprocessor", preprocessor),
    ("clf", LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42))
])

xgb_clf = xgb.XGBClassifier(
    n_estimators=200, max_depth=6, learning_rate=0.05,
    use_label_encoder=False, eval_metric="logloss", random_state=42
)

# === 1) Stacking Ensemble: OOF Predictions for Meta-Learner ===
print("--- Generating Out-of-Fold (OOF) predictions for stacking ---")
n_splits = 5
skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)

oof_preds_lr = np.zeros(len(X_train))
oof_preds_xgb = np.zeros(len(X_train))

for fold, (train_idx, val_idx) in enumerate(skf.split(X_train, y_train)):
    print(f"Processing Fold {fold+1}/{n_splits}...")
    X_train_fold, y_train_fold = X_train.iloc[train_idx], y_train.iloc[train_idx]
    X_val_fold, y_val_fold = X_train.iloc[val_idx], y_train.iloc[val_idx]

    lr_fold = clone(lr_pipeline)
    lr_fold.fit(X_train_fold, y_train_fold)
    oof_preds_lr[val_idx] = lr_fold.predict_proba(X_val_fold)[:, 1]

    X_train_fold_proc = preprocessor.fit_transform(X_train_fold)
    X_val_fold_proc = preprocessor.transform(X_val_fold)
    xgb_fold = clone(xgb_clf)
    xgb_fold.fit(X_train_fold_proc, y_train_fold)
    oof_preds_xgb[val_idx] = xgb_fold.predict_proba(X_val_fold_proc)[:, 1]

X_meta_train = np.vstack([oof_preds_lr, oof_preds_xgb]).T

# === 2) Train Meta-Learner ===
print("\n--- Training Meta-Learner ---")
meta_clf = LogisticRegression(random_state=42)
meta_clf.fit(X_meta_train, y_train)

# === 3) Train Final Base Models on Full Training Data ===
print("--- Training final base models on full training data ---")
lr_pipeline.fit(X_train, y_train)
X_train_proc = preprocessor.fit_transform(X_train)
X_test_proc = preprocessor.transform(X_test)
xgb_clf.fit(X_train_proc, y_train)

# === 4) Evaluate Ensemble on Holdout Test Set ===
print("--- Evaluating models on the holdout test set ---")
y_prob_lr_test = lr_pipeline.predict_proba(X_test)[:, 1]
y_prob_xgb_test = xgb_clf.predict_proba(X_test_proc)[:, 1]

X_meta_test = np.vstack([y_prob_lr_test, y_prob_xgb_test]).T
y_prob_ensemble = meta_clf.predict_proba(X_meta_test)[:, 1]
y_pred_ensemble = meta_clf.predict(X_meta_test)

def get_metrics(y_true, y_prob, y_pred):
    return {
        "roc_auc": float(roc_auc_score(y_true, y_prob)),
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0))
    }

lr_metrics = get_metrics(y_test, y_prob_lr_test, (y_prob_lr_test > 0.5).astype(int))
xgb_metrics = get_metrics(y_test, y_prob_xgb_test, (y_prob_xgb_test > 0.5).astype(int))
ensemble_metrics = get_metrics(y_test, y_prob_ensemble, y_pred_ensemble)

print("\nLogistic Regression Metrics:", lr_metrics)
print("XGBoost Metrics:", xgb_metrics)
print("Ensemble Metrics:", ensemble_metrics)

# === 5) Save Artifacts ===
print("\n--- Saving model artifacts ---")
joblib.dump(lr_pipeline, OUT_DIR / "diabetes_logistic_pipeline.pkl")
joblib.dump(xgb_clf, OUT_DIR / "diabetes_xgboost.pkl")
joblib.dump(preprocessor, OUT_DIR / "diabetes_preprocessor.pkl")
joblib.dump(meta_clf, OUT_DIR / "diabetes_meta_learner.pkl")

# === 6) SHAP Analysis (Integrated Code) ===
if SHAP_AVAILABLE:
    try:
        print("--- Computing SHAP for XGBoost model (limited sample) ---")
        explainer = shap.TreeExplainer(xgb_clf)
        
        # Limit test rows for speed
        test_limit = min(1000, X_test_proc.shape[0])
        shap_values = explainer.shap_values(X_test_proc[:test_limit])
        
        # Prepare feature names from the preprocessor
        ohe = preprocessor.named_transformers_["cat"].named_steps["onehot"]
        ohe_names = ohe.get_feature_names_out(cat_features).tolist()
        feature_names = list(num_features) + ohe_names + bin_features
        
        # Global feature importance
        mean_abs_shap = np.mean(np.abs(shap_values), axis=0)
        feature_importance = sorted(list(zip(feature_names, mean_abs_shap)), key=lambda x: x[1], reverse=True)
        top_global = feature_importance[:10]
        
        # Per-sample top 3 features for the first 100 samples
        per_sample_top3 = []
        for i in range(min(100, test_limit)):
            sample_shap = shap_values[i]
            top_idx = np.argsort(-np.abs(sample_shap))[:3]
            top_feats = [{"feature": feature_names[idx], "shap_value": float(sample_shap[idx])} for idx in top_idx]
            per_sample_top3.append({"sample_index": int(i), "top3": top_feats})
            
        with open(OUT_DIR / "diabetes_shap_summary.json", "w") as f:
            json.dump({
                "global_top_features": [{"feature": f, "mean_abs_shap": float(s)} for f, s in top_global],
                "per_sample_top_features": per_sample_top3
            }, f, indent=2)
        print("SHAP summary saved to diabetes_shap_summary.json")
        
    except Exception as e:
        print(f"SHAP computation failed: {e}")
else:
    print("--- SHAP not installed / unavailable. Skipping SHAP analysis. ---")


# === 7) Final Summary ===
summary = {
    "lr_metrics": lr_metrics,
    "xgb_metrics": xgb_metrics,
    "ensemble_metrics": ensemble_metrics,
    "saved_models": {
        "logistic_pipeline": str((OUT_DIR / 'diabetes_logistic_pipeline.pkl').resolve()),
        "xgboost": str((OUT_DIR / 'diabetes_xgboost.pkl').resolve()),
        "preprocessor": str((OUT_DIR / 'diabetes_preprocessor.pkl').resolve()),
        "meta_learner": str((OUT_DIR / 'diabetes_meta_learner.pkl').resolve()),
    },
    "shap_summary": str((OUT_DIR / 'diabetes_shap_summary.json').resolve()) if SHAP_AVAILABLE else None
}
print("\n--- Final Summary ---")
print(json.dumps(summary, indent=2))