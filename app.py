from flask import Flask, jsonify, render_template, request, redirect, url_for, session
from flask_cors import CORS
import os
from dotenv import load_dotenv
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_dance.contrib.google import make_google_blueprint, google
import random
import requests # <-- ADD THIS LINE

load_dotenv()

app = Flask(__name__)
CORS(app)

# --- Configuration ---
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
# --- REFINEMENT: Added a timeout to the database connection ---
# This helps prevent 'database is locked' errors by waiting up to 15 seconds.
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///ecocity.db?timeout=15'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Google OAuth Configuration
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
app.config['GOOGLE_OAUTH_CLIENT_ID'] = os.getenv('GOOGLE_OAUTH_CLIENT_ID')
app.config['GOOGLE_OAUTH_CLIENT_SECRET'] = os.getenv('GOOGLE_OAUTH_CLIENT_SECRET')

db = SQLAlchemy(app)

# --- Database Models ---
class Feedback(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    issue_type = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class WasteReport(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    location = db.Column(db.String(200), nullable=False)
    waste_type = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class SafetyHotspot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    location = db.Column(db.String(200), nullable=False)
    issue_type = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class UserActivity(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

# (The rest of the file remains the same)
# ...
# --- Google OAuth Blueprint ---
google_bp = make_google_blueprint(
    scope=[
        "openid",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
    ],
    redirect_to='home'
)
app.register_blueprint(google_bp, url_prefix="/login")

# --- Routes ---
@app.route('/')
def home():
    user_info = None
    if google.authorized:
        try:
            if 'user_info' not in session:
                resp = google.get("/oauth2/v2/userinfo")
                if resp.ok:
                    user_info = resp.json()
                    session['user_info'] = user_info
                    
                    new_login = UserActivity(
                        name=user_info.get('name'),
                        email=user_info.get('email')
                    )
                    db.session.add(new_login)
                    db.session.commit()
            
            user_info = session.get('user_info')

        except Exception as e:
            print(f"Error fetching user info: {e}")
            session.clear()
            return redirect(url_for('home'))

    return render_template('index.html', user_info=user_info)

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))

# --- API Routes ---
@app.route('/api/garbage-trucks')
def get_garbage_trucks():
    trucks = []
    for i in range(5):
        trucks.append({
            "id": f"TRUCK-{101 + i}",
            "lat": 28.6139 + (random.uniform(-0.05, 0.05)),
            "lon": 77.2090 + (random.uniform(-0.05, 0.05)),
            "status": random.choice(["On Route", "Collecting", "Full"])
        })
    return jsonify(trucks)

# --- START: NEW API ROUTE ---
@app.route('/api/garbage-collection')
def get_garbage_collection():
    api_url = os.getenv('GARBAGE_COLLECTION_API_URL')
    api_key = os.getenv('GARBAGE_COLLECTION_API_KEY')
    
    if not api_url or not api_key:
        return jsonify({"error": "API URL or key not configured"}), 500
        
    try:
        headers = {'Authorization': f'Bearer {api_key}'}
        response = requests.get(api_url, headers=headers)
        response.raise_for_status()  # Raise an exception for bad status codes
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500
# --- END: NEW API ROUTE ---


@app.route('/api/metro-status')
def metro_status():
    return jsonify({
        'status': True,
        'data': [
            {'line': 'RED', 'status': 'Normal', 'details': 'Running on time'},
            {'line': 'YELLOW', 'status': 'Slow', 'details': 'Slow movement between Kashmere Gate and Rajiv Chowk'},
            {'line': 'BLUE', 'status': 'Normal', 'details': 'Running on time'},
        ]
    })

@app.route('/api/feedback', methods=['POST'])
def handle_feedback():
    data = request.json
    if not all(k in data for k in ['name', 'issue_type', 'description']):
        return jsonify({'error': 'Missing data'}), 400

    new_feedback = Feedback(
        name=data['name'],
        issue_type=data['issue_type'],
        description=data['description']
    )
    db.session.add(new_feedback)
    db.session.commit()

    return jsonify({'message': 'Feedback submitted successfully!'}), 201

@app.route('/api/waste-reports', methods=['GET', 'POST'])
def handle_waste_reports():
    if request.method == 'POST':
        data = request.json
        if not all(k in data for k in ['location', 'waste_type', 'description']):
            return jsonify({'error': 'Missing data'}), 400

        new_report = WasteReport(
            location=data['location'],
            waste_type=data['waste_type'],
            description=data['description']
        )
        db.session.add(new_report)
        db.session.commit()
        return jsonify({'message': 'Waste report submitted successfully!'}), 201
    else:
        reports = WasteReport.query.order_by(WasteReport.timestamp.desc()).all()
        return jsonify([{'location': r.location, 'waste_type': r.waste_type, 'description': r.description} for r in reports])


@app.route('/api/safety-hotspots', methods=['GET', 'POST'])
def handle_safety_hotspots():
    if request.method == 'POST':
        data = request.json
        if not all(k in data for k in ['location', 'issue_type', 'description']):
            return jsonify({'error': 'Missing data'}), 400

        new_hotspot = SafetyHotspot(
            location=data['location'],
            issue_type=data['issue_type'],
            description=data['description']
        )
        db.session.add(new_hotspot)
        db.session.commit()
        return jsonify({'message': 'Safety hotspot reported successfully!'}), 201
    else:
        hotspots = SafetyHotspot.query.order_by(SafetyHotspot.timestamp.desc()).all()
        return jsonify([{'location': h.location, 'issue_type': h.issue_type, 'description': h.description} for h in hotspots])

@app.route('/api/calculate-carbon-footprint', methods=['POST'])
def calculate_carbon_footprint():
    data = request.json
    factors = {'electricity': 0.82, 'gas': 2.31, 'transport': 0.21}
    
    total_footprint = (
        float(data.get('electricity', 0)) * factors['electricity'] +
        float(data.get('gas', 0)) * factors['gas'] +
        float(data.get('transport', 0)) * factors['transport']
    )
    
    return jsonify({'carbon_footprint': round(total_footprint, 2)})


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)