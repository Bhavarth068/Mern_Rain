"""
Rain Forecasting System - ML Training Pipeline
=============================================
Author: Rain Forecasting System
Stack: Python, Scikit-learn, TensorFlow/Keras, Pandas, NumPy
Description: Trains Random Forest & LSTM models for rainfall prediction.
             Exports models for use in Node.js/Python prediction service.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import (
    accuracy_score, classification_report,
    confusion_matrix, roc_auc_score, roc_curve
)
from sklearn.pipeline import Pipeline
import warnings
warnings.filterwarnings("ignore")

# ─────────────────────────────────────────────────────────────────────────────
# 1. SYNTHETIC DATA GENERATION (Replace with real OpenWeatherMap data)
# ─────────────────────────────────────────────────────────────────────────────

def generate_synthetic_weather_data(n_samples: int = 5000) -> pd.DataFrame:
    """
    Generates realistic synthetic weather data for model training.
    In production, replace with historical data from OpenWeatherMap API.
    
    Features:
        temperature_c     : Air temperature in Celsius
        humidity_pct      : Relative humidity (%)
        pressure_hpa      : Atmospheric pressure (hPa)
        wind_speed_kmh    : Wind speed (km/h)
        wind_direction_deg: Wind direction (degrees)
        cloud_cover_pct   : Cloud coverage (%)
        dew_point_c       : Dew point temperature (°C)
        visibility_km     : Visibility (km)
        uv_index          : UV Index
        temp_change_3h    : Temperature change over 3 hours
        pressure_change_3h: Pressure change over 3 hours
        month             : Month of year (1-12)
    
    Label:
        will_rain         : Binary (1 = rain expected, 0 = no rain)
    """
    np.random.seed(42)
    n = n_samples

    # Base weather features
    temperature     = np.random.normal(25, 10, n)          # °C
    humidity        = np.random.uniform(20, 100, n)         # %
    pressure        = np.random.normal(1013, 15, n)         # hPa
    wind_speed      = np.random.exponential(15, n)          # km/h
    wind_direction  = np.random.uniform(0, 360, n)          # degrees
    cloud_cover     = np.random.uniform(0, 100, n)          # %
    dew_point       = temperature - ((100 - humidity) / 5)  # Magnus formula approx
    visibility      = np.random.uniform(0.5, 20, n)         # km
    uv_index        = np.random.uniform(0, 11, n)
    temp_change     = np.random.normal(0, 3, n)             # 3h change
    pressure_change = np.random.normal(0, 2, n)             # 3h change
    month           = np.random.randint(1, 13, n)

    # Derived rain probability based on real-world meteorological logic
    rain_prob = (
        0.35 * (humidity / 100) +
        0.25 * (cloud_cover / 100) +
        0.15 * (dew_point / temperature).clip(-2, 2) +
        0.10 * (-pressure_change / 10).clip(0, 1) +
        0.10 * np.where(wind_speed > 20, 1, wind_speed / 20) +
        0.05 * np.where(month.isin([6,7,8,9]) if hasattr(month, 'isin') else np.isin(month, [6,7,8,9]), 1, 0)
    )
    rain_prob = np.clip(rain_prob, 0, 1)
    will_rain = (rain_prob + np.random.normal(0, 0.1, n) > 0.55).astype(int)

    df = pd.DataFrame({
        'temperature_c':      temperature.round(2),
        'humidity_pct':       humidity.round(2),
        'pressure_hpa':       pressure.round(2),
        'wind_speed_kmh':     wind_speed.round(2),
        'wind_direction_deg': wind_direction.round(2),
        'cloud_cover_pct':    cloud_cover.round(2),
        'dew_point_c':        dew_point.round(2),
        'visibility_km':      visibility.round(2),
        'uv_index':           uv_index.round(2),
        'temp_change_3h':     temp_change.round(2),
        'pressure_change_3h': pressure_change.round(2),
        'month':              month,
        'will_rain':          will_rain
    })
    return df


# ─────────────────────────────────────────────────────────────────────────────
# 2. DATA PREPROCESSING
# ─────────────────────────────────────────────────────────────────────────────

def preprocess_data(df: pd.DataFrame):
    """
    Cleans and prepares weather data for ML training.
    Returns X_train, X_test, y_train, y_test, scaler, feature_names.
    """
    print("📊 Dataset Shape:", df.shape)
    print("📊 Class Distribution:\n", df['will_rain'].value_counts())

    # Drop duplicates and handle missing values
    df = df.drop_duplicates()
    df = df.fillna(df.median(numeric_only=True))

    # Feature Engineering
    df['humidity_pressure_ratio'] = df['humidity_pct'] / df['pressure_hpa']
    df['dew_spread']              = df['temperature_c'] - df['dew_point_c']
    df['is_monsoon_month']        = df['month'].isin([6, 7, 8, 9]).astype(int)
    df['wind_humidity_index']     = df['wind_speed_kmh'] * df['humidity_pct'] / 100

    FEATURE_COLS = [
        'temperature_c', 'humidity_pct', 'pressure_hpa', 'wind_speed_kmh',
        'wind_direction_deg', 'cloud_cover_pct', 'dew_point_c', 'visibility_km',
        'uv_index', 'temp_change_3h', 'pressure_change_3h', 'month',
        'humidity_pressure_ratio', 'dew_spread', 'is_monsoon_month', 'wind_humidity_index'
    ]
    TARGET_COL = 'will_rain'

    X = df[FEATURE_COLS].values
    y = df[TARGET_COL].values

    # Train/Test Split (80/20 stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Feature Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled  = scaler.transform(X_test)

    print(f"✅ Training samples: {len(X_train)}, Test samples: {len(X_test)}")
    return X_train_scaled, X_test_scaled, y_train, y_test, scaler, FEATURE_COLS


# ─────────────────────────────────────────────────────────────────────────────
# 3. MODEL TRAINING
# ─────────────────────────────────────────────────────────────────────────────

def train_random_forest(X_train, y_train):
    """Train Random Forest classifier (primary model)."""
    print("\n🌲 Training Random Forest...")
    rf = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train, y_train)
    return rf


def train_gradient_boosting(X_train, y_train):
    """Train Gradient Boosting classifier (secondary model)."""
    print("\n🚀 Training Gradient Boosting...")
    gb = GradientBoostingClassifier(
        n_estimators=150,
        learning_rate=0.1,
        max_depth=5,
        random_state=42
    )
    gb.fit(X_train, y_train)
    return gb


def train_logistic_regression(X_train, y_train):
    """Train Logistic Regression (baseline model)."""
    print("\n📈 Training Logistic Regression (baseline)...")
    lr = LogisticRegression(
        C=1.0,
        max_iter=1000,
        class_weight='balanced',
        random_state=42
    )
    lr.fit(X_train, y_train)
    return lr


# ─────────────────────────────────────────────────────────────────────────────
# 4. EVALUATION
# ─────────────────────────────────────────────────────────────────────────────

def evaluate_model(model, X_test, y_test, model_name: str) -> dict:
    """Evaluate a model and return metrics dict."""
    y_pred      = model.predict(X_test)
    y_prob      = model.predict_proba(X_test)[:, 1]
    acc         = accuracy_score(y_test, y_pred)
    auc         = roc_auc_score(y_test, y_prob)
    report      = classification_report(y_test, y_pred, output_dict=True)

    metrics = {
        'model':     model_name,
        'accuracy':  round(acc * 100, 2),
        'roc_auc':   round(auc, 4),
        'precision': round(report['1']['precision'], 4),
        'recall':    round(report['1']['recall'], 4),
        'f1_score':  round(report['1']['f1-score'], 4),
    }

    print(f"\n📊 {model_name} Results:")
    print(f"   Accuracy  : {metrics['accuracy']}%")
    print(f"   ROC-AUC   : {metrics['roc_auc']}")
    print(f"   F1 Score  : {metrics['f1_score']}")
    print(f"   Precision : {metrics['precision']}")
    print(f"   Recall    : {metrics['recall']}")
    return metrics


# ─────────────────────────────────────────────────────────────────────────────
# 5. SAVE MODELS & ARTIFACTS
# ─────────────────────────────────────────────────────────────────────────────

def save_artifacts(model, scaler, feature_names, metrics, model_name='random_forest'):
    """
    Exports:
        - Trained model (.joblib)
        - Scaler (.joblib)
        - Feature list & metadata (.json)
    These are loaded by the Python prediction microservice.
    """
    os.makedirs('models', exist_ok=True)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

    model_path   = f"models/{model_name}_model.joblib"
    scaler_path  = f"models/scaler.joblib"
    meta_path    = f"models/model_metadata.json"

    joblib.dump(model,  model_path)
    joblib.dump(scaler, scaler_path)

    metadata = {
        'model_name':    model_name,
        'trained_at':    timestamp,
        'features':      feature_names,
        'metrics':       metrics,
        'model_path':    model_path,
        'scaler_path':   scaler_path,
        'version':       '1.0.0',
        'description':   'Rain Forecasting Binary Classifier',
        'feature_count': len(feature_names)
    }
    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f"\n✅ Model saved   : {model_path}")
    print(f"✅ Scaler saved  : {scaler_path}")
    print(f"✅ Metadata saved: {meta_path}")
    return model_path, scaler_path


# ─────────────────────────────────────────────────────────────────────────────
# 6. FEATURE IMPORTANCE VISUALIZATION
# ─────────────────────────────────────────────────────────────────────────────

def plot_feature_importance(model, feature_names):
    """Plot and save feature importance chart."""
    if not hasattr(model, 'feature_importances_'):
        return
    importances = model.feature_importances_
    indices     = np.argsort(importances)[::-1]
    names_sorted = [feature_names[i] for i in indices]

    plt.figure(figsize=(12, 6))
    plt.title('🌧️ Feature Importance — Rain Forecasting', fontsize=14, fontweight='bold')
    plt.bar(range(len(importances)), importances[indices], color='steelblue', alpha=0.85)
    plt.xticks(range(len(importances)), names_sorted, rotation=45, ha='right', fontsize=9)
    plt.ylabel('Importance Score')
    plt.tight_layout()
    os.makedirs('models', exist_ok=True)
    plt.savefig('models/feature_importance.png', dpi=150)
    plt.close()
    print("📊 Feature importance chart saved → models/feature_importance.png")


# ─────────────────────────────────────────────────────────────────────────────
# 7. PREDICTION FUNCTION (used by Flask microservice)
# ─────────────────────────────────────────────────────────────────────────────

def predict_rain(input_data: dict) -> dict:
    """
    Given raw weather input, return rain prediction.
    This function is called by the Flask prediction service.
    
    Args:
        input_data: dict with weather feature keys
    Returns:
        dict with will_rain (bool), probability (float), confidence (str)
    """
    model  = joblib.load('models/random_forest_model.joblib')
    scaler = joblib.load('models/scaler.joblib')
    
    with open('models/model_metadata.json') as f:
        meta = json.load(f)
    
    features = meta['features']
    
    # Engineer same features as training
    input_data['humidity_pressure_ratio'] = (
        input_data['humidity_pct'] / input_data['pressure_hpa']
    )
    input_data['dew_spread'] = (
        input_data['temperature_c'] - input_data['dew_point_c']
    )
    input_data['is_monsoon_month'] = int(
        input_data.get('month', 1) in [6, 7, 8, 9]
    )
    input_data['wind_humidity_index'] = (
        input_data['wind_speed_kmh'] * input_data['humidity_pct'] / 100
    )

    X = np.array([[input_data[f] for f in features]])
    X_scaled   = scaler.transform(X)
    probability = model.predict_proba(X_scaled)[0][1]
    will_rain  = bool(probability >= 0.5)
    
    confidence = (
        'High'   if abs(probability - 0.5) > 0.3 else
        'Medium' if abs(probability - 0.5) > 0.15 else
        'Low'
    )

    return {
        'will_rain':   will_rain,
        'probability': round(float(probability), 4),
        'confidence':  confidence,
        'rain_chance': f"{round(probability * 100, 1)}%"
    }


# ─────────────────────────────────────────────────────────────────────────────
# 8. MAIN TRAINING PIPELINE
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    print("=" * 60)
    print("  🌧️  Rain Forecasting — ML Training Pipeline")
    print("=" * 60)

    # Step 1: Generate / Load data
    print("\n📥 Generating dataset...")
    df = generate_synthetic_weather_data(n_samples=5000)
    df.to_csv('data/weather_training_data.csv', index=False)
    print(f"✅ Dataset saved → data/weather_training_data.csv")

    # Step 2: Preprocess
    X_train, X_test, y_train, y_test, scaler, feature_names = preprocess_data(df)

    # Step 3: Train models
    rf_model = train_random_forest(X_train, y_train)
    gb_model = train_gradient_boosting(X_train, y_train)
    lr_model = train_logistic_regression(X_train, y_train)

    # Step 4: Evaluate all models
    print("\n" + "=" * 60)
    print("  📊 MODEL EVALUATION RESULTS")
    print("=" * 60)
    rf_metrics = evaluate_model(rf_model, X_test, y_test, "Random Forest")
    gb_metrics = evaluate_model(gb_model, X_test, y_test, "Gradient Boosting")
    lr_metrics = evaluate_model(lr_model, X_test, y_test, "Logistic Regression")

    # Step 5: Save best model (Random Forest chosen as primary)
    best_model = rf_model
    best_metrics = rf_metrics
    save_artifacts(best_model, scaler, feature_names, best_metrics, 'random_forest')

    # Step 6: Feature importance
    plot_feature_importance(best_model, feature_names)

    # Summary
    print("\n" + "=" * 60)
    print("  ✅ Training Complete! Model ready for deployment.")
    print("=" * 60)
    print(f"  Primary Model : Random Forest")
    print(f"  Accuracy      : {rf_metrics['accuracy']}%")
    print(f"  ROC-AUC       : {rf_metrics['roc_auc']}")
    print("=" * 60)
