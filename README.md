# EcoCity Connect

A comprehensive smart city platform that provides real-time insights into public services, environmental monitoring, and citizen engagement tools to help build sustainable urban communities.

## 🌟 Features

### 1. **Real-time Public Transport Tracking**
- Live simulation of Delhi Metro lines with animated train positions
- Multiple metro lines including Red, Yellow, Blue, Green, Violet, Pink, Magenta, and Airport Express
- Station-by-station tracking with real-time status updates
- Interactive map with all metro stations and routes

### 2. **Air Quality Index (AQI) Monitoring**
- Real-time AQI data from 26+ monitoring stations across Delhi
- Color-coded air quality indicators
- Health advice based on current AQI levels
- Station-wise AQI comparison

### 3. **Waste Management System**
- Neighborhood-wise waste collection schedules
- Interactive map showing collection areas
- Waste issue reporting system (illegal dumping, overflowing bins, etc.)
- Community-driven waste management feedback

### 4. **Carbon Footprint Calculator**
- Calculate daily commute emissions based on transport mode
- Domestic energy consumption tracking (electricity and natural gas)
- Detailed breakdown of carbon emissions by category
- Personalized monthly CO₂e estimates

### 5. **Green and Safe Spaces**
- Interactive map of parks and green spaces across Delhi
- Safe walking and cycling routes with proper lighting
- Safety concern reporting system
- Community-driven safety hotspot identification

### 6. **Disaster & Emergency Alerts**
- Real-time weather warnings and disaster alerts
- Emergency notifications for floods, storms, and other hazards
- Integration with Indian Meteorological Department (IMD) data

### 7. **Citizen Feedback System**
- Report civic issues (potholes, broken streetlights, waste problems)
- Direct submission to database for municipal tracking
- Community engagement platform

## 🚀 Tech Stack

**Backend:**
- Flask 2.3.3
- Flask-SQLAlchemy 3.0.3
- Flask-CORS 4.0.0
- PostgreSQL (Production) / SQLite (Development)
- Python-dotenv 1.0.0

**Frontend:**
- HTML5, CSS3, JavaScript (ES6+)
- Tailwind CSS (via CDN)
- Leaflet.js 1.9.4 (Interactive maps)
- Google Fonts (Inter)

**Authentication:**
- Flask-Dance 6.2.0 (Google OAuth)

**Deployment:**
- Gunicorn (WSGI server)
- Render/Heroku compatible

## 📋 Prerequisites

- Python 3.8+
- Node.js (for npm dependencies)
- PostgreSQL (for production)
- Google OAuth credentials (optional, for authentication)

## 🔧 Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/ecocity-connect.git
cd ecocity-connect
```

### 2. Create a virtual environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 4. Install Node.js dependencies
```bash
npm install
```

### 5. Set up environment variables
Create a `.env` file in the root directory:
```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///ecocity.db  # For development
GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret
```

### 6. Initialize the database
```bash
flask init-db
```

### 7. Run the application
```bash
python app.py
```

The application will be available at `http://localhost:5000`

## 📁 Project Structure

```
ecocity-connect/
├── app.py                  # Main Flask application
├── requirements.txt        # Python dependencies
├── package.json           # Node.js dependencies
├── Procfile              # Deployment configuration
├── .env                  # Environment variables (not in repo)
├── .gitignore           # Git ignore rules
├── static/
│   ├── script.js        # Frontend JavaScript
│   └── style.css        # Custom styles
├── templates/
│   └── index.html       # Main HTML template
└── README.md            # This file
```

## 🗄️ Database Models

### Feedback
- `id`: Integer (Primary Key)
- `name`: String (100)
- `issue_type`: String (100)
- `description`: Text
- `timestamp`: DateTime

### WasteReport
- `id`: Integer (Primary Key)
- `location`: String (200)
- `waste_type`: String (100)
- `description`: Text
- `timestamp`: DateTime

### SafetyHotspot
- `id`: Integer (Primary Key)
- `location`: String (200)
- `issue_type`: String (100)
- `description`: Text
- `timestamp`: DateTime

### UserActivity
- `id`: Integer (Primary Key)
- `name`: String (100)
- `email`: String (100)
- `timestamp`: DateTime

## 🌐 API Endpoints

### POST `/api/feedback`
Submit citizen feedback
```json
{
  "name": "John Doe",
  "issue_type": "Pothole",
  "description": "Large pothole on Main Street"
}
```

### POST `/api/waste-reports`
Report waste management issues
```json
{
  "location": "Connaught Place",
  "waste_type": "Illegal Dumping",
  "description": "Construction debris dumped near park"
}
```

### POST `/api/safety-hotspots`
Report safety concerns
```json
{
  "location": "XYZ Road Junction",
  "issue_type": "Poor Lighting",
  "description": "Street lights not working for past week"
}
```

## 🚀 Deployment

### Deploying to Render

1. Push your code to GitHub
2. Connect your repository to Render
3. Set environment variables in Render dashboard
4. Render will automatically detect the `Procfile` and deploy

### Environment Variables for Production
```env
SECRET_KEY=<strong-secret-key>
DATABASE_URL=postgresql://user:password@host:5432/dbname
GOOGLE_OAUTH_CLIENT_ID=<your-client-id>
GOOGLE_OAUTH_CLIENT_SECRET=<your-client-secret>
```

## 🎨 Features in Detail

### Carbon Footprint Calculator
The calculator uses the following emission factors:
- **Car (Petrol)**: 150g CO₂/km
- **Bus**: 40g CO₂/km
- **Metro**: 21g CO₂/km
- **Motorbike**: 110g CO₂/km
- **Electricity**: 0.8 kg CO₂e/kWh (India grid average)
- **Natural Gas**: 5.3 kg CO₂e/therm

### Waste Collection Schedule
Covers 10+ major neighborhoods in Delhi with specific collection days for:
- General waste (daily in most areas)
- Recycling (weekly on designated days)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- OpenStreetMap for map tiles
- CARTO for dark theme map tiles
- Central Pollution Control Board (CPCB) for AQI data
- Indian Meteorological Department (IMD) for weather alerts
- Delhi Metro Rail Corporation for metro route information

## 📧 Contact

For questions or support, please contact: your.email@example.com

## 🔮 Future Enhancements

- [ ] Real API integration for live AQI data
- [ ] Actual metro train GPS tracking
- [ ] Push notifications for emergency alerts
- [ ] Mobile application (React Native)
- [ ] Multi-language support (Hindi, English)
- [ ] Integration with municipal databases
- [ ] Advanced analytics dashboard
- [ ] Community forums and discussions
- [ ] Gamification for eco-friendly behaviors
- [ ] Integration with smart home devices

---

Made with ❤️ for sustainable cities
