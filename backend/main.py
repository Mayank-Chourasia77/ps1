from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
# Allow running as a package (backend.main) or as a script (main)
try:
    from .game_theory import calculate_metrics
except ImportError:
    from game_theory import calculate_metrics
from openai import OpenAI
import os
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

app = FastAPI()

# Enable CORS for your Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# LOAD DATA (Global Variable)
# Assuming final_traffic_names.csv is in the root directory (parent of backend)
# Adjust path if needed
try:
    df = pd.read_csv("final_traffic_names.csv")
except FileNotFoundError:
    if os.path.exists("final_traffic_names.csv"):
        df = pd.read_csv("final_traffic_names.csv")
    elif os.path.exists("../final_traffic_names.csv"):
        df = pd.read_csv("../final_traffic_names.csv")
    else:
        # Fallback to empty DataFrame or error
        print("Error: final_traffic_names.csv not found")
        df = pd.DataFrame(columns=["from", "to", "congestion"])

# FEATHERLESS SETUP
# Use environment variable for API key
FEATHERLESS_API_KEY = os.getenv("FEATHERLESS_API_KEY")
if not FEATHERLESS_API_KEY:
    # Fallback or just empty string, user needs to set it
    FEATHERLESS_API_KEY = "YOUR_FEATHERLESS_KEY_HERE"

client = OpenAI(
    base_url="https://api.featherless.ai/v1",
    api_key=FEATHERLESS_API_KEY 
)

class InsightRequest(BaseModel):
    poa: float
    location: str
    congestion: float
    intent: str | None = None
    query: str | None = None

@app.get("/traffic-status")
def get_traffic_status():
    # Convert DataFrame to list of dicts
    if df.empty:
        return {"error": "No traffic data available"}
        
    traffic_list = df.to_dict(orient="records")
    
    # Calculate Game Theory Metrics
    metrics = calculate_metrics(traffic_list)
    
    # Identify the worst bottleneck (Highest congestion)
    if 'congestion' in df.columns:
        worst_road_idx = df['congestion'].idxmax()
        worst_road = df.loc[worst_road_idx]
        bottleneck = {
            "from": worst_road['from'],
            "to": worst_road['to'],
            "congestion": worst_road['congestion']
        }
    else:
        bottleneck = {}

    
    return {
        "graph_data": traffic_list,
        "metrics": metrics,
        "bottleneck": bottleneck
    }

@app.post("/ai-insight")
def get_ai_insight(req: InsightRequest):
    # Base Context
    system_context = f"""
    You are a Traffic Control AI called "Traffix".
    Current Situation:
    - Bottleneck: {req.location}
    - Congestion: {req.congestion}%
    - Price of Anarchy (PoA): {req.poa}
    """
    
    format_type = "text"
    prompt = ""

    # Check for user query or intent
    if req.query:
        # User asked a specific question - Force JSON structure
        prompt = system_context + f"\nUser Question: {req.query}\nProvide a structured JSON response with keys: 'cause', 'impact', 'action', 'cooldown'. Values should be concise strings."
        format_type = "json"
    elif req.intent:
        # Predefined intents - Force JSON structure for better UI
        format_type = "json"
        if req.intent == "cause":
            prompt = system_context + "\nExplain why traffic is high. Return JSON with key 'cause'."
        elif req.intent == "routes":
            prompt = system_context + "\nSuggest rerouting. Return JSON with key 'action'."
        elif req.intent == "cooldown":
            prompt = system_context + "\nEstimate cooldown. Return JSON with key 'cooldown'."
        elif req.intent == "strategy":
            prompt = system_context + "\nPropose strategy. Return JSON with keys 'action' and 'impact'."
        else:
             prompt = system_context + "\nAnalyze. Return JSON with keys 'cause', 'impact', 'action'."
    else:
        # Default behavior (legacy) - Text only
        prompt = system_context + """
        1. Explain in 1 sentence why the PoA is high (mention 'Nash Equilibrium').
        2. Suggest 1 specific Mechanism Design intervention.
        """
        format_type = "text"
    
    try:
        response = client.chat.completions.create(
            model="deepseek-ai/DeepSeek-V3",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=250,
            response_format={"type": "json_object"} if format_type == "json" else None
        )
        content = response.choices[0].message.content
        return {"insight": content, "format": format_type}
    except Exception as e:
        return {"insight": f"System Overload: {str(e)}", "format": "text"}
