# ml/train_ensemble_no_xgb.py
"""
Train ensemble of LogisticRegression + LSTM with proper OOF meta training (no XGBoost).
Saves models, evaluation summary, and XAI explanations to app/ml/models.
"""

import json, joblib, numpy as np, pandas as pd, random
from pathlib import Path
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, accuracy_score, precision_score, recall_score, f1_score

# TensorFlow (LSTM)
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping

# Optional: SHAP for XAI
try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False

# Paths
FEAT_CSV = Path("data/processed/synthetic_uci_features.csv")
SEQ_NPY = Path("data/processed/synthetic_sequences.npy")
SEQ_INDEX = Path("data/processed/synthetic_seq_index.json")
OUT_DIR = Path("app/ml/models")
OUT_DIR.mkdir(parents=True, exist_ok=True)

if not FEAT_CSV.exists() or not SEQ_NPY.exists():
    raise SystemExit("Missing synthetic data. Run generator first.")

# Load data
df = pd.read_csv(FEAT_CSV)
seqs = np.load(str(SEQ_NPY), allow_pickle=False)
with open(SEQ_INDEX, "r") as f:
    seq_index = json.load(f)

# Prepare aggregated features & label
ignore_cols = ["patient_id", "label"]
X_agg = df[[c for c in df.columns if c not in ignore_cols]].copy()
y = df["label"].astype(int).to_numpy()
patient_ids = df["patient_id"].astype(str).tolist()

# Preprocessor for aggregated features
num_cols = X_agg.select_dtypes(include=[np.number]).columns.tolist()
numeric_transformer = Pipeline([("imputer", SimpleImputer(strategy="median")), ("scaler", StandardScaler())])
preprocessor = ColumnTransformer([("num", numeric_transformer, num_cols)], remainder="passthrough")
X_agg_p = preprocessor.fit_transform(X_agg)

# Build sequence matrix aligned with df order
seq_matrix = np.zeros((len(df), seqs.shape[1]), dtype=np.float32)
for i, pid in enumerate(patient_ids):
    idx = seq_index.get(pid)
    if idx is None:
        seq_matrix[i] = np.zeros(seqs.shape[1], dtype=np.float32)
    else:
        seq_matrix[i] = seqs[idx]
X_seq = seq_matrix.reshape((seq_matrix.shape[0], seq_matrix.shape[1], 1))

# Patient-level holdout split
X_agg_train, X_agg_test, X_seq_train, X_seq_test, y_train, y_test = train_test_split(
    X_agg_p, X_seq, y, test_size=0.2, random_state=42, stratify=y)

# -------- Logistic (base model 1) --------
print("--- Training Base Logistic Regression Model ---")
log_clf = LogisticRegression(max_iter=2000, class_weight="balanced", random_state=42)
log_clf.fit(X_agg_train, y_train)

# -------- LSTM (base model 2) --------
print("--- Training Base LSTM Model ---")
tf.keras.backend.clear_session()
timesteps = X_seq_train.shape[1]
lstm_model = Sequential([
    Input(shape=(timesteps, 1)),
    LSTM(48, return_sequences=False),
    Dropout(0.25),
    Dense(24, activation="relu"),
    Dropout(0.2),
    Dense(1, activation="sigmoid")
])
lstm_model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["AUC"])
es = EarlyStopping(monitor="val_loss", patience=6, restore_best_weights=True, verbose=0)
lstm_model.fit(X_seq_train, y_train, validation_split=0.12, epochs=60, batch_size=32, callbacks=[es], verbose=1)

# -------- OOF stacking for meta-learner --------
print("\n--- Generating OOF predictions for Meta-Learner ---")
n_splits = 5
skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
oof_log = np.zeros(X_agg_train.shape[0], dtype=float)
oof_lstm = np.zeros(X_agg_train.shape[0], dtype=float)

for fold, (tr_idx, val_idx) in enumerate(skf.split(X_agg_train, y_train)):
    # ... (OOF code remains the same)
    X_agg_tr, X_agg_val = X_agg_train[tr_idx], X_agg_train[val_idx]
    X_seq_tr, X_seq_val = X_seq_train[tr_idx], X_seq_train[val_idx]
    y_tr, y_val = y_train[tr_idx], y_train[val_idx]
    
    log_fold = LogisticRegression(max_iter=2000, class_weight="balanced", random_state=42)
    log_fold.fit(X_agg_tr, y_tr)
    oof_log[val_idx] = log_fold.predict_proba(X_agg_val)[:,1]

    tf.keras.backend.clear_session()
    lstm_fold = Sequential([
        Input(shape=(timesteps,1)), LSTM(32, return_sequences=False), Dropout(0.25),
        Dense(16, activation="relu"), Dropout(0.2), Dense(1, activation="sigmoid")
    ])
    lstm_fold.compile(optimizer="adam", loss="binary_crossentropy")
    es_fold = EarlyStopping(monitor="val_loss", patience=8, restore_best_weights=True, verbose=0)
    lstm_fold.fit(X_seq_tr, y_tr, validation_data=(X_seq_val, y_val), epochs=40, batch_size=32, callbacks=[es_fold], verbose=0)
    oof_lstm[val_idx] = lstm_fold.predict(X_seq_val).ravel()

stack_oof = np.vstack([oof_log, oof_lstm]).T
print("--- Training Meta-Learner ---")
meta = LogisticRegression(max_iter=2000, class_weight="balanced", random_state=42)
meta.fit(stack_oof, y_train)

# -------- Evaluate on holdout test set --------
log_prob_test = log_clf.predict_proba(X_agg_test)[:,1]
lstm_prob_test = lstm_model.predict(X_seq_test, verbose=0).ravel()
stack_test = np.vstack([log_prob_test, lstm_prob_test]).T
ensemble_prob = meta.predict_proba(stack_test)[:,1]
ensemble_pred = (ensemble_prob >= 0.5).astype(int)

# ... (metrics function and evaluation calls remain the same) ...
def metrics(y_true, probs, preds):
    return {"roc_auc": float(roc_auc_score(y_true, probs)) if len(set(y_true))>1 else None, "accuracy": float(accuracy_score(y_true, preds)), "precision": float(precision_score(y_true, preds, zero_division=0)), "recall": float(recall_score(y_true, preds, zero_division=0)), "f1": float(f1_score(y_true, preds, zero_division=0))}
log_pred_test = (log_prob_test >= 0.5).astype(int); lstm_pred_test = (lstm_prob_test >= 0.5).astype(int)
evals = {"logistic": metrics(y_test, log_prob_test, log_pred_test), "lstm": metrics(y_test, lstm_prob_test, lstm_pred_test), "ensemble": metrics(y_test, ensemble_prob, ensemble_pred)}
print("\nEvaluation results:", json.dumps(evals, indent=2))

# -------- XAI: Explain Model Predictions --------
print("\n--- Generating XAI Explanations ---")
xai_summary = {}

# 1. Explain Meta-Learner weights
meta_weights = meta.coef_[0]
xai_summary['meta_learner_weights'] = {
    'logistic_base_model_weight': float(meta_weights[0]),
    'lstm_base_model_weight': float(meta_weights[1])
}

# 2. Explain Base Logistic Regression feature importance
# Get feature names from the original dataframe (order is preserved)
lr_feature_names = num_cols 
lr_coeffs = log_clf.coef_[0]
lr_importance = sorted(zip(lr_feature_names, lr_coeffs), key=lambda x: abs(x[1]), reverse=True)
xai_summary['logistic_base_model_features'] = {
    'top_features': [{'feature': name, 'coefficient': float(coef)} for name, coef in lr_importance[:10]]
}

# 3. Explain Base LSTM feature importance using SHAP
if SHAP_AVAILABLE:
    try:
        print("Calculating SHAP values for LSTM model (this may take a moment)...")
        # Use a small background sample from the training data for the explainer
        background_sample = X_seq_train[np.random.choice(X_seq_train.shape[0], 100, replace=False)]
        
        explainer = shap.DeepExplainer(lstm_model, background_sample)
        
        # Explain predictions on a small sample of the test data
        explain_sample = X_seq_test[:50]
        shap_values = explainer.shap_values(explain_sample)[0] # Get SHAP values for the positive class
        
        # Global importance: mean absolute SHAP value for each timestep
        mean_abs_shap = np.mean(np.abs(shap_values), axis=0).flatten()
        
        # Find the most important timesteps (e.g., top 5)
        top_timesteps_idx = np.argsort(-mean_abs_shap)[:5]
        
        xai_summary['lstm_base_model_shap'] = {
            'global_importance': {
                'comment': f"SHAP values averaged over {len(explain_sample)} test samples.",
                'most_important_timesteps': [int(i) for i in top_timesteps_idx]
            }
        }
        print("SHAP analysis complete.")
    except Exception as e:
        print(f"SHAP analysis for LSTM failed: {e}")
        xai_summary['lstm_base_model_shap'] = {'error': str(e)}
else:
    print("SHAP is not installed. Skipping LSTM explanation.")
    xai_summary['lstm_base_model_shap'] = {'status': 'skipped_shap_not_installed'}

# -------- Save artifacts --------
print("\n--- Saving Artifacts ---")
joblib.dump(preprocessor, OUT_DIR / "ensemble_preprocessor.pkl")
joblib.dump(log_clf, OUT_DIR / "ensemble_logistic.pkl")
lstm_model.save(OUT_DIR / "ensemble_lstm.keras")
joblib.dump(meta, OUT_DIR / "ensemble_meta.pkl")

with open(OUT_DIR / "ensemble_eval.json", "w") as fo:
    json.dump(evals, fo, indent=2)

# Save the new XAI summary file
with open(OUT_DIR / "ensemble_xai_summary.json", "w") as fo:
    json.dump(xai_summary, fo, indent=2)

print("Saved models to", OUT_DIR)
print("Saved XAI summary to", OUT_DIR / "ensemble_xai_summary.json")