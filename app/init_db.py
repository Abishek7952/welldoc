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

        # Create vitals table
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
        connection.execute(create_vitals_query)
        connection.commit()
        print("Users and vitals tables created successfully!")

if __name__ == "__main__":
    create_tables()
