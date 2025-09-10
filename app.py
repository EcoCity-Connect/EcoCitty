from flask import Flask, jsonify, render_template, request, redirect, url_for, session
from flask_cors import CORS
import os
from dotenv import load_dotenv
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_dance.contrib.google import make_google_blueprint, google
import random

load_dotenv()

app = Flask(__name__)
CORS(app)

# --- Configuration ---
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///ecocity.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Google OAuth Configuration
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'  # For development only!
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

# --- Metro Data (Mock) ---
METRO_STATIONS = {
    'RED': ['Rithala', 'Rohini West', 'Rohini East', 'Pitampura', 'Kohat Enclave', 'Netaji Subhash Place', 'Keshav Puram', 'Kanhaiya Nagar', 'Inderlok', 'Shastri Nagar', 'Pratap Nagar', 'Pulbangash', 'Tis Hazari', 'Kashmere Gate', 'Shastri Park', 'Seelampur', 'Welcome', 'Shahdara', 'Mansarovar Park', 'Jhilmil', 'Dilshad Garden', 'Shaheed Nagar', 'Raj Bagh', 'Mohan Nagar', 'Arthala', 'Hindon River', 'Shaheed Sthal'],
    'YELLOW': ['Samaypur Badli', 'Rohini Sector 18,19', 'Haiderpur Badli Mor', 'Jahangirpuri', 'Adarsh Nagar', 'Azadpur', 'Model Town', 'GTB Nagar', 'Vishwavidyalaya', 'Vidhan Sabha', 'Civil Lines', 'Kashmere Gate', 'Chandni Chowk', 'Chawri Bazar', 'New Delhi', 'Rajiv Chowk', 'Patel Chowk', 'Central Secretariat', 'Udyog Bhawan', 'Lok Kalyan Marg', 'Jor Bagh', 'Dilli Haat - INA', 'AIIMS', 'Green Park', 'Hauz Khas', 'Malviya Nagar', 'Saket', 'Qutub Minar', 'Chhatarpur', 'Sultanpur', 'Ghitorni', 'Arjan Garh', 'Guru Dronacharya', 'Sikandarpur', 'MG Road', 'IFFCO Chowk', 'Huda City Centre'],
    'BLUE': ['Dwarka Sector 21', 'Dwarka Sector 8', 'Dwarka Sector 9', 'Dwarka Sector 10', 'Dwarka Sector 11', 'Dwarka Sector 12', 'Dwarka Sector 13', 'Dwarka Sector 14', 'Dwarka', 'Dwarka Mor', 'Nawada', 'Uttam Nagar West', 'Uttam Nagar East', 'Janakpuri West', 'Janakpuri East', 'Tilak Nagar', 'Subhash Nagar', 'Tagore Garden', 'Rajouri Garden', 'Ramesh Nagar', 'Moti Nagar', 'Kirti Nagar', 'Shadipur', 'Patel Nagar', 'Rajendra Place', 'Karol Bagh', 'Jhandewalan', 'R K Ashram Marg', 'Rajiv Chowk', 'Barakhamba Road', 'Mandi House', 'Supreme Court', 'Indraprastha', 'Yamuna Bank', 'Akshardham', 'Mayur Vihar-I', 'Mayur Vihar Ext', 'New Ashok Nagar', 'Noida Sector 15', 'Noida Sector 16', 'Noida Sector 18', 'Botanical Garden', 'Golf Course', 'Noida City Centre', 'Sector 34 Noida', 'Sector 52 Noida', 'Sector 61', 'Sector 59', 'Sector 62', 'Noida Electronic City'],
}


# --- Routes ---
@app.route('/')
def home():
    user_info = None
    if google.authorized:
        try:
            # Check if user info is already in session to avoid repeated API calls
            if 'user_info' not in session:
                resp = google.get("/oauth2/v2/userinfo")
                if resp.ok:
                    user_info = resp.json()
                    session['user_info'] = user_info
                    
                    # Record the new login in the database
                    new_login = UserActivity(
                        name=user_info.get('name'),
                        email=user_info.get('email')
                    )
                    db.session.add(new_login)
                    db.session.commit()
            
            user_info = session.get('user_info')

        except Exception as e:
            print(f"Error fetching user info: {e}")
            session.clear() # Clear session on error
            return redirect(url_for('home'))

    return render_template('index.html', user_info=user_info)

@app.route('/logout')
def logout():
    # Clear the entire session to remove user info and OAuth tokens
    session.clear()
    return redirect(url_for('home'))

# --- API Routes ---

@app.route('/api/metro-status')
def metro_status():
    """Get live status of metro lines (mock data)."""
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
    # Factors are simplified for demonstration
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

