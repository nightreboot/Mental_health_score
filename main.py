import joblib
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Literal
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
model = joblib.load("mental_health_model.pkl")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class validate_input(BaseModel):
    age : int = Field(ge = 10, le = 100)
    gender : Literal["Male", "Female"]
    country : str
    academic_level : Literal['Undergraduate', 'Graduate', 'High School']
    most_used_platform : Literal['Facebook', 'LinkedIn', 'Instagram', 'Snapchat','Twitter','YouTube', 'TikTok', 'LINE', 'KakaoTalk', 'VKontakte', 'WhatsApp','WeChat']
    avg_daily_usage_hours : float = Field(ge = 0, le = 24)
    daily_unlocks : int   = Field(..., ge=0)
    study_hours : float = Field(..., ge=0, le=24)
    physical_activity_hours : float = Field(..., ge=0, le=24)
    sleep_hours_per_night : float = Field(..., ge=0, le=24)
    stress_level : Literal['Medium', 'Low', 'Very High', 'High']
    purpose_of_use : Literal['Networking', 'Education', 'Entertainment', 'News']

top_10_countries = ['Other','India','USA','Canada','Australia','UK','Germany','Mexico','Turkey','France']

class predictable_feature(BaseModel):
    mental_health_score : float

@app.get("/")
def home():
    return {"message": "Mental health model API running"}

@app.post("/predict", response_model= predictable_feature)
def main(input : validate_input):
    Country = input.country if input.country in top_10_countries else "other"
    input_row = pd.DataFrame([{
        'Age'                       :input.age,
        'Gender'                    :input.gender,
        'Country'                   :input.country,
        'Academic_Level'            :input.academic_level,
        'Most_Used_Platform'        :input.most_used_platform,
        'Purpose_Of_Use'            :input.purpose_of_use,
        'Avg_Daily_Usage_Hours'     :input.avg_daily_usage_hours,
        'Daily_Unlocks'             :input.daily_unlocks,
        'Study_Hours'               :input.study_hours,
        'Physical_Activity_Hours'   :input.physical_activity_hours,
        'Sleep_Hours_Per_Night'     :input.sleep_hours_per_night,
        'Stress_Level'              :input.stress_level,
        'Grouped_country'           :Country
   }])

    score = model.predict(input_row)[0]

    return predictable_feature(mental_health_score=round(float(score),2))


