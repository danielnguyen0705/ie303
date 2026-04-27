from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict
import joblib
import pandas as pd
import os

app = FastAPI(title="Student Skill ML API")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "saved_models")

# Global variables for models
strong_model = None
weak_model = None
trend_model = None
feature_map = None
expected_features = []

class StudentData(BaseModel):
    model_config = ConfigDict(extra='allow')
    
    role: str = "USER"
    coin: int = 0
    score: int = 0
    streak: int = 0
    days_since_last_study: int = 0
    vip_days_remaining: int = 0
    is_vip_active: int = 0
    grade_id: int = 1
    
    unit_progress_percent: float = 0.0
    section_progress_percent: float = 0.0
    
    active_days_7d: int = 0
    active_days_14d: int = 0
    active_days_30d: int = 0
    
    lessons_completed_7d: int = 0
    lessons_completed_14d: int = 0
    lessons_completed_30d: int = 0
    
    questions_answered_7d: int = 0
    questions_answered_14d: int = 0
    questions_answered_30d: int = 0
    
    accuracy_7d: float = 0.0
    accuracy_14d: float = 0.0
    accuracy_30d: float = 0.0
    
    avg_attempt_count_7d: float = 1.0
    coins_earned_7d: int = 0
    coins_earned_30d: int = 0
    
    writing_eval_count_30d: int = 0
    speaking_eval_count_30d: int = 0
    avg_writing_ai_score_30d: float = 0.0
    avg_speaking_ai_score_30d: float = 0.0
    
    skip_item_quantity: int = 0
    
    listening_accuracy_30d: float = 0.0
    speaking_accuracy_30d: float = 0.0
    reading_accuracy_30d: float = 0.0
    writing_accuracy_30d: float = 0.0
    vocabulary_accuracy_30d: float = 0.0
    grammar_accuracy_30d: float = 0.0

@app.on_event("startup")
def load_models():
    global strong_model, weak_model, trend_model, feature_map, expected_features
    try:
        strong_model = joblib.load(os.path.join(MODEL_DIR, "strong_skill_model.pkl"))
        weak_model = joblib.load(os.path.join(MODEL_DIR, "weak_skill_model.pkl"))
        trend_model = joblib.load(os.path.join(MODEL_DIR, "trend_label_model.pkl"))
        feature_map = joblib.load(os.path.join(MODEL_DIR, "feature_map.pkl"))
        expected_features = feature_map["weak_skill"]
        print("Models loaded successfully.")
    except Exception as e:
        print(f"Error loading models: {e}")
        print("Please run train.py first to generate models.")

@app.post("/predict")
def predict_skills(data: StudentData):
    if not strong_model or not weak_model or not trend_model:
        raise HTTPException(status_code=503, detail="Models not loaded")

    # Convert to dictionary including any extra allowed fields
    student_dict = data.model_dump()
    
    # Create DataFrame
    X_new = pd.DataFrame([student_dict])
    
    # Fill missing columns with 0
    for col in expected_features:
        if col not in X_new.columns:
            X_new[col] = 0
            
    # Ensure correct column order
    X_new = X_new[expected_features]
    
    try:
        pred_strong = strong_model.predict(X_new)[0]
        pred_weak = weak_model.predict(X_new)[0]
        pred_trend = trend_model.predict(X_new)[0]
        
        return {
            "strongSkill": pred_strong,
            "weakSkill": pred_weak,
            "trendLabel": pred_trend
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
