# app/init_db.py

from sqlalchemy import create_engine, text

DATABASE_URL = "mysql+pymysql://root:root@127.0.0.1/welldoc_db"

def create_tables():
    """Create all required tables if they don't exist."""
    engine = create_engine(DATABASE_URL)

    with engine.connect() as connection:
        # Create users table
        create_users_query = text("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                user_type ENUM('patient', 'clinician') DEFAULT 'patient',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """)

        # Create comprehensive health assessments table
        create_health_assessments_query = text("""
            CREATE TABLE IF NOT EXISTS health_assessments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                patient_id INT NOT NULL,
                assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                -- Personal Information
                age INT,
                gender VARCHAR(10),
                height INT,
                weight INT,
                bmi DECIMAL(5,2),

                -- Medical History
                hypertension BOOLEAN DEFAULT FALSE,
                heart_disease BOOLEAN DEFAULT FALSE,
                diabetes BOOLEAN DEFAULT FALSE,
                family_history_diabetes BOOLEAN DEFAULT FALSE,
                family_history_heart BOOLEAN DEFAULT FALSE,
                family_history_hypertension BOOLEAN DEFAULT FALSE,
                medications_count INT DEFAULT 0,

                -- Lifestyle Factors
                smoking_history VARCHAR(20),
                alcohol_consumption VARCHAR(20),
                exercise_frequency VARCHAR(20),
                sleep_hours INT,
                stress_level VARCHAR(20),
                energy_level VARCHAR(20),

                -- Vital Signs & Lab Results
                hba1c_level DECIMAL(4,2),
                blood_glucose_level INT,
                systolic_bp INT,
                diastolic_bp INT,
                cholesterol_total INT,
                cholesterol_ldl INT,
                cholesterol_hdl INT,
                triglycerides INT,

                -- Dietary Information
                diet_type VARCHAR(20),
                meals_per_day INT,
                water_intake INT,
                fast_food_frequency VARCHAR(20),

                -- Risk Assessment Results
                diabetes_risk_probability DECIMAL(5,4),
                diabetes_risk_label VARCHAR(10),
                glucose_event_risk DECIMAL(5,4),
                glucose_variability DECIMAL(8,4),
                hypertension_risk DECIMAL(5,4),
                heart_disease_risk DECIMAL(5,4),

                INDEX idx_patient_id (patient_id),
                INDEX idx_assessment_date (assessment_date)
            )
        """)

        # Create AI recommendations table
        create_ai_recommendations_query = text("""
            CREATE TABLE IF NOT EXISTS ai_recommendations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                assessment_id INT NOT NULL,
                patient_id INT NOT NULL,
                recommendation_type VARCHAR(50), -- 'food', 'exercise', 'lifestyle', 'medical'
                recommendation_text TEXT,
                priority_level VARCHAR(10), -- 'low', 'medium', 'high', 'urgent'
                category VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (assessment_id) REFERENCES health_assessments(id) ON DELETE CASCADE,
                INDEX idx_patient_id (patient_id),
                INDEX idx_assessment_id (assessment_id),
                INDEX idx_recommendation_type (recommendation_type)
            )
        """)

        # Create health trends table for tracking changes over time
        create_health_trends_query = text("""
            CREATE TABLE IF NOT EXISTS health_trends (
                id INT AUTO_INCREMENT PRIMARY KEY,
                patient_id INT NOT NULL,
                metric_name VARCHAR(50), -- 'bmi', 'blood_pressure', 'glucose', etc.
                metric_value DECIMAL(10,4),
                metric_unit VARCHAR(20),
                recorded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                assessment_id INT,

                FOREIGN KEY (assessment_id) REFERENCES health_assessments(id) ON DELETE SET NULL,
                INDEX idx_patient_id (patient_id),
                INDEX idx_metric_name (metric_name),
                INDEX idx_recorded_date (recorded_date)
            )
        """)

        # Create vitals table (simplified, keeping for backward compatibility)
        create_vitals_query = text("""
            CREATE TABLE IF NOT EXISTS vitals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                patient_id INT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                bmi DECIMAL(5,2),
                HbA1c_level DECIMAL(4,2),
                blood_glucose_level INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_patient_id (patient_id),
                INDEX idx_timestamp (timestamp)
            )
        """)

        connection.execute(create_users_query)
        connection.execute(create_health_assessments_query)
        connection.execute(create_ai_recommendations_query)
        connection.execute(create_health_trends_query)
        connection.execute(create_vitals_query)
        connection.commit()
        print("All database tables created successfully!")
        print("- Users table")
        print("- Health assessments table")
        print("- AI recommendations table")
        print("- Health trends table")
        print("- Vitals table (legacy)")

if __name__ == "__main__":
    create_tables()
