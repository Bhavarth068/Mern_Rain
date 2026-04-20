"""
Rain Forecasting — ML Prediction Microservice (Flask)
Endpoints: POST /predict, GET /health, GET /model-info
"""
import os, json, joblib, numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import logging

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO, format='%(asctime)s — %(levelname)s — %(message)s')
logger = logging.getLogger(__name__)

BASE = os.path.dirname(__file__)
MODEL_PATH  = os.path.join(BASE, 'models', 'random_forest_model.joblib')
SCALER_PATH = os.path.join(BASE, 'models', 'scaler.joblib')
META_PATH   = os.path.join(BASE, 'models', 'model_metadata.json')

try:
    model  = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    with open(META_PATH) as f:
        model_meta = json.load(f)
    FEATURES = model_meta['features']
    logger.info(f"✅ Model loaded: {model_meta['model_name']}")
except FileNotFoundError:
    logger.warning("⚠️  Model not found. Run train_model.py first.")
    model = scaler = model_meta = None
    FEATURES = []


def engineer_features(d):
    d['humidity_pressure_ratio'] = d['humidity_pct'] / d['pressure_hpa']
    d['dew_spread']              = d['temperature_c'] - d['dew_point_c']
    d['is_monsoon_month']        = int(d.get('month', 6) in [6,7,8,9])
    d['wind_humidity_index']     = d['wind_speed_kmh'] * d['humidity_pct'] / 100
    return d


@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'model_loaded': model is not None,
                    'timestamp': datetime.utcnow().isoformat() + 'Z'})


@app.route('/model-info')
def model_info():
    if not model_meta:
        return jsonify({'error': 'Model not loaded'}), 503
    return jsonify({
        'model_name': model_meta['model_name'],
        'version':    model_meta['version'],
        'trained_at': model_meta['trained_at'],
        'metrics':    model_meta['metrics'],
        'features':   FEATURES
    })


@app.route('/predict', methods=['POST'])
def predict():
    """
    POST /predict
    Body: { temperature_c, humidity_pct, pressure_hpa, wind_speed_kmh,
            wind_direction_deg, cloud_cover_pct, dew_point_c, visibility_km,
            uv_index, temp_change_3h, pressure_change_3h, month }
    """
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 503
    try:
        data = request.get_json(force=True)
        data = engineer_features(data)
        X    = np.array([[data[f] for f in FEATURES]])
        prob = float(model.predict_proba(scaler.transform(X))[0][1])

        if prob >= 0.85: severity, advice = "Heavy Rain",     "Stay indoors. Flash flood risk."
        elif prob >= 0.70: severity, advice = "Moderate Rain", "Carry an umbrella and raincoat."
        elif prob >= 0.50: severity, advice = "Light Rain",    "Carry an umbrella."
        elif prob >= 0.30: severity, advice = "Drizzle Chance","Rain unlikely but possible."
        else:              severity, advice = "No Rain",        "Enjoy the clear weather!"

        return jsonify({
            'will_rain':     prob >= 0.5,
            'probability':   round(prob, 4),
            'rain_chance':   f"{round(prob*100,1)}%",
            'confidence':    'High' if abs(prob-0.5)>0.3 else 'Medium' if abs(prob-0.5)>0.15 else 'Low',
            'severity':      severity,
            'advice':        advice,
            'model_version': model_meta.get('version','1.0.0'),
            'predicted_at':  datetime.utcnow().isoformat() + 'Z'
        })
    except Exception as e:
        logger.error(str(e))
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    PORT = int(os.environ.get('ML_SERVICE_PORT', 5001))
    print(f"ML Service running on port {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=False)
