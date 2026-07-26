# Signal — Social Media & Student Mental Health Predictor

**Live demo:** https://mental-health-score-1-rbuc.onrender.com

Signal is a small end-to-end ML project that estimates a student's mental
health score (0–10) from their daily digital and lifestyle habits — screen
time, phone unlocks, sleep, study hours, physical activity, stress level, and
more. It's built as a mirror, not a diagnosis: fill in a typical day and get
an illustrative reading, powered by a Random Forest model trained on 5,000
student records.

![status](https://img.shields.io/badge/status-active-brightgreen)
![python](https://img.shields.io/badge/python-3.10%2B-blue)
![model](https://img.shields.io/badge/model-RandomForestRegressor-teal)

## What it does

- A single-page frontend (`index.html` / `style.css` / `script.js`) collects
  a day's worth of inputs — age, gender, country, academic level, platform,
  purpose of use, screen time, unlocks, study hours, activity, sleep, and
  self-rated stress.
- The form calls a FastAPI backend (`main.py`) deployed on Render, which
  loads a trained scikit-learn pipeline (`mental_health_model.pkl`) and
  returns a predicted mental health score.
- The result is rendered as an animated gauge with a plain-language read on
  where the score falls (Poor / Concerning / Moderate / Good).

## Project structure

```
.
├── index.html                                    # UI markup
├── style.css                                      # styling (Fraunces + IBM Plex, gauge animation)
├── script.js                                       # form handling, API call, gauge rendering
├── main.py                                          # FastAPI inference service
├── requiredmets.txt                                 # Python dependencies
├── mental_health_model.pkl                          # trained sklearn pipeline
├── mental_health_Prediction.ipynb                   # EDA, preprocessing, training, tuning
└── Student_Social_Media_And_Mental_Health_Impact.csv # training data (5,000 rows)
```

## The model

Explored in `mental_health_Prediction.ipynb`:

| Model | Test R² | Test MAE |
|---|---|---|
| Linear Regression | 0.74 | 0.53 |
| Random Forest (default) | 0.88 | 0.33 |
| Random Forest (tuned via `RandomizedSearchCV`) | **0.88** | **0.34** |

The final pipeline combines:
- **Numeric features** — Age, Avg_Daily_Usage_Hours, Daily_Unlocks,
  Physical_Activity_Hours, Sleep_Hours_Per_Night (scaled)
- **Skewed feature** — Study_Hours (transformed separately)
- **Ordinal feature** — Stress_Level (Low → Very High)
- **One-hot features** — Gender, Academic_Level, Most_Used_Platform,
  Purpose_Of_Use, Country

...wrapped in a scikit-learn `Pipeline` with a `RandomForestRegressor`, tuned
over `n_estimators`, `max_depth`, `min_samples_split`, and `min_samples_leaf`
with 5-fold cross-validation, then serialized with `joblib`.

## Running it locally

### Backend

```bash
pip install -r requiredmets.txt
uvicorn main:app --reload
```

The API exposes:
- `GET /` — health check
- `POST /predict` — takes the student profile as JSON, returns
  `{ "mental_health_score": float }`

### Frontend

Just open `index.html` in a browser, or serve the folder with any static
file server. By default it points at the deployed Render API
(`API_URL` at the top of `script.js`) — update that constant to point at
`http://localhost:8000/predict` if you're running the backend locally.

## Tech stack

- **Frontend:** vanilla HTML/CSS/JS, no framework — SVG gauge, custom
  design system (Fraunces + IBM Plex Sans/Mono)
- **Backend:** FastAPI + Pydantic for validation, served with Uvicorn
- **ML:** scikit-learn (Pipeline, RandomForestRegressor, RandomizedSearchCV),
  pandas, joblib
- **Deployment:** Render

## Disclaimer

This tool is for illustration only. It is trained on a single survey
dataset and is not a clinical or diagnostic instrument. If the reading (or
your actual day-to-day) concerns you, please talk to a mental health
professional.

## License

MIT — feel free to fork, adapt, and build on this.
