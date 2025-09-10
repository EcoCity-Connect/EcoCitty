from flask import Flask, jsonify, render_template, request, redirect, url_for, session
from flask_cors import CORS
import os
from dotenv import load_dotenv
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_dance.contrib.google import make_google_blueprint, google
import click

load_dotenv()

app = Flask(__name__)
CORS(app)

# --- Configuration ---
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default-secret-key')
# Use PostgreSQL on Render and fallback to SQLite locally
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///ecocity.db')
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

@app.route('/api/feedback', methods=['POST'])
def handle_feedback():
    data = request.json
    print(f"Received feedback data: {data}")  # Logging
    if not all(k in data for k in ['name', 'issue_type', 'description']):
        return jsonify({'error': 'Missing data'}), 400

    new_feedback = Feedback(
        name=data['name'],
        issue_type=data['issue_type'],
        description=data['description']
    )
    db.session.add(new_feedback)
    db.session.commit()
    print("Feedback saved to database.")  # Logging

    return jsonify({'message': 'Feedback submitted successfully!'}), 201

@app.route('/api/waste-reports', methods=['POST'])
def handle_waste_reports():
    data = request.json
    print(f"Received waste report data: {data}")  # Logging
    if not all(k in data for k in ['location', 'waste_type', 'description']):
        return jsonify({'error': 'Missing data'}), 400

    new_report = WasteReport(
        location=data['location'],
        waste_type=data['waste_type'],
        description=data['description']
    )
    db.session.add(new_report)
    db.session.commit()
    print("Waste report saved to database.")  # Logging
    return jsonify({'message': 'Waste report submitted successfully!'}), 201

@app.route('/api/safety-hotspots', methods=['POST'])
def handle_safety_hotspots():
    data = request.json
    print(f"Received safety hotspot data: {data}")  # Logging
    if not all(k in data for k in ['location', 'issue_type', 'description']):
        return jsonify({'error': 'Missing data'}), 400

    new_hotspot = SafetyHotspot(
        location=data['location'],
        issue_type=data['issue_type'],
        description=data['description']
    )
    db.session.add(new_hotspot)
    db.session.commit()
    print("Safety hotspot saved to database.")  # Logging
    return jsonify({'message': 'Safety hotspot reported successfully!'}), 201

# --- Database CLI Command ---
@app.cli.command("init-db")
def init_db_command():
    """Creates the database tables."""
    db.create_all()
    click.echo("Initialized the database.")

if __name__ == '__main__':
    app.run(debug=True, port=5000)