from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
import requests
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Your RapidAPI configuration
API_CONFIG = {
    'key': 'f630d6821amsh9d3c70f920c08f8p121b52jsn78417474120b',
    'host': 'irctc1.p.rapidapi.com',
    'base_url': 'https://irctc1.p.rapidapi.com/api/v3'
}

def make_api_request(endpoint, params=None):
    """Make request to RapidAPI IRCTC API"""
    url = f"{API_CONFIG['base_url']}/{endpoint}"
    
    headers = {
        'X-RapidAPI-Key': API_CONFIG['key'],
        'X-RapidAPI-Host': API_CONFIG['host']
    }
    
    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {'error': str(e), 'status': False}

# Major Indian railway stations with coordinates
MAJOR_STATIONS = {
    'NDLS': {'name': 'New Delhi', 'lat': 28.6448, 'lng': 77.2097},
    'BCT': {'name': 'Mumbai Central', 'lat': 18.9696, 'lng': 72.8205},
    'HWH': {'name': 'Howrah Junction', 'lat': 22.5851, 'lng': 88.3452},
    'MAS': {'name': 'Chennai Central', 'lat': 13.0839, 'lng': 80.2707},
    'SBC': {'name': 'Bangalore City', 'lat': 12.9762, 'lng': 77.5993},
    'PUNE': {'name': 'Pune Junction', 'lat': 18.5290, 'lng': 73.8744},
    'AGC': {'name': 'Agra Cantt', 'lat': 27.1592, 'lng': 77.9784},
    'JP': {'name': 'Jaipur Junction', 'lat': 26.9181, 'lng': 75.7781},
    'ALD': {'name': 'Allahabad Junction', 'lat': 25.4358, 'lng': 81.8463},
    'BPL': {'name': 'Bhopal Junction', 'lat': 23.2599, 'lng': 77.4126},
    'MMCT': {'name': 'Mumbai Central', 'lat': 19.0760, 'lng': 72.8777},
    'KOL': {'name': 'Kolkata', 'lat': 22.5726, 'lng': 88.3639},
    'DEL': {'name': 'Delhi Junction', 'lat': 28.6139, 'lng': 77.2090}
}

@app.route('/')
def home():
    return render_template('index.html')

# ============= RAILWAY API ENDPOINTS =============

@app.route('/api/search-trains', methods=['GET'])
def search_trains():
    """Search trains between two stations"""
    from_station = request.args.get('from_station', '').upper()
    to_station = request.args.get('to_station', '').upper()
    
    if not from_station or not to_station:
        return jsonify({'error': 'Both from_station and to_station are required'}), 400
    
    # Get trains between stations
    data = make_api_request('getTrainsBetweenStations', {
        'fromStationCode': from_station,
        'toStationCode': to_station
    })
    
    # Add station coordinates for map plotting
    result = {
        'trains': data.get('data', []) if data.get('status') else [],
        'from_station_coords': MAJOR_STATIONS.get(from_station),
        'to_station_coords': MAJOR_STATIONS.get(to_station),
        'from_station_code': from_station,
        'to_station_code': to_station,
        'status': data.get('status', False)
    }
    
    return jsonify(result)

@app.route('/api/live-train-status/<train_number>')
def live_train_status(train_number):
    """Get live status of a specific train"""
    start_day = request.args.get('start_day', 0, type=int)
    
    data = make_api_request('getLiveTrainStatus', {
        'trainNo': train_number,
        'startDay': start_day
    })
    
    return jsonify(data)

@app.route('/api/live-station/<station_code>')
def live_station(station_code):
    """Get live trains at a station"""
    hours = request.args.get('hours', 2, type=int)
    
    data = make_api_request('getLiveStation', {
        'stationCode': station_code.upper(),
        'hours': hours
    })
    
    # Add station coordinates
    result = {
        'station_data': data.get('data', []) if data.get('status') else [],
        'station_coords': MAJOR_STATIONS.get(station_code.upper()),
        'station_code': station_code.upper(),
        'status': data.get('status', False)
    }
    
    return jsonify(result)

@app.route('/api/train-schedule/<train_number>')
def train_schedule(train_number):
    """Get train schedule"""
    data = make_api_request('getTrainSchedule', {
        'trainNo': train_number
    })
    
    return jsonify(data)

@app.route('/api/pnr-status/<pnr_number>')
def pnr_status(pnr_number):
    """Get PNR status"""
    data = make_api_request('getPNRStatus', {
        'pnrNumber': pnr_number
    })
    
    return jsonify(data)

@app.route('/api/seat-availability')
def seat_availability():
    """Check seat availability"""
    train_no = request.args.get('train_no')
    from_station = request.args.get('from_station')
    to_station = request.args.get('to_station')
    date = request.args.get('date')  # Format: DD-MM-YYYY
    train_class = request.args.get('class', 'SL')
    
    if not all([train_no, from_station, to_station, date]):
        return jsonify({'error': 'train_no, from_station, to_station, and date are required'}), 400
    
    data = make_api_request('checkSeatAvailability', {
        'trainNo': train_no,
        'fromStationCode': from_station.upper(),
        'toStationCode': to_station.upper(),
        'date': date,
        'class': train_class
    })
    
    return jsonify(data)

@app.route('/api/search-station/<query>')
def search_station(query):
    """Search for railway stations"""
    data = make_api_request('searchStation', {
        'query': query
    })
    
    return jsonify(data)

@app.route('/api/train-route/<train_number>')
def train_route(train_number):
    """Get complete train route with coordinates for map plotting"""
    # Get train schedule first
    schedule_data = make_api_request('getTrainSchedule', {
        'trainNo': train_number
    })
    
    if not schedule_data.get('status') or not schedule_data.get('data'):
        return jsonify({'error': 'Train schedule not found', 'status': False})
    
    # Extract stations and add coordinates
    stations_with_coords = []
    schedule = schedule_data['data']
    
    for station in schedule:
        station_code = station.get('station_code', '').upper()
        if station_code in MAJOR_STATIONS:
            station_info = {
                'station_code': station_code,
                'station_name': station.get('station_name'),
                'arrival_time': station.get('arrival_time'),
                'departure_time': station.get('departure_time'),
                'distance': station.get('distance'),
                'lat': MAJOR_STATIONS[station_code]['lat'],
                'lng': MAJOR_STATIONS[station_code]['lng']
            }
            stations_with_coords.append(station_info)
    
    result = {
        'train_number': train_number,
        'route_stations': stations_with_coords,
        'total_stations': len(stations_with_coords),
        'status': True
    }
    
    return jsonify(result)

@app.route('/api/stations-list')
def stations_list():
    """Get list of major stations with coordinates"""
    return jsonify(MAJOR_STATIONS)

# ============= UTILITY ENDPOINTS =============

@app.route('/api/map-data')
def map_data():
    """Get all map-related data for plotting"""
    return jsonify({
        'major_stations': MAJOR_STATIONS,
        'api_status': 'active',
        'total_stations': len(MAJOR_STATIONS)
    })

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'api_configured': bool(API_CONFIG['key']),
        'total_stations': len(MAJOR_STATIONS)
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)