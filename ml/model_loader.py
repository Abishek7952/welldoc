# app/ml/model_loader.py
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
import tensorflow as tf

# --- Configuration ---
MODEL_DIR = Path(__file__).parent.parent / "app" / "ml" / "models"
print(f"Loading models from: {MODEL_DIR.resolve()}")

# --- Load All Model Artifacts ---
try:
    # Diabetes Models (Unchanged)
    DIABETES_PREPROCESSOR = joblib.load(MODEL_DIR / "diabetes_preprocessor.pkl")
    DIABETES_XGB_MODEL = joblib.load(MODEL_DIR / "diabetes_xgboost.pkl")
    
    # Glucose Event Models (Unchanged)
    ENSEMBLE_PREPROCESSOR = joblib.load(MODEL_DIR / "ensemble_preprocessor.pkl")
    ENSEMBLE_LOGISTIC_MODEL = joblib.load(MODEL_DIR / "ensemble_logistic.pkl")
    ENSEMBLE_LSTM_MODEL = tf.keras.models.load_model(MODEL_DIR / "ensemble_lstm.keras")
    ENSEMBLE_META_MODEL = joblib.load(MODEL_DIR / "ensemble_meta.pkl")

    # NEW: Load Hypertension and Heart Disease Models
    HYPERTENSION_MODEL = joblib.load(MODEL_DIR / "ml_hypertension/final_lr_xgb_ensemble.pkl")
    HEART_DISEASE_MODEL = joblib.load(MODEL_DIR / "ml_heart/random_forest_heart.pkl")

    print("All model artifacts loaded successfully.")

except Exception as e:
    print(f"Error loading model artifacts: {e}")
    # Handle error state for all models
    DIABETES_PREPROCESSOR = DIABETES_XGB_MODEL = None
    ENSEMBLE_PREPROCESSOR = ENSEMBLE_LOGISTIC_MODEL = ENSEMBLE_LSTM_MODEL = ENSEMBLE_META_MODEL = None
    HYPERTENSION_MODEL = HEART_DISEASE_MODEL = None

# --- Specialized Prediction Functions ---

# (predict_baseline_diabetes_risk and predict_glucose_event_risk are unchanged)
def predict_baseline_diabetes_risk(feature_dict: dict) -> dict:
    # ... (code from previous version)
    if not all([DIABETES_PREPROCESSOR, DIABETES_XGB_MODEL]): return {"error": "Baseline diabetes model not loaded."}
    df = pd.DataFrame([feature_dict])
    processed_features = DIABETES_PREPROCESSOR.transform(df)
    probability = DIABETES_XGB_MODEL.predict_proba(processed_features)[0, 1]
    risk_label = "High" if probability >= 0.6 else "Medium" if probability >= 0.3 else "Low"
    return {"risk_probability": float(probability), "risk_label": risk_label}

def predict_glucose_event_risk(agg_features_dict: dict, sequence_array: np.ndarray) -> dict:
    # ... (code from previous version)
    if not all([ENSEMBLE_PREPROCESSOR, ENSEMBLE_LOGISTIC_MODEL, ENSEMBLE_LSTM_MODEL, ENSEMBLE_META_MODEL]): return {"error": "Glucose event model not loaded."}
    agg_df = pd.DataFrame([agg_features_dict])
    processed_agg_features = ENSEMBLE_PREPROCESSOR.transform(agg_df)
    processed_sequence = sequence_array.reshape(1, -1, 1)
    prob_logistic = ENSEMBLE_LOGISTIC_MODEL.predict_proba(processed_agg_features)[0, 1]
    prob_lstm = ENSEMBLE_LSTM_MODEL.predict(processed_sequence, verbose=0)[0, 0]
    meta_features = np.array([[prob_logistic, prob_lstm]])
    final_probability = ENSEMBLE_META_MODEL.predict_proba(meta_features)[0, 1]
    risk_label = "High Alert" if final_probability >= 0.7 else "Watchful" if final_probability >= 0.4 else "Stable"
    return {"risk_probability": float(final_probability), "risk_label": risk_label}


# NEW: Prediction function for Hypertension
def predict_hypertension_risk(feature_dict: dict) -> dict:
    if not HYPERTENSION_MODEL:
        return {"error": "Hypertension model not loaded."}
    
    # TODO: Replace this with the actual feature names your friend's model needs
    # For example: feature_names = ['age', 'bmi', 'avg_systolic_bp', 'avg_diastolic_bp']
    feature_names = ["placeholder_feature_1", "placeholder_feature_2"] 
    
    df = pd.DataFrame([feature_dict])[feature_names] # Ensures correct feature order
    
    # Assuming the model pipeline includes preprocessing
    probability = HYPERTENSION_MODEL.predict_proba(df)[0, 1]
    risk_label = "High" if probability >= 0.5 else "Normal"
    
    return {"risk_probability": float(probability), "risk_label": risk_label}

# NEW: Prediction function for Heart Disease
def predict_heart_disease_risk(feature_dict: dict) -> dict:
    if not HEART_DISEASE_MODEL:
        return {"error": "Heart disease model not loaded."}

    # TODO: Replace this with the actual feature names your friend's model needs
    # For example: feature_names = ['age', 'sex', 'chol', 'trestbps', 'fbs']
    feature_names = ["placeholder_feature_a", "placeholder_feature_b"]
    
    df = pd.DataFrame([feature_dict])[feature_names] # Ensures correct feature order

    # Assuming the model pipeline includes preprocessing
    probability = HEART_DISEASE_MODEL.predict_proba(df)[0, 1]
    risk_label = "High" if probability >= 0.5 else "Low"

    return {"risk_probability": float(probability), "risk_label": risk_label}