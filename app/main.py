# app/main.py

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
import numpy as np
from typing import List, Optional
import datetime
from passlib.context import CryptContext
from jose import JWTError, jwt
import secrets

# NEW: Import SQLAlchemy for database connection
from sqlalchemy import create_engine, text

# Simplified ML prediction functions for testing
def predict_baseline_diabetes_risk(features: dict) -> dict:
    # Mock prediction based on BMI and HbA1c
    bmi = features.get('bmi', 25)
    hba1c = features.get('HbA1c_level', 5.5)

    # Simple risk calculation
    risk_score = (bmi - 25) * 0.02 + (hba1c - 5.5) * 0.1
    risk_score = max(0, min(1, risk_score + 0.3))  # Normalize to 0-1

    risk_label = "High" if risk_score >= 0.7 else "Medium" if risk_score >= 0.4 else "Low"
    return {"risk_probability": float(risk_score), "risk_label": risk_label}

def predict_glucose_event_risk(agg_features: dict, sequence: np.ndarray) -> dict:
    # Mock prediction based on glucose sequence statistics
    mean_glucose = np.mean(sequence)
    std_glucose = np.std(sequence)

    risk_score = (mean_glucose - 100) * 0.005 + std_glucose * 0.01
    risk_score = max(0, min(1, risk_score))

    return {"event_risk": float(risk_score), "glucose_variability": float(std_glucose)}

def predict_hypertension_risk(features: dict) -> dict:
    # Mock hypertension prediction
    risk_score = 0.3 + np.random.random() * 0.4  # Random between 0.3-0.7
    return {"hypertension_risk": float(risk_score), "status": "mock_prediction"}

def predict_heart_disease_risk(features: dict) -> dict:
    # Mock heart disease prediction
    risk_score = 0.2 + np.random.random() * 0.3  # Random between 0.2-0.5
    return {"heart_disease_risk": float(risk_score), "status": "mock_prediction"}


# --- 1. Authentication Configuration ---
SECRET_KEY = secrets.token_urlsafe(32)  # In production, use environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# --- 2. Database Connection ---
DATABASE_URL = "mysql+pymysql://root:root@127.0.0.1/welldoc_db"
engine = create_engine(DATABASE_URL)

# --- 3. Initialize FastAPI App ---
app = FastAPI(
    title="AI Wellness Coach API",
    description="API for predicting diabetes, hypertension, and heart disease risk.",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 4. Authentication Models ---
class UserRegister(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    password: str
    userType: str = "patient"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class User(BaseModel):
    id: Optional[int] = None
    email: str
    firstName: str
    lastName: str
    userType: str
    is_active: bool = True

# --- 5. Authentication Utility Functions ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user_by_email(email: str):
    with engine.connect() as connection:
        query = text("SELECT * FROM users WHERE email = :email")
        result = connection.execute(query, {"email": email}).fetchone()
        if result:
            return User(
                id=result[0],
                email=result[1],
                firstName=result[3],
                lastName=result[4],
                userType=result[5],
                is_active=bool(result[6])
            )
    return None

def authenticate_user(email: str, password: str):
    with engine.connect() as connection:
        query = text("SELECT * FROM users WHERE email = :email")
        result = connection.execute(query, {"email": email}).fetchone()
        if not result:
            return False
        if not verify_password(password, result[2]):  # password is at index 2
            return False
        return User(
            id=result[0],
            email=result[1],
            firstName=result[3],
            lastName=result[4],
            userType=result[5],
            is_active=bool(result[6])
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = get_user_by_email(email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

# --- 6. Pydantic Models for Input Data Validation ---
class BaselineRiskFeatures(BaseModel):
    gender: str; age: float; hypertension: int; heart_disease: int; smoking_history: str; bmi: float; HbA1c_level: float; blood_glucose_level: int

class GlucoseEventFeatures(BaseModel):
    mean_gluc_weak: float; std_gluc: float; cov: float; iqr: float; mean_slope: float; max_slope: float; skew: float; kurtosis: float; pct_above_140: float; circadian_diff: float; samp_entropy: float; median_rise: float; short_spikes: int; sustained_spikes: int; glucose_sequence: List[float] = Field(..., min_length=96, max_length=96)

class HypertensionFeatures(BaseModel):
    # TODO: Replace with actual features
    placeholder_feature_1: float
    placeholder_feature_2: int

class HeartDiseaseFeatures(BaseModel):
    # TODO: Replace with actual features
    placeholder_feature_a: float
    placeholder_feature_b: str
    
class AllPatientData(BaseModel):
    patient_id: int
    diabetes_baseline_features: BaselineRiskFeatures
    glucose_realtime_features: GlucoseEventFeatures
    hypertension_features: HypertensionFeatures
    heart_disease_features: HeartDiseaseFeatures

# --- 7. API Endpoints ---
@app.get("/", tags=["Health Check"])
def read_root():
    return {"status": "AI Wellness Coach API is running!"}

@app.post("/register", response_model=Token, tags=["Authentication"])
async def register_user(user: UserRegister):
    """
    Register a new user account.
    """
    try:
        # Check if user already exists
        existing_user = get_user_by_email(user.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Hash password
        hashed_password = get_password_hash(user.password)

        # Insert user into database
        with engine.connect() as connection:
            query = text("""
                INSERT INTO users (email, password_hash, first_name, last_name, user_type, is_active)
                VALUES (:email, :password_hash, :first_name, :last_name, :user_type, :is_active)
            """)
            connection.execute(query, {
                "email": user.email,
                "password_hash": hashed_password,
                "first_name": user.firstName,
                "last_name": user.lastName,
                "user_type": user.userType,
                "is_active": True
            })
            connection.commit()

        # Create access token
        access_token_expires = datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )

        return {"access_token": access_token, "token_type": "bearer"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/login", response_model=Token, tags=["Authentication"])
async def login_user(user: UserLogin):
    """
    Authenticate user and return access token.
    """
    try:
        user_obj = authenticate_user(user.email, user.password)
        if not user_obj:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token_expires = datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user_obj.email}, expires_delta=access_token_expires
        )

        return {"access_token": access_token, "token_type": "bearer"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.get("/me", response_model=User, tags=["Authentication"])
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Get current user information.
    """
    return current_user


@app.post("/score", tags=["Predictions"])
async def get_patient_score(data: AllPatientData, current_user: User = Depends(get_current_user)):
    """
    Receives all patient data, saves key vitals, and returns a comprehensive risk profile.
    Requires authentication.
    """
    try:
        # Save key vitals to the database
        with engine.connect() as connection:
            query = text("""
                INSERT INTO vitals (patient_id, timestamp, bmi, HbA1c_level, blood_glucose_level)
                VALUES (:patient_id, :timestamp, :bmi, :HbA1c_level, :blood_glucose_level)
            """)
            connection.execute(query, {
                "patient_id": data.patient_id,
                "timestamp": datetime.datetime.now(),
                "bmi": data.diabetes_baseline_features.bmi,
                "HbA1c_level": data.diabetes_baseline_features.HbA1c_level,
                "blood_glucose_level": data.diabetes_baseline_features.blood_glucose_level
            })
            connection.commit()

        # Get predictions from all models
        baseline_diabetes_pred = predict_baseline_diabetes_risk(data.diabetes_baseline_features.model_dump())
        
        realtime_agg_input = data.glucose_realtime_features.model_dump()
        sequence_array = np.array(realtime_agg_input.pop("glucose_sequence"))
        realtime_glucose_pred = predict_glucose_event_risk(realtime_agg_input, sequence_array)

        hypertension_pred = predict_hypertension_risk(data.hypertension_features.model_dump())
        heart_disease_pred = predict_heart_disease_risk(data.heart_disease_features.model_dump())
        
        return {
            "database_status": "Data saved successfully",
            "patient_id": data.patient_id,
            "risk_profile": {
                "diabetes_baseline_risk": baseline_diabetes_pred,
                "glucose_realtime_risk": realtime_glucose_pred,
                "hypertension_risk": hypertension_pred,
                "heart_disease_risk": heart_disease_pred
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")