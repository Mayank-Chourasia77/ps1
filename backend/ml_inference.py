"""
ML Inference Module for Traffic Congestion Prediction
Loads the trained model and provides prediction functions.
"""
import joblib
import os
import numpy as np

# --- Paths ---
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(MODEL_DIR, "models", "traffic_model.joblib")
ENCODERS_PATH = os.path.join(MODEL_DIR, "models", "label_encoders.joblib")

class TrafficPredictor:
    def __init__(self):
        self.model = None
        self.encoders = None
        # Lazy load: model will be loaded on first prediction
        print("[ML] Initialized TrafficPredictor (Lazy Loading)")
    
    def _ensure_model_loaded(self):
        """Load the trained model and encoders if not already loaded."""
        if self.model is None or self.encoders is None:
            print("[ML] Loading model artifacts...")
            try:
                if os.path.exists(MODEL_PATH) and os.path.exists(ENCODERS_PATH):
                    self.model = joblib.load(MODEL_PATH)
                    self.encoders = joblib.load(ENCODERS_PATH)
                    print(f"[ML] Model loaded successfully from {MODEL_PATH}")
                else:
                    print(f"[ML] WARNING: Model not found at {MODEL_PATH}. Train the model first!")
            except Exception as e:
                print(f"[ML] Error loading model: {e}")

    
    def predict_congestion(self, u: str, v: str, hour: int, rain_intensity: float, 
                           visibility: float, temperature: float, event_type: str,
                           time_of_day_factor: float = 1.0) -> dict:
        """
        Predict congestion for a given edge and conditions.
        
        Returns:
            dict: {
                "congestion": float (0-100%),
                "speed": float (km/h),
                "confidence": str ("Low", "Medium", "High")
            }
        """
        # Lazy load if needed
        self._ensure_model_loaded()
        
        if self.model is None:
             print("[ML] Model still None after load attempt. Using heuristic fallback.")
             # Fallback Heuristic: simple hash based on inputs to give deterministic but varied output per route
             seed = hash(u + v + str(hour))
             import random
             random.seed(seed)
             congestion_pct = random.uniform(20, 90)
             speed = 60 * (1 - congestion_pct/100)
             return {
                 "congestion": round(congestion_pct, 1),
                 "speed": round(speed, 1),
                 "confidence": "Low (Heuristic)"
             }
        
        try:
             # Check if encoders are actually loaded
             if self.encoders is None:
                  raise ValueError("Encoders not loaded")

             # Safe encode with fallback to 0
             u_encoded = 0
             if 'u' in self.encoders:
                  try:
                       u_encoded = self.encoders['u'].transform([u])[0]
                  except:
                       pass
                       
             v_encoded = 0
             if 'v' in self.encoders:
                  try:
                       v_encoded = self.encoders['v'].transform([v])[0]
                  except:
                       pass

             event_encoded = 0
             if 'event_type' in self.encoders:
                  try:
                       event_encoded = self.encoders['event_type'].transform([event_type])[0]
                  except:
                       pass

             features = np.array([[
                 u_encoded,
                 v_encoded,
                 hour,
                 rain_intensity,
                 visibility,
                 temperature,
                 event_encoded,
                 time_of_day_factor
             ]])
             
             prediction = self.model.predict(features)[0]
             
             # Clamp
             prediction = max(0.0, min(1.0, prediction))
             
             congestion_pct = prediction * 100
             base_speed = 60.0
             predicted_speed = base_speed * (1 - prediction * 0.7)
             predicted_speed = max(10.0, predicted_speed)
             
             # Confidence logic
             conf = "Medium"
             if prediction < 0.2 or prediction > 0.8:
                  conf = "High"
             
             return {
                 "congestion": round(congestion_pct, 1),
                 "speed": round(predicted_speed, 1),
                 "confidence": conf
             }

        except Exception as e:
            print(f"[ML] Prediction Error: {e}")
            # Fallback Heuristic on error
            seed = hash(u + v + str(hour))
            import random
            random.seed(seed)
            congestion_pct = random.uniform(20, 90)
            return {
                "congestion": round(congestion_pct, 1),
                "speed": round(60 * (1 - congestion_pct/100), 1),
                "confidence": "Low (Fallback)"
            }
    
    def _safe_encode(self, encoder_name: str, value: str) -> int:
        """Safely encode a categorical value, handling unseen labels."""
        if self.encoders is None:
            return 0
            
        encoder = self.encoders.get(encoder_name)
        if encoder is None:
            return 0
        
        try:
            return encoder.transform([value])[0]
        except ValueError:
            # Unseen label - return 0 (or could use a special "unknown" category)
            return 0

# Global instance for FastAPI
traffic_predictor = TrafficPredictor()
