# Traffic Optimization Dashboard

This project visualizes traffic data using a React frontend and a Python FastAPI backend, integrating Featherless AI for insights.

## Prerequisites

- **Python 3.8+**
- **Node.js 16+** & **npm**

## Setup & Running

### 1. Backend (FastAPI)

Navigate to the project root or backend directory.

1.  **Install Dependencies** (if not already installed):
    ```bash
    pip install fastapi uvicorn pandas openai python-dotenv
    ```

2.  **Ensure Environment Variables**:
    - Check `.env` in the root directory contains your `FEATHERLESS_API_KEY`.

3.  **Run Server**:
    ```bash
    # From project root
    uvicorn backend.main:app --reload
    ```
    The backend will start at `http://127.0.0.1:8000`.

### 2. Frontend (React)

Navigate to the `frontend` directory.

1.  **Install Dependencies**:
    ```bash
    cd frontend
    npm install
    ```

2.  **Start Development Server**:
    ```bash
    npm run dev
    ```
    The frontend will start at `http://localhost:5173` (or similar).

## Usage

- **Dashboard**: View the traffic graph. Nodes are intersections, links are roads.
- **Metrics**: See "Price of Anarchy" and system status on the left.
- **Toggle**: Switch "ACTIVATE MECHANISM DESIGN" to see the optimized state.
- **AI Insight**: The panel at the bottom left will display Featherless AI analysis of the current traffic situation.
