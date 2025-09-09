from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
import requests
import json
import os
from dotenv import load_dotenv
import time
from datetime import datetime

load_dotenv()  # Load environment variables from .env file

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
DEMO_MODE = True  # Set to False when you want to use real API
DEBUG_API = True  # Set to False to reduce console output

# Your RapidAPI configuration (now secure)
API_CONFIG = {
    'key': os.getenv('RAPIDAPI_KEY'),
    'host': 'irctc1.p.rapidapi.com',
    'base_url': 'https://irctc1.p.rapidapi.com/api/v3'
}

def make_api_request(endpoint, params=None):
    """Make request to RapidAPI IRCTC API with better debugging"""
    url = f"{API_CONFIG['base_url']}/{endpoint}"
    
    headers = {
        'X-RapidAPI-Key': API_CONFIG['key'],
        'X-RapidAPI-Host': API_CONFIG['host'],
        'User-Agent': 'EcoCitty-App/1.0'
    }
    
    if DEBUG_API:
        print(f"🔗 Making API request to: {url}")
        print(f"📋 With params: {params}")
        print(f"🔑 API Key present: {'Yes' if API_CONFIG['key'] else 'No'}")
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=15)
        
        if DEBUG_API:
            print(f"📊 Response status: {response.status_code}")
            print(f"📄 Response preview: {response.text[:200]}...")
        
        if response.status_code == 200:
            try:
                data = response.json()
                if DEBUG_API:
                    print(f"✅ JSON parsed successfully")
                return data
            except json.JSONDecodeError as e:
                if DEBUG_API:
                    print(f"❌ JSON decode error: {e}")
                return {'error': 'Invalid JSON response', 'status': False}
        else:
            if DEBUG_API:
                print(f"❌ API Error: {response.status_code} - {response.text}")
            return {'error': f'API returned {response.status_code}', 'status': False, 'details': response.text}
            
    except requests.exceptions.Timeout:
        print("⏰ API request timed out")
        return {'error': 'Request timed out', 'status': False}
    except requests.exceptions.ConnectionError:
        print("🔌 Connection error to API")
        return {'error': 'Connection error', 'status': False}
    except requests.exceptions.RequestException as e:
        print(f"🔥 API request failed: {str(e)}")
        return {'error': str(e), 'status': False}
    except Exception as e:
        print(f"💥 Unexpected error: {str(e)}")
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
    'DEL': {'name': 'Delhi Junction', 'lat': 28.6139, 'lng': 77.2090},
    'LKO': {'name': 'Lucknow', 'lat': 26.8467, 'lng': 80.9462},
    'CSTM': {'name': 'Mumbai CST', 'lat': 18.9398, 'lng': 72.8355}
}

# Fallback train data for demo purposes
FALLBACK_TRAIN_DATA = {
    ('NDLS', 'BCT'): [
        {
            'train_number': '12952',
            'train_name': 'NEW DELHI MUMBAI RAJDHANI',
            'departure_time': '16:55',
            'arrival_time': '08:35',
            'duration': '15:40',
            'from_station_name': 'NEW DELHI',
            'to_station_name': 'MUMBAI CENTRAL',
            'distance': '1384 km'
        },
        {
            'train_number': '12954',
            'train_name': 'AG KR RAJDHANI',
            'departure_time': '17:20',
            'arrival_time': '11:50',
            'duration': '18:30',
            'from_station_name': 'NEW DELHI',
            'to_station_name': 'MUMBAI CENTRAL',
            'distance': '1384 km'
        },
        {
            'train_number': '12958',
            'train_name': 'ADI RAJDHANI',
            'departure_time': '19:15',
            'arrival_time': '09:55',
            'duration': '14:40',
            'from_station_name': 'NEW DELHI',
            'to_station_name': 'MUMBAI CENTRAL',
            'distance': '1384 km'
        }
    ],
    ('HWH', 'MAS'): [
        {
            'train_number': '12842',
            'train_name': 'COROMANDAL EXP',
            'departure_time': '14:25',
            'arrival_time': '10:40',
            'duration': '20:15',
            'from_station_name': 'HOWRAH JN',
            'to_station_name': 'CHENNAI CENTRAL',
            'distance': '1662 km'
        },
        {
            'train_number': '12864',
            'train_name': 'HWH YPR EXPRESS',
            'departure_time': '20:35',
            'arrival_time': '22:30',
            'duration': '25:55',
            'from_station_name': 'HOWRAH JN',
            'to_station_name': 'CHENNAI CENTRAL',
            'distance': '1662 km'
        }
    ],
    ('JP', 'NDLS'): [
        {
            'train_number': '12956',
            'train_name': 'JP RAJDHANI',
            'departure_time': '19:40',
            'arrival_time': '05:15',
            'duration': '09:35',
            'from_station_name': 'JAIPUR',
            'to_station_name': 'NEW DELHI',
            'distance': '308 km'
        },
        {
            'train_number': '12916',
            'train_name': 'ASHRAM EXPRESS',
            'departure_time': '15:25',
            'arrival_time': '21:35',
            'duration': '06:10',
            'from_station_name': 'JAIPUR',
            'to_station_name': 'NEW DELHI',
            'distance': '308 km'
        }
    ],
    ('PUNE', 'BCT'): [
        {
            'train_number': '11010',
            'train_name': 'SINHAGAD EXP',
            'departure_time': '06:40',
            'arrival_time': '10:05',
            'duration': '03:25',
            'from_station_name': 'PUNE JN',
            'to_station_name': 'MUMBAI CST',
            'distance': '192 km'
        },
        {
            'train_number': '12124',
            'train_name': 'DECCAN QUEEN',
            'departure_time': '17:10',
            'arrival_time': '20:25',
            'duration': '03:15',
            'from_station_name': 'PUNE JN',
            'to_station_name': 'MUMBAI CST',
            'distance': '192 km'
        }
    ]
}

# Sample live train status data
SAMPLE_LIVE_STATUS = {
    '12952': {
        'train_number': '12952',
        'train_name': 'NEW DELHI MUMBAI RAJDHANI',
        'current_station_name': 'KOTA JN',
        'current_station_code': 'KOTA',
        'next_station_name': 'SAWAI MADHOPUR',
        'next_station_code': 'SWM',
        'delay_minutes': 15,
        'current_speed': 110,
        'last_updated': datetime.now().strftime('%H:%M')
    },
    '12954': {
        'train_number': '12954',
        'train_name': 'AG KR RAJDHANI',
        'current_station_name': 'MATHURA JN',
        'current_station_code': 'MTJ',
        'next_station_name': 'AGRA CANTT',
        'next_station_code': 'AGC',
        'delay_minutes': 0,
        'current_speed': 130,
        'last_updated': datetime.now().strftime('%H:%M')
    }
}

# Sample live station data
SAMPLE_STATION_DATA = {
    'NDLS': [
        {
            'train_number': '12952',
            'train_name': 'NEW DELHI MUMBAI RAJDHANI',
            'scheduled_arrival_time': '16:50',
            'expected_arrival_time': '17:05',
            'scheduled_departure_time': '16:55',
            'expected_departure_time': '17:10',
            'delay_minutes': 15,
            'source_station_name': 'NEW DELHI',
            'destination_station_name': 'MUMBAI CENTRAL',
            'platform_number': '16'
        },
        {
            'train_number': '12001',
            'train_name': 'NDLS SHC SHATABDI',
            'scheduled_arrival_time': '17:30',
            'expected_arrival_time': '17:30',
            'scheduled_departure_time': '17:35',
            'expected_departure_time': '17:35',
            'delay_minutes': 0,
            'source_station_name': 'NEW DELHI',
            'destination_station_name': 'HABIBGANJ',
            'platform_number': '8'
        }
    ]
}

@app.route('/')
def home():
    return render_template('index.html')

# ============= RAILWAY API ENDPOINTS =============

@app.route('/api/search-trains', methods=['GET'])
def search_trains():
    from_station = request.args.get('from_station', '').upper()
    to_station = request.args.get('to_station', '').upper()
    
    print(f"🔍 Search trains request: from {from_station} to {to_station}")
    
    # Check if stations exist in our database
    if from_station not in MAJOR_STATIONS:
        return jsonify({
            'error': f'Station {from_station} not found in our database',
            'status': False,
            'available_stations': list(MAJOR_STATIONS.keys())
        })
    
    if to_station not in MAJOR_STATIONS:
        return jsonify({
            'error': f'Station {to_station} not found in our database',
            'status': False,
            'available_stations': list(MAJOR_STATIONS.keys())
        })
    
    if DEMO_MODE:
        print(f"🎯 Using DEMO mode for train search")
        # Use fallback data
        fallback_key = (from_station, to_station)
        fallback_trains = FALLBACK_TRAIN_DATA.get(fallback_key, [])
        
        # Add some realistic delay simulation
        time.sleep(0.5)  # Simulate API delay
        
        data = {
            'data': fallback_trains,
            'status': len(fallback_trains) > 0,
            'source': 'demo'
        }
    else:
        # Try real API first
        data = make_api_request('getTrainsBetweenStations', {
            'fromStationCode': from_station,
            'toStationCode': to_station
        })
        
        # Use fallback if API fails
        if not data.get('status'):
            print(f"⚠️ API failed, using fallback data")
            fallback_key = (from_station, to_station)
            fallback_trains = FALLBACK_TRAIN_DATA.get(fallback_key, [])
            
            data = {
                'data': fallback_trains,
                'status': len(fallback_trains) > 0,
                'source': 'fallback'
            }
    
    # Add station coordinates for map plotting
    result = {
        'trains': data.get('data', []),
        'from_station_coords': MAJOR_STATIONS.get(from_station),
        'to_station_coords': MAJOR_STATIONS.get(to_station),
        'from_station_code': from_station,
        'to_station_code': to_station,
        'status': data.get('status', False),
        'source': data.get('source', 'api')
    }
    
    print(f"✅ Returning {len(result['trains'])} trains from {result['source']}")
    return jsonify(result)

@app.route('/api/live-train-status/<train_number>')
def live_train_status(train_number):
    """Get live status of a specific train"""
    start_day = request.args.get('start_day', 0, type=int)
    
    print(f"🚂 Getting live status for train {train_number}")
    
    if DEMO_MODE:
        print(f"🎯 Using DEMO mode for live train status")
        # Use sample data
        if train_number in SAMPLE_LIVE_STATUS:
            return jsonify({
                'status': True,
                'data': SAMPLE_LIVE_STATUS[train_number],
                'source': 'demo'
            })
        else:
            # Generate realistic sample data
            sample_data = {
                'train_number': train_number,
                'train_name': f'TRAIN {train_number}',
                'current_station_name': 'INTERMEDIATE STN',
                'current_station_code': 'INTM',
                'next_station_name': 'NEXT STATION',
                'next_station_code': 'NEXT',
                'delay_minutes': 5,
                'current_speed': 95,
                'last_updated': datetime.now().strftime('%H:%M')
            }
            return jsonify({
                'status': True,
                'data': sample_data,
                'source': 'demo'
            })
    else:
        data = make_api_request('getLiveTrainStatus', {
            'trainNo': train_number,
            'startDay': start_day
        })
        
        return jsonify(data)

@app.route('/api/live-station/<station_code>')
def live_station(station_code):
    """Get live trains at a station"""
    hours = request.args.get('hours', 2, type=int)
    station_code = station_code.upper()
    
    print(f"📡 Getting live station data for {station_code}")
    
    if station_code not in MAJOR_STATIONS:
        return jsonify({
            'error': f'Station {station_code} not found',
            'status': False,
            'available_stations': list(MAJOR_STATIONS.keys())
        })
    
    if DEMO_MODE:
        print(f"🎯 Using DEMO mode for live station data")
        # Use sample data or generate some
        station_data = SAMPLE_STATION_DATA.get(station_code, [
            {
                'train_number': '12001',
                'train_name': f'SAMPLE TRAIN FROM {station_code}',
                'scheduled_arrival_time': '18:30',
                'expected_arrival_time': '18:35',
                'scheduled_departure_time': '18:35',
                'expected_departure_time': '18:40',
                'delay_minutes': 5,
                'source_station_name': MAJOR_STATIONS[station_code]['name'],
                'destination_station_name': 'DESTINATION',
                'platform_number': '3'
            }
        ])
        
        result = {
            'station_data': station_data,
            'station_coords': MAJOR_STATIONS.get(station_code),
            'station_code': station_code,
            'status': True,
            'source': 'demo'
        }
    else:
        data = make_api_request('getLiveStation', {
            'stationCode': station_code,
            'hours': hours
        })
        
        # Add station coordinates
        result = {
            'station_data': data.get('data', []) if data.get('status') else [],
            'station_coords': MAJOR_STATIONS.get(station_code),
            'station_code': station_code,
            'status': data.get('status', False)
        }
    
    return jsonify(result)

@app.route('/api/train-schedule/<train_number>')
def train_schedule(train_number):
    """Get train schedule"""
    print(f"📋 Getting schedule for train {train_number}")
    
    if DEMO_MODE:
        # Return sample schedule data
        sample_schedule = [
            {
                'station_code': 'NDLS',
                'station_name': 'NEW DELHI',
                'arrival_time': '00:00',
                'departure_time': '16:55',
                'distance': '0',
                'halt_time': '0'
            },
            {
                'station_code': 'GZB',
                'station_name': 'GHAZIABAD',
                'arrival_time': '17:28',
                'departure_time': '17:30',
                'distance': '19',
                'halt_time': '2'
            },
            {
                'station_code': 'AGC',
                'station_name': 'AGRA CANTT',
                'arrival_time': '19:50',
                'departure_time': '19:55',
                'distance': '188',
                'halt_time': '5'
            }
        ]
        
        return jsonify({
            'status': True,
            'data': sample_schedule,
            'source': 'demo'
        })
    else:
        data = make_api_request('getTrainSchedule', {
            'trainNo': train_number
        })
        
        return jsonify(data)

@app.route('/api/pnr-status/<pnr_number>')
def pnr_status(pnr_number):
    """Get PNR status"""
    print(f"🎫 Getting PNR status for {pnr_number}")
    
    if DEMO_MODE:
        # Return sample PNR data
        sample_pnr = {
            'pnr_number': pnr_number,
            'train_number': '12952',
            'train_name': 'NEW DELHI MUMBAI RAJDHANI',
            'from_station': 'NDLS',
            'to_station': 'BCT',
            'reservation_status': 'CONFIRMED',
            'coach': 'A1',
            'seat': '45',
            'class': '3A'
        }
        
        return jsonify({
            'status': True,
            'data': sample_pnr,
            'source': 'demo'
        })
    else:
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
    
    print(f"💺 Checking seat availability for train {train_no}")
    
    if DEMO_MODE:
        # Return sample availability data
        sample_availability = {
            'train_number': train_no,
            'class': train_class,
            'available_seats': 'AVAILABLE-142',
            'fare': '₹1,450'
        }
        
        return jsonify({
            'status': True,
            'data': sample_availability,
            'source': 'demo'
        })
    else:
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
    print(f"🔍 Searching stations for query: {query}")
    
    if DEMO_MODE:
        # Filter from our major stations
        matching_stations = []
        query_lower = query.lower()
        
        for code, info in MAJOR_STATIONS.items():
            if query_lower in code.lower() or query_lower in info['name'].lower():
                matching_stations.append({
                    'station_code': code,
                    'station_name': info['name']
                })
        
        return jsonify({
            'status': True,
            'data': matching_stations,
            'source': 'demo'
        })
    else:
        data = make_api_request('searchStation', {
            'query': query
        })
        
        return jsonify(data)

@app.route('/api/train-route/<train_number>')
def train_route(train_number):
    """Get complete train route with coordinates for map plotting"""
    print(f"🗺️ Getting route for train {train_number}")
    
    if DEMO_MODE:
        # Return sample route data
        sample_route = [
            {
                'station_code': 'NDLS',
                'station_name': 'NEW DELHI',
                'arrival_time': '00:00',
                'departure_time': '16:55',
                'distance': '0',
                'lat': MAJOR_STATIONS['NDLS']['lat'],
                'lng': MAJOR_STATIONS['NDLS']['lng']
            },
            {
                'station_code': 'JP',
                'station_name': 'JAIPUR',
                'arrival_time': '21:40',
                'departure_time': '21:55',
                'distance': '308',
                'lat': MAJOR_STATIONS['JP']['lat'],
                'lng': MAJOR_STATIONS['JP']['lng']
            },
            {
                'station_code': 'BCT',
                'station_name': 'MUMBAI CENTRAL',
                'arrival_time': '08:35',
                'departure_time': '00:00',
                'distance': '1384',
                'lat': MAJOR_STATIONS['BCT']['lat'],
                'lng': MAJOR_STATIONS['BCT']['lng']
            }
        ]
        
        result = {
            'train_number': train_number,
            'route_stations': sample_route,
            'total_stations': len(sample_route),
            'status': True,
            'source': 'demo'
        }
        
        return jsonify(result)
    else:
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
        'total_stations': len(MAJOR_STATIONS),
        'demo_mode': DEMO_MODE
    })

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'api_configured': bool(API_CONFIG['key']),
        'total_stations': len(MAJOR_STATIONS),
        'demo_mode': DEMO_MODE,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/toggle-demo', methods=['POST'])
def toggle_demo_mode():
    """Toggle demo mode - useful for testing"""
    global DEMO_MODE
    DEMO_MODE = not DEMO_MODE
    return jsonify({
        'demo_mode': DEMO_MODE,
        'message': f'Demo mode {"enabled" if DEMO_MODE else "disabled"}'
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("🚀 Starting EcoCitty Flask App...")
    print(f"🎯 Demo Mode: {'ENABLED' if DEMO_MODE else 'DISABLED'}")
    print(f"🔍 Debug API: {'ENABLED' if DEBUG_API else 'DISABLED'}")
    print(f"🔑 API Key: {'CONFIGURED' if API_CONFIG['key'] else 'NOT SET'}")
    print(f"📍 Available Stations: {len(MAJOR_STATIONS)}")
    print("=" * 50)
    
    app.run(debug=True, port=5000)