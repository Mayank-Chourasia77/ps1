"""
Traffic Congestion ML Training Script
Trains a Gradient Boosting Regressor on traffic_data_simulated.csv
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_squared_error, mean_absolute_error
import joblib
import os

# --- Configuration ---
DATA_PATH = "../traffic_data_simulated.csv"
MODEL_PATH = "models/traffic_model.joblib"
ENCODERS_PATH = "models/label_encoders.joblib"

# Features for prediction
FEATURE_COLS = ['u', 'v', 'hour', 'rain_intensity', 'visibility', 'temperature', 'event_type', 'time_of_day_factor']
TARGET_COL = 'congestion_level'

def train_model():
    print("=" * 50)
    print("Traffic Congestion ML Model Training")
    print("=" * 50)
    
    # Load data
    print("\n[1/6] Loading data...")
    df = pd.read_csv(DATA_PATH)
    print(f"   Loaded {len(df)} rows")
    
    # Feature Engineering: Extract hour from timestamp
    print("\n[2/6] Feature engineering...")
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df['hour'] = df['timestamp'].dt.hour
    
    # Prepare features
    print("\n[3/6] Encoding categorical features...")
    label_encoders = {}
    
    # Encode 'u' (source node)
    le_u = LabelEncoder()
    df['u_encoded'] = le_u.fit_transform(df['u'])
    label_encoders['u'] = le_u
    
    # Encode 'v' (target node)
    le_v = LabelEncoder()
    df['v_encoded'] = le_v.fit_transform(df['v'])
    label_encoders['v'] = le_v
    
    # Encode 'event_type'
    le_event = LabelEncoder()
    df['event_type_encoded'] = le_event.fit_transform(df['event_type'])
    label_encoders['event_type'] = le_event
    
    # Prepare final feature matrix
    X = df[['u_encoded', 'v_encoded', 'hour', 'rain_intensity', 'visibility', 'temperature', 'event_type_encoded', 'time_of_day_factor']].values
    y = df[TARGET_COL].values
    
    print(f"   Feature shape: {X.shape}")
    print(f"   Target shape: {y.shape}")
    
    # Train/Test Split
    print("\n[4/6] Splitting data (80/20)...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"   Training samples: {len(X_train)}")
    print(f"   Test samples: {len(X_test)}")
    
    # Train Model
    print("\n[5/6] Training Gradient Boosting Regressor...")
    model = GradientBoostingRegressor(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=5,
        random_state=42,
        verbose=0
    )
    model.fit(X_train, y_train)
    print("   Training complete!")
    
    # Evaluate
    print("\n[6/6] Evaluating model...")
    y_pred = model.predict(X_test)
    
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)
    
    print(f"\n   ========== RESULTS ==========")
    print(f"   RMSE: {rmse:.4f}")
    print(f"   MAE:  {mae:.4f}")
    print(f"   ================================")
    
    # Save model and encoders
    print("\n[SAVE] Saving model and encoders...")
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(label_encoders, ENCODERS_PATH)
    print(f"   Model saved to: {MODEL_PATH}")
    print(f"   Encoders saved to: {ENCODERS_PATH}")
    
    print("\n" + "=" * 50)
    print("Training Complete!")
    print("=" * 50)
    
    return model, label_encoders

if __name__ == "__main__":
    train_model()
