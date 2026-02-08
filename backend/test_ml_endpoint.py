"""Quick test script to verify ML endpoint."""
import requests

url = "http://127.0.0.1:8000/predict-congestion"
payload = {
    "u": "Andheri East",
    "v": "Andheri West",
    "hour": 10,
    "rain_intensity": 0.0,
    "visibility": 1.0,
    "temperature": 30.0,
    "event_type": "None"
}

try:
    response = requests.post(url, json=payload)
    print("Status:", response.status_code)
    print("Response:", response.json())
except Exception as e:
    print("Error:", e)
