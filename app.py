from flask import Flask, jsonify, render_template, request, redirect, url_for, session
from flask_cors import CORS
import os
from dotenv import load_dotenv
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_dance.contrib.google import make_google_blueprint, google

load_dotenv()

app = Flask(__name__)
CORS(app)

# --- Configuration ---
app.config['SECRET_KEY'] = 'your_very_secret_key'  # Change this!
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///feedback.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Google OAuth Configuration
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'  # For development only!
app.config['GOOGLE_OAUTH_CLIENT_ID'] = os.getenv('GOOGLE_OAUTH_CLIENT_ID')
app.config['GOOGLE_OAUTH_CLIENT_SECRET'] = os.getenv('GOOGLE_OAUTH_CLIENT_SECRET')

db = SQLAlchemy(app)

# --- Database Model ---
class Feedback(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    issue_type = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Feedback {self.id}>'

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

# --- Metro Data ---
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
            resp = google.get("/oauth2/v2/userinfo")
            if resp.ok:
                user_info = resp.json()
                session['user_info'] = user_info
        except Exception as e:
            print(f"Error fetching user info: {e}")

    return render_template('index.html', user_info=user_info)

@app.route('/logout')
def logout():
    session.pop('user_info', None)
    # This part is tricky as flask-dance doesn't have a simple logout
    # For a real app, you'd want to properly revoke the token
    return redirect(url_for('home'))

@app.route('/api/metro-status')
def metro_status():
    """Get live status of metro lines."""
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


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)