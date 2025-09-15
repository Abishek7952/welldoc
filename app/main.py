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
try:
    import cohere
    COHERE_AVAILABLE = True
except ImportError:
    COHERE_AVAILABLE = False
    print("Warning: Cohere AI not available. AI recommendations will be disabled.")

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

# --- AI Health Coaching Functions ---
async def generate_health_recommendations(patient_data: dict, risk_results: dict) -> dict:
    """Generate personalized health recommendations using Cohere AI"""
    if not COHERE_AVAILABLE:
        return {
            "error": "AI recommendations not available",
            "fallback_message": "Please consult with your healthcare provider for personalized health advice.",
            "generated_at": datetime.datetime.now().isoformat()
        }

    try:

        # Create a comprehensive prompt for the AI health coach
        prompt = f"""You are an expert AI Health Coach. Based on the following patient data and health risk assessment, provide personalized, actionable health recommendations.

PATIENT PROFILE:
- Age: {patient_data.get('age', 'N/A')} years
- Gender: {patient_data.get('gender', 'N/A')}
- BMI: {patient_data.get('bmi', 'N/A')}
- Exercise: {patient_data.get('exercise_frequency', 'N/A')}
- Smoking: {patient_data.get('smoking_history', 'N/A')}
- Sleep: {patient_data.get('sleep_hours', 'N/A')} hours/night
- Stress Level: {patient_data.get('stress_level', 'N/A')}
- Diet Type: {patient_data.get('diet_type', 'N/A')}
- HbA1c: {patient_data.get('hba1c_level', 'N/A')}%
- Blood Pressure: {patient_data.get('systolic_bp', 'N/A')}/{patient_data.get('diastolic_bp', 'N/A')} mmHg
- Blood Glucose: {patient_data.get('blood_glucose_level', 'N/A')} mg/dL

RISK ASSESSMENT RESULTS:
- Diabetes Risk: {risk_results.get('diabetes_baseline_risk', {}).get('risk_label', 'N/A')} ({risk_results.get('diabetes_baseline_risk', {}).get('risk_probability', 0)*100:.1f}%)
- Hypertension Risk: {risk_results.get('hypertension_risk', {}).get('hypertension_risk', 0)*100:.1f}%
- Heart Disease Risk: {risk_results.get('heart_disease_risk', {}).get('heart_disease_risk', 0)*100:.1f}%

Please provide specific, actionable recommendations in the following categories:

1. IMMEDIATE ACTIONS (next 24-48 hours)
2. DIETARY RECOMMENDATIONS (specific foods and meal planning)
3. EXERCISE & PHYSICAL ACTIVITY (tailored to current fitness level)
4. LIFESTYLE MODIFICATIONS (sleep, stress, habits)
5. MEDICAL FOLLOW-UP (when to see healthcare providers)

Keep recommendations:
- Specific and actionable
- Appropriate for the risk level
- Realistic and achievable
- Evidence-based
- Encouraging and supportive

Format your response as clear, numbered recommendations under each category."""

        response = cohere_client.generate(
            model='command-r-plus',
            prompt=prompt,
            max_tokens=1500,
            temperature=0.7
        )

        # Parse the AI response into structured recommendations
        ai_text = response.generations[0].text

        # Extract different categories of recommendations
        recommendations = {
            "immediate_actions": extract_section(ai_text, "IMMEDIATE ACTIONS"),
            "dietary_recommendations": extract_section(ai_text, "DIETARY RECOMMENDATIONS"),
            "exercise_recommendations": extract_section(ai_text, "EXERCISE & PHYSICAL ACTIVITY"),
            "lifestyle_modifications": extract_section(ai_text, "LIFESTYLE MODIFICATIONS"),
            "medical_followup": extract_section(ai_text, "MEDICAL FOLLOW-UP"),
            "full_response": ai_text,
            "generated_at": datetime.datetime.now().isoformat()
        }

        return recommendations

    except Exception as e:
        print(f"Error generating AI recommendations: {e}")
        return {
            "error": "Failed to generate AI recommendations",
            "fallback_message": "Please consult with your healthcare provider for personalized health advice.",
            "generated_at": datetime.datetime.now().isoformat()
        }

def extract_section(text: str, section_name: str) -> str:
    """Extract a specific section from the AI response"""
    try:
        lines = text.split('\n')
        section_lines = []
        in_section = False

        for line in lines:
            if section_name.upper() in line.upper():
                in_section = True
                continue
            elif in_section and any(header in line.upper() for header in ['DIETARY', 'EXERCISE', 'LIFESTYLE', 'MEDICAL', 'IMMEDIATE']):
                if section_name.upper() not in line.upper():
                    break
            elif in_section:
                section_lines.append(line.strip())

        return '\n'.join(section_lines).strip()
    except:
        return "Recommendations available in full response."


# --- 1. Authentication Configuration ---
SECRET_KEY = secrets.token_urlsafe(32)  # In production, use environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Fix bcrypt compatibility issues
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12
)
security = HTTPBearer()

# --- 1.5. Cohere AI Configuration ---
COHERE_API_KEY = "i3sREDgLEA9PkqMrGVDn9luv7xwEwIu88Y9GXqT6"
if COHERE_AVAILABLE:
    cohere_client = cohere.Client(COHERE_API_KEY)

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
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],  # Support multiple dev server ports
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
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=15)
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
    return {"status": "AI Wellness Coach API is running!", "ai_available": COHERE_AVAILABLE}

@app.get("/test-ai", tags=["Health Check"])
async def test_ai():
    """Test endpoint to verify Cohere AI is working"""
    if not COHERE_AVAILABLE:
        return {"error": "Cohere AI not available"}

    try:
        response = cohere_client.generate(
            model='command-r-plus',
            prompt="Say hello and confirm you are working as a health coach AI.",
            max_tokens=50,
            temperature=0.7
        )
        return {
            "status": "success",
            "ai_response": response.generations[0].text,
            "model": "command-r-plus"
        }
    except Exception as e:
        return {"error": f"AI test failed: {str(e)}"}

@app.get("/user/health-summary", tags=["Health Data"])
async def get_user_health_summary(current_user: User = Depends(get_current_user)):
    """Get user's latest health assessment data for dashboard display"""
    try:
        with engine.connect() as connection:
            # Get the latest health assessment for the current user
            latest_assessment_query = text("""
                SELECT
                    id, patient_id, assessment_date,
                    age, gender, bmi,
                    diabetes_risk_probability, diabetes_risk_label,
                    hypertension_risk, heart_disease_risk,
                    hba1c_level, blood_glucose_level, systolic_bp, diastolic_bp,
                    exercise_frequency, sleep_hours, stress_level
                FROM health_assessments
                WHERE patient_id = :user_id
                ORDER BY assessment_date DESC
                LIMIT 1
            """)

            result = connection.execute(latest_assessment_query, {"user_id": current_user.id})
            latest_assessment = result.fetchone()

            if not latest_assessment:
                return {
                    "has_data": False,
                    "message": "No health assessments found. Please complete your first health assessment."
                }

            # Get trend data (compare with previous assessment)
            trend_query = text("""
                SELECT
                    diabetes_risk_probability, hypertension_risk, heart_disease_risk,
                    assessment_date
                FROM health_assessments
                WHERE patient_id = :user_id
                ORDER BY assessment_date DESC
                LIMIT 2
            """)

            trend_results = connection.execute(trend_query, {"user_id": current_user.id}).fetchall()

            # Calculate trends
            diabetes_trend = "stable"
            hypertension_trend = "stable"

            if len(trend_results) >= 2:
                current_diabetes = float(trend_results[0][0] or 0)
                previous_diabetes = float(trend_results[1][0] or 0)
                current_hypertension = float(trend_results[0][1] or 0)
                previous_hypertension = float(trend_results[1][1] or 0)

                # Calculate diabetes trend
                if current_diabetes < previous_diabetes - 0.05:
                    diabetes_trend = "improving"
                elif current_diabetes > previous_diabetes + 0.05:
                    diabetes_trend = "worsening"

                # Calculate hypertension trend
                if current_hypertension < previous_hypertension - 0.05:
                    hypertension_trend = "improving"
                elif current_hypertension > previous_hypertension + 0.05:
                    hypertension_trend = "worsening"

            # Determine risk levels
            diabetes_percentage = int((latest_assessment[6] or 0) * 100)
            hypertension_percentage = int((latest_assessment[7] or 0) * 100)

            diabetes_level = "high" if diabetes_percentage >= 60 else "medium" if diabetes_percentage >= 30 else "low"
            hypertension_level = "high" if hypertension_percentage >= 60 else "medium" if hypertension_percentage >= 30 else "low"

            return {
                "has_data": True,
                "user": {
                    "name": current_user.email.split('@')[0].title(),
                    "age": latest_assessment[3] or 0,
                    "points": 1250,  # TODO: Implement actual points system
                    "streak": 7,     # TODO: Implement actual streak calculation
                    "level": "Health Enthusiast"  # TODO: Implement level system
                },
                "risks": {
                    "diabetes": {
                        "level": diabetes_level,
                        "percentage": diabetes_percentage,
                        "trend": diabetes_trend
                    },
                    "hypertension": {
                        "level": hypertension_level,
                        "percentage": hypertension_percentage,
                        "trend": hypertension_trend
                    }
                },
                "latest_assessment": {
                    "id": latest_assessment[0],
                    "date": latest_assessment[2].isoformat() if latest_assessment[2] else None,
                    "bmi": float(latest_assessment[5]) if latest_assessment[5] else None,
                    "hba1c": float(latest_assessment[10]) if latest_assessment[10] else None,
                    "blood_glucose": float(latest_assessment[11]) if latest_assessment[11] else None,
                    "blood_pressure": f"{latest_assessment[12] or 0}/{latest_assessment[13] or 0}",
                    "exercise_frequency": latest_assessment[14],
                    "sleep_hours": float(latest_assessment[15]) if latest_assessment[15] else None,
                    "stress_level": latest_assessment[16]
                }
            }

    except Exception as e:
        print(f"Error fetching user health summary: {e}")
        return {
            "has_data": False,
            "error": f"Failed to fetch health data: {str(e)}"
        }

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
    Receives all patient data, saves comprehensive health assessment,
    generates AI recommendations, and returns a complete health profile.
    Requires authentication.
    """
    try:
        # Get predictions from all models
        baseline_diabetes_pred = predict_baseline_diabetes_risk(data.diabetes_baseline_features.model_dump())

        realtime_agg_input = data.glucose_realtime_features.model_dump()
        sequence_array = np.array(realtime_agg_input.pop("glucose_sequence"))
        realtime_glucose_pred = predict_glucose_event_risk(realtime_agg_input, sequence_array)

        hypertension_pred = predict_hypertension_risk(data.hypertension_features.model_dump())
        heart_disease_pred = predict_heart_disease_risk(data.heart_disease_features.model_dump())

        risk_results = {
            "diabetes_baseline_risk": baseline_diabetes_pred,
            "glucose_realtime_risk": realtime_glucose_pred,
            "hypertension_risk": hypertension_pred,
            "heart_disease_risk": heart_disease_pred
        }

        # Save comprehensive health assessment to database
        with engine.connect() as connection:
            # Insert comprehensive health assessment
            assessment_query = text("""
                INSERT INTO health_assessments (
                    patient_id, age, gender, height, weight, bmi,
                    hypertension, heart_disease, diabetes,
                    family_history_diabetes, family_history_heart, family_history_hypertension,
                    smoking_history, alcohol_consumption, exercise_frequency, sleep_hours, stress_level, energy_level,
                    hba1c_level, blood_glucose_level, systolic_bp, diastolic_bp,
                    cholesterol_total, cholesterol_hdl, triglycerides,
                    diet_type, meals_per_day, water_intake, fast_food_frequency,
                    diabetes_risk_probability, diabetes_risk_label,
                    glucose_event_risk, glucose_variability,
                    hypertension_risk, heart_disease_risk
                ) VALUES (
                    :patient_id, :age, :gender, :height, :weight, :bmi,
                    :hypertension, :heart_disease, :diabetes,
                    :family_history_diabetes, :family_history_heart, :family_history_hypertension,
                    :smoking_history, :alcohol_consumption, :exercise_frequency, :sleep_hours, :stress_level, :energy_level,
                    :hba1c_level, :blood_glucose_level, :systolic_bp, :diastolic_bp,
                    :cholesterol_total, :cholesterol_hdl, :triglycerides,
                    :diet_type, :meals_per_day, :water_intake, :fast_food_frequency,
                    :diabetes_risk_probability, :diabetes_risk_label,
                    :glucose_event_risk, :glucose_variability,
                    :hypertension_risk, :heart_disease_risk
                )
            """)

            # Extract comprehensive patient data (this would come from the enhanced form)
            patient_data = {
                "patient_id": data.patient_id,
                "age": data.diabetes_baseline_features.age,
                "gender": data.diabetes_baseline_features.gender,
                "height": 170,  # Default values - these would come from enhanced form
                "weight": 70,
                "bmi": data.diabetes_baseline_features.bmi,
                "hypertension": data.diabetes_baseline_features.hypertension,
                "heart_disease": data.diabetes_baseline_features.heart_disease,
                "diabetes": 0,  # Default
                "family_history_diabetes": 0,  # Default
                "family_history_heart": 0,  # Default
                "family_history_hypertension": 0,  # Default
                "smoking_history": data.diabetes_baseline_features.smoking_history,
                "alcohol_consumption": "moderate",  # Default
                "exercise_frequency": "moderate",  # Default
                "sleep_hours": 7,  # Default
                "stress_level": "moderate",  # Default
                "energy_level": "good",  # Default
                "hba1c_level": data.diabetes_baseline_features.HbA1c_level,
                "blood_glucose_level": data.diabetes_baseline_features.blood_glucose_level,
                "systolic_bp": 120,  # Default
                "diastolic_bp": 80,  # Default
                "cholesterol_total": 180,  # Default
                "cholesterol_hdl": 50,  # Default
                "triglycerides": 150,  # Default
                "diet_type": "balanced",  # Default
                "meals_per_day": 3,  # Default
                "water_intake": 8,  # Default
                "fast_food_frequency": "rarely",  # Default
                "diabetes_risk_probability": baseline_diabetes_pred["risk_probability"],
                "diabetes_risk_label": baseline_diabetes_pred["risk_label"],
                "glucose_event_risk": realtime_glucose_pred["event_risk"],
                "glucose_variability": realtime_glucose_pred["glucose_variability"],
                "hypertension_risk": hypertension_pred["hypertension_risk"],
                "heart_disease_risk": heart_disease_pred["heart_disease_risk"]
            }

            result = connection.execute(assessment_query, patient_data)
            assessment_id = result.lastrowid

            # Also save to legacy vitals table for backward compatibility
            vitals_query = text("""
                INSERT INTO vitals (patient_id, timestamp, bmi, HbA1c_level, blood_glucose_level)
                VALUES (:patient_id, :timestamp, :bmi, :HbA1c_level, :blood_glucose_level)
            """)
            connection.execute(vitals_query, {
                "patient_id": data.patient_id,
                "timestamp": datetime.datetime.now(),
                "bmi": data.diabetes_baseline_features.bmi,
                "HbA1c_level": data.diabetes_baseline_features.HbA1c_level,
                "blood_glucose_level": data.diabetes_baseline_features.blood_glucose_level
            })

            connection.commit()

        # Generate AI health coaching recommendations
        ai_recommendations = await generate_health_recommendations(patient_data, risk_results)

        # Save AI recommendations to database
        if "error" not in ai_recommendations:
            with engine.connect() as connection:
                recommendation_categories = [
                    ("immediate", ai_recommendations.get("immediate_actions", ""), "high"),
                    ("dietary", ai_recommendations.get("dietary_recommendations", ""), "medium"),
                    ("exercise", ai_recommendations.get("exercise_recommendations", ""), "medium"),
                    ("lifestyle", ai_recommendations.get("lifestyle_modifications", ""), "medium"),
                    ("medical", ai_recommendations.get("medical_followup", ""), "high")
                ]

                for category, recommendation_text, priority in recommendation_categories:
                    if recommendation_text.strip():
                        rec_query = text("""
                            INSERT INTO ai_recommendations (assessment_id, patient_id, recommendation_type, recommendation_text, priority_level, category)
                            VALUES (:assessment_id, :patient_id, :recommendation_type, :recommendation_text, :priority_level, :category)
                        """)
                        connection.execute(rec_query, {
                            "assessment_id": assessment_id,
                            "patient_id": data.patient_id,
                            "recommendation_type": category,
                            "recommendation_text": recommendation_text,
                            "priority_level": priority,
                            "category": category
                        })

                connection.commit()

        return {
            "database_status": "Comprehensive health assessment saved successfully",
            "patient_id": data.patient_id,
            "assessment_id": assessment_id,
            "risk_profile": risk_results,
            "ai_recommendations": ai_recommendations,
            "health_trends_logged": True
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")