// ============ config ============
const API_URL = "https://mental-health-score-9j9p.onrender.com";
document.getElementById("api-url-echo").textContent = API_URL;

// ============ countries ============
const COUNTRIES = [
  "Afghanistan","Albania","Andorra","Argentina","Armenia","Australia","Austria",
  "Azerbaijan","Bahamas","Bahrain","Bangladesh","Belarus","Belgium","Bhutan",
  "Bolivia","Bosnia","Brazil","Bulgaria","Canada","Chile","China","Colombia",
  "Costa Rica","Croatia","Cyprus","Czech Republic","Denmark","Ecuador","Egypt",
  "Estonia","Finland","France","Georgia","Germany","Ghana","Greece","Hong Kong",
  "Hungary","Iceland","India","Indonesia","Iraq","Ireland","Israel","Italy",
  "Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kosovo","Kuwait","Kyrgyzstan",
  "Latvia","Lebanon","Liechtenstein","Lithuania","Luxembourg","Malaysia",
  "Maldives","Malta","Mexico","Moldova","Monaco","Montenegro","Morocco","Nepal",
  "Netherlands","New Zealand","Nigeria","North Macedonia","Norway","Oman",
  "Other","Pakistan","Panama","Paraguay","Peru","Philippines","Poland",
  "Portugal","Qatar","Romania","Russia","San Marino","Serbia","Singapore",
  "Slovakia","Slovenia","South Africa","South Korea","Spain","Sri Lanka",
  "Sweden","Switzerland","Syria","Taiwan","Tajikistan","Thailand","Trinidad",
  "Turkey","UAE","UK","USA","Ukraine","Uruguay","Uzbekistan","Vatican City",
  "Venezuela","Vietnam","Yemen"
];

const countrySelect = document.getElementById("country-select");
COUNTRIES.forEach((c) => {
  const opt = document.createElement("option");
  opt.value = c;
  opt.textContent = c;
  if (c === "USA") opt.selected = true;
  countrySelect.appendChild(opt);
});

// ============ slider live readouts ============
const sliderMap = [
  ["Avg_Daily_Usage_Hours", "usage-out", (v) => v.toFixed(1)],
  ["Daily_Unlocks", "unlocks-out", (v) => Math.round(v)],
  ["Study_Hours", "study-out", (v) => v.toFixed(1)],
  ["Physical_Activity_Hours", "activity-out", (v) => v.toFixed(1)],
  ["Sleep_Hours_Per_Night", "sleep-out", (v) => v.toFixed(1)],
];

const form = document.getElementById("predict-form");

sliderMap.forEach(([name, outId, fmt]) => {
  const input = form.querySelector(`[name="${name}"]`);
  const out = document.getElementById(outId);
  input.addEventListener("input", () => {
    out.textContent = fmt(parseFloat(input.value));
  });
});

// ============ gauge setup ============
const gaugeFill = document.getElementById("gauge-fill");
const gaugeScoreEl = document.getElementById("gauge-score");
const gaugeCategoryEl = document.getElementById("gauge-category");
const gaugeCopyEl = document.getElementById("gauge-copy");
const errorMsgEl = document.getElementById("error-msg");
const submitBtn = document.getElementById("submit-btn");

const dashTotal = gaugeFill.getTotalLength();
document.documentElement.style.setProperty("--dash-total", dashTotal.toFixed(2));
gaugeFill.classList.add("idle");

// Score runs roughly 0–10. Map to gauge fill (0 = empty, 10 = full semicircle).
function scoreToOffset(score) {
  const clamped = Math.max(0, Math.min(10, score));
  const fraction = clamped / 10;
  return dashTotal * (1 - fraction);
}

// Colour: coral (low) -> gold (mid) -> teal (high)
function scoreToColor(score) {
  if (score >= 7.5) return getComputedStyle(document.documentElement).getPropertyValue("--teal").trim();
  if (score >= 5.5) return getComputedStyle(document.documentElement).getPropertyValue("--sage").trim();
  if (score >= 4) return getComputedStyle(document.documentElement).getPropertyValue("--gold").trim();
  return getComputedStyle(document.documentElement).getPropertyValue("--coral").trim();
}

function scoreToCategory(score) {
  if (score >= 7.5) return "Good";
  if (score >= 5.5) return "Moderate";
  if (score >= 4) return "Concerning";
  return "Poor";
}

const CATEGORY_COPY = {
  Good: "Your inputs land in a range the model associates with steadier mood and better rest. Keep whatever balance you've got going.",
  Moderate: "A middling reading. Nothing alarming, but a look at sleep or screen time might nudge things up.",
  Concerning: "The model is picking up some strain here — often tied to short sleep or heavy daily usage in the training data.",
  Poor: "This combination of inputs sits at the low end of the training data. If this reflects how you're actually doing, it may be worth talking to someone.",
};

function renderResult(score, category) {
  gaugeFill.classList.remove("idle");
  gaugeFill.style.strokeDashoffset = scoreToOffset(score);
  gaugeFill.style.stroke = scoreToColor(score);
  gaugeScoreEl.textContent = score.toFixed(1);
  gaugeCategoryEl.textContent = category;
  gaugeCopyEl.textContent = CATEGORY_COPY[category] || "";
}

function resetToIdle() {
  gaugeFill.classList.add("idle");
  gaugeFill.style.stroke = "";
  gaugeFill.style.strokeDashoffset = "";
  gaugeScoreEl.textContent = "—";
  gaugeCategoryEl.textContent = "awaiting input";
}

// ============ submit ============
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsgEl.textContent = "";
  submitBtn.disabled = true;
  submitBtn.querySelector(".btn-label").textContent = "Reading…";

  const fd = new FormData(form);
  const payload = {
    age: parseInt(fd.get("Age"), 10),
    gender: fd.get("Gender"),
    country: fd.get("Country"),
    academic_level: fd.get("Academic_Level"),
    most_used_platform: fd.get("Most_Used_Platform"),
    purpose_of_use: fd.get("Purpose_Of_Use"),
    avg_daily_usage_hours: parseFloat(fd.get("Avg_Daily_Usage_Hours")),
    daily_unlocks: parseInt(fd.get("Daily_Unlocks"), 10),
    study_hours: parseFloat(fd.get("Study_Hours")),
    physical_activity_hours: parseFloat(fd.get("Physical_Activity_Hours")),
    sleep_hours_per_night: parseFloat(fd.get("Sleep_Hours_Per_Night")),
    stress_level: fd.get("Stress_Level"),
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`API responded with ${res.status}: ${detail}`);
    }

    const data = await res.json();
    const category = scoreToCategory(data.mental_health_score);
    renderResult(data.mental_health_score, category);
  } catch (err) {
    resetToIdle();
    errorMsgEl.textContent =
      "Couldn't reach the model. Check that the FastAPI server is running at " +
      API_URL.replace("/predict", "") + " and that CORS is enabled.";
    console.error(err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector(".btn-label").textContent = "Read my signal";
  }
});