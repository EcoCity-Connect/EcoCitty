// Mobile Menu Toggle
document.getElementById('mobile-menu-button').addEventListener('click', () => {
    document.getElementById('mobile-menu').classList.toggle('hidden');
});

// --- Waste Collection Feature ---
const neighborhoodInput = document.getElementById('neighborhood-input');
const searchWasteBtn = document.getElementById('search-waste-btn');
const wasteResultsDiv = document.getElementById('waste-results');

// ADDED SAMPLE DATA TO MAKE THE FEATURE WORK
const wasteSchedules = {
    'karol bagh': {
        general: 'Monday, Thursday',
        recycling: 'Thursday'
    },
    'saket': {
        general: 'Tuesday, Friday',
        recycling: 'Friday'
    },
    'dwarka': {
        general: 'Wednesday, Saturday',
        recycling: 'Wednesday'
    },
    'cp': {
        general: 'Daily except Sunday',
        recycling: 'Wednesday, Saturday'
    },
    'lajpat nagar': {
        general: 'Tuesday, Friday',
        recycling: 'Friday'
    }
};

function searchSchedule() {
    const query = neighborhoodInput.value.trim().toLowerCase();
    if (!query) {
        wasteResultsDiv.innerHTML = `<p class="text-red-500">Please enter a neighborhood.</p>`;
        return;
    }
    const schedule = wasteSchedules[query];
    if (schedule) {
        wasteResultsDiv.innerHTML = `
            <h3 class="font-bold text-lg">${neighborhoodInput.value.trim()}</h3>
            <p><span class="font-semibold">General Waste:</span> ${schedule.general}</p>
            <p><span class="font-semibold">Recycling:</span> ${schedule.recycling}</p>
        `;
    } else {
        wasteResultsDiv.innerHTML = `<p class="text-gray-600">Sorry, no schedule available for "${neighborhoodInput.value.trim()}". Try: Karol Bagh, Saket, Dwarka, CP, Lajpat Nagar</p>`;
    }
}
searchWasteBtn.addEventListener('click', searchSchedule);
neighborhoodInput.addEventListener('keyup', (event) => { if (event.key === "Enter") searchSchedule(); });

// --- Carbon Footprint Calculator ---
const tabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(item => item.classList.remove('active'));
        tab.classList.add('active');
        const target = document.getElementById(tab.dataset.tab);
        tabContents.forEach(content => content.classList.remove('active'));
        target.classList.add('active');
    });
});

document.getElementById('calculate-carbon-btn').addEventListener('click', () => {
    const distance = parseFloat(document.getElementById('distance').value) || 0;
    const transportFactor = parseFloat(document.getElementById('transport-mode').value) || 0;
    const electricity = parseFloat(document.getElementById('electricity').value) || 0;
    const carbonResultDiv = document.getElementById('carbon-result');

    const electricityFactor = 0.8; // Approx. for India

    const commuteFootprint = (distance * transportFactor * 30) / 1000; // in kg
    const energyFootprint = electricity * electricityFactor; // in kg
    const totalFootprint = commuteFootprint + energyFootprint;

    carbonResultDiv.innerHTML = `
        <p class="text-lg">Your estimated monthly footprint is:</p>
        <p class="text-3xl font-bold text-emerald-600">${totalFootprint.toFixed(2)} kg CO₂e</p>
        <div class="mt-2 text-sm text-gray-600">
            <p>Commute: ${commuteFootprint.toFixed(2)} kg | Domestic Energy: ${energyFootprint.toFixed(2)} kg</p>
        </div>`;
});

// --- Leaflet Maps (basic setup only, no fake routes/data) ---
const delhiCoords = [28.6139, 77.2090];

// Public transport map
var map = L.map('map').setView(delhiCoords, 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
    maxZoom: 19, 
    attribution: '© OpenStreetMap' 
}).addTo(map);

// Safety map
var safetymap = L.map('safetymap').setView(delhiCoords, 12);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { 
    attribution: '© CARTO', 
    maxZoom: 20 
}).addTo(safetymap);

// Railway map
var railwayMap = L.map('railway-map').setView(delhiCoords, 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(railwayMap);

// ============= RAILWAY API INTEGRATION =============

class RailwayAPI {
    constructor(baseUrl = 'http://localhost:5000') {
        this.baseUrl = baseUrl;
        this.map = railwayMap;
        this.trainMarkers = [];
        this.routeLines = [];
    }

    // Clear all railway markers
    clearRailwayMarkers() {
        this.trainMarkers.forEach(marker => {
            if (this.map.hasLayer(marker)) {
                this.map.removeLayer(marker);
            }
        });
        this.routeLines.forEach(line => {
            if (this.map.hasLayer(line)) {
                this.map.removeLayer(line);
            }
        });
        this.trainMarkers = [];
        this.routeLines = [];
    }

    // Search trains between stations with improved error handling
    async searchTrains(fromStation, toStation) {
        try {
            console.log(`🔍 Searching trains: ${fromStation} → ${toStation}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
            
            const response = await fetch(
                `${this.baseUrl}/api/search-trains?from_station=${fromStation}&to_station=${toStation}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    signal: controller.signal
                }
            );

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📊 API Response:', data);
            
            if (data.status && data.trains.length > 0) {
                this.plotTrainRoute(data);
                return data;
            } else if (data.error) {
                console.log('❌ API Error:', data.error);
                return null;
            } else {
                console.log('❌ No trains found between stations');
                return null;
            }
        } catch (error) {
            console.error('🔥 Error searching trains:', error);
            
            // Show user-friendly error message
            if (error.name === 'AbortError') {
                this.showUserMessage('⏰ Request timed out. Please try again.', 'error');
            } else if (error.message.includes('Failed to fetch')) {
                this.showUserMessage('🔌 Cannot connect to server. Make sure Flask app is running on port 5000.', 'error');
            } else {
                this.showUserMessage(`❌ Error: ${error.message}`, 'error');
            }
            
            return null;
        }
    }

    // Show user messages in the results div
    showUserMessage(message, type = 'info') {
        const resultsDiv = document.getElementById('railway-results');
        const colorClass = type === 'error' ? 'text-red-600' : type === 'success' ? 'text-green-600' : 'text-blue-600';
        resultsDiv.innerHTML = `<p class="${colorClass}">${message}</p>`;
    }

    // Plot train route on map
    plotTrainRoute(routeData) {
        this.clearRailwayMarkers();
        
        const { from_station_coords, to_station_coords, from_station_code, to_station_code, trains } = routeData;
        
        if (from_station_coords && to_station_coords) {
            // Add source station marker
            const fromMarker = L.marker([from_station_coords.lat, from_station_coords.lng], {
                icon: this.createStationIcon('source')
            }).addTo(this.map)
              .bindPopup(`<b>🚉 ${from_station_coords.name}</b><br>Source Station<br>Code: ${from_station_code}<br>Available Trains: ${trains.length}`);
            
            // Add destination station marker  
            const toMarker = L.marker([to_station_coords.lat, to_station_coords.lng], {
                icon: this.createStationIcon('destination')
            }).addTo(this.map)
              .bindPopup(`<b>🎯 ${to_station_coords.name}</b><br>Destination Station<br>Code: ${to_station_code}`);
            
            // Add route line with animation
            const routeLine = L.polyline([
                [from_station_coords.lat, from_station_coords.lng],
                [to_station_coords.lat, to_station_coords.lng]
            ], {
                color: '#2563eb',
                weight: 4,
                opacity: 0.8,
                dashArray: '10, 5'
            }).addTo(this.map);
            
            // Add moving train icon (simulated)
            const midLat = (from_station_coords.lat + to_station_coords.lat) / 2;
            const midLng = (from_station_coords.lng + to_station_coords.lng) / 2;
            
            const trainMarker = L.marker([midLat, midLng], {
                icon: this.createTrainIcon()
            }).addTo(this.map)
              .bindPopup(`🚂 Route: ${from_station_code} → ${to_station_code}<br>Click trains below for live status`);
            
            this.trainMarkers.push(fromMarker, toMarker, trainMarker);
            this.routeLines.push(routeLine);
            
            // Fit map to show route
            const group = L.featureGroup([fromMarker, toMarker]);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    // Get live train status and plot on map
    async getLiveTrainStatus(trainNumber, startDay = 0) {
        try {
            console.log(`🚂 Getting live status for train ${trainNumber}`);
            
            const response = await fetch(`${this.baseUrl}/api/live-train-status/${trainNumber}?start_day=${startDay}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📊 Live status response:', data);
            
            if (data.status && data.data) {
                return data.data;
            }
            return null;
        } catch (error) {
            console.error('🔥 Error getting live train status:', error);
            return null;
        }
    }

    // Get live station data and plot
    async getLiveStationData(stationCode, hours = 2) {
        try {
            console.log(`📡 Getting live station data for ${stationCode}`);
            
            const response = await fetch(`${this.baseUrl}/api/live-station/${stationCode}?hours=${hours}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📊 Live station response:', data);
            
            if (data.status && data.station_coords) {
                this.plotLiveStation(data);
                return data.station_data;
            } else if (data.error) {
                this.showUserMessage(`❌ ${data.error}`, 'error');
            }
            return null;
        } catch (error) {
            console.error('🔥 Error getting live station data:', error);
            this.showUserMessage('❌ Error getting station data. Please try again.', 'error');
            return null;
        }
    }

    // Plot live station data
    plotLiveStation(stationData) {
        this.clearRailwayMarkers();
        
        const { station_coords, station_code, station_data } = stationData;
        
        if (station_coords) {
            const stationMarker = L.marker([station_coords.lat, station_coords.lng], {
                icon: this.createStationIcon('live')
            }).addTo(this.map)
              .bindPopup(`
                <b>📡 ${station_coords.name}</b><br>
                Station Code: ${station_code}<br>
                Live Trains: ${station_data.length}<br>
                <small>Real-time data</small>
              `);
            
            this.trainMarkers.push(stationMarker);
            this.map.setView([station_coords.lat, station_coords.lng], 12);
        }
    }

    // Create custom icons with better styling
    createStationIcon(type) {
        let iconColor, iconText;
        
        switch(type) {
            case 'source':
                iconColor = '#22c55e';
                iconText = '🚉';
                break;
            case 'destination':
                iconColor = '#ef4444';
                iconText = '🎯';
                break;
            case 'live':
                iconColor = '#3b82f6';
                iconText = '📡';
                break;
            default:
                iconColor = '#6b7280';
                iconText = '🚉';
        }
        
        return L.divIcon({
            html: `
                <div style="
                    background-color: ${iconColor}; 
                    width: 24px; 
                    height: 24px; 
                    border-radius: 50%; 
                    border: 3px solid white; 
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                ">${iconText}</div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
    }

    createTrainIcon() {
        return L.divIcon({
            html: `
                <div style="
                    background: linear-gradient(45deg, #dc2626, #ef4444);
                    color: white; 
                    padding: 4px 8px; 
                    border-radius: 8px; 
                    font-size: 14px; 
                    font-weight: bold;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    border: 2px solid white;
                ">🚂</div>
            `,
            iconSize: [32, 24],
            iconAnchor: [16, 12]
        });
    }
}

// Initialize Railway API
const railwayAPI = new RailwayAPI();

// ============= RAILWAY FUNCTIONS =============

// Search trains between stations
async function searchRailwayTrains() {
    const fromStation = document.getElementById('railway-from-station').value.trim().toUpperCase();
    const toStation = document.getElementById('railway-to-station').value.trim().toUpperCase();
    const resultsDiv = document.getElementById('railway-results');
    
    if (!fromStation || !toStation) {
        resultsDiv.innerHTML = '<p class="text-red-500">Please enter both source and destination stations</p>';
        return;
    }

    if (fromStation === toStation) {
        resultsDiv.innerHTML = '<p class="text-yellow-600">⚠️ Source and destination cannot be the same!</p>';
        return;
    }

    resultsDiv.innerHTML = `
        <div class="text-center p-4">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p class="text-blue-500 mt-2">🔍 Searching for trains...</p>
        </div>
    `;

    try {
        const trains = await railwayAPI.searchTrains(fromStation, toStation);
        if (trains && trains.trains.length > 0) {
            displayTrainResults(trains.trains, trains.source);
        } else {
            resultsDiv.innerHTML = `
                <div class="text-center p-4">
                    <p class="text-gray-600">❌ No trains found between ${fromStation} and ${toStation}</p>
                    <p class="text-sm text-gray-500 mt-2">Please check station codes or try different routes</p>
                    <p class="text-sm text-blue-500 mt-1">Available stations: NDLS, BCT, HWH, MAS, PUNE, JP, etc.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error searching trains:', error);
        resultsDiv.innerHTML = '<p class="text-red-500">❌ Error searching trains. Please try again.</p>';
    }
}

// Display train results with improved UI
function displayTrainResults(trains, source = 'api') {
    const resultsDiv = document.getElementById('railway-results');
    
    if (trains.length === 0) {
        resultsDiv.innerHTML = '<p class="text-gray-600">No trains found</p>';
        return;
    }

    // Sort trains by train number
    trains.sort((a, b) => a.train_number - b.train_number);

    let html = `
        <div class="mb-3">
            <h4 class="font-semibold text-green-600">
                ✅ Found ${trains.length} trains 
                <span class="text-xs text-gray-500">(${source === 'demo' ? 'Demo Data' : source === 'fallback' ? 'Backup Data' : 'Live API'})</span>
            </h4>
        </div>
    `;
    
    trains.slice(0, 10).forEach((train) => { // Show top 10 trains
        const duration = train.duration || 'N/A';
        const distance = train.distance || 'N/A';
        
        html += `
            <div class="train-card" onclick="showTrainLiveStatus('${train.train_number}')">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <div class="font-bold text-blue-600 text-lg">${train.train_number}</div>
                        <div class="text-sm text-gray-600 font-medium">${train.train_name || 'N/A'}</div>
                    </div>
                    <div class="text-right text-xs text-gray-500">
                        <div>🕒 ${duration}</div>
                        ${distance !== 'N/A' ? `<div>📏 ${distance}</div>` : ''}
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div class="bg-green-50 border border-green-200 p-2 rounded">
                        <strong class="text-green-700">🚉 Departure</strong><br>
                        <div class="text-gray-800">${train.from_station_name || 'N/A'}</div>
                        <div class="text-green-600 font-bold">${train.departure_time || 'N/A'}</div>
                    </div>
                    <div class="bg-red-50 border border-red-200 p-2 rounded">
                        <strong class="text-red-700">🎯 Arrival</strong><br>
                        <div class="text-gray-800">${train.to_station_name || 'N/A'}</div>
                        <div class="text-red-600 font-bold">${train.arrival_time || 'N/A'}</div>
                    </div>
                </div>
                <div class="text-center mt-3">
                    <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                        🚂 Click for Live Status
                    </span>
                </div>
            </div>
        `;
    });

    if (trains.length > 10) {
        html += `<div class="text-center text-sm text-gray-500 mt-2">... and ${trains.length - 10} more trains</div>`;
    }

    resultsDiv.innerHTML = html;
}

// Show train live status with enhanced modal
async function showTrainLiveStatus(trainNumber) {
    try {
        console.log(`Getting live status for train ${trainNumber}`);
        
        // Show modal with loading
        showRailwayModal(trainNumber, `
            <div class="text-center p-8">
                <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p class="text-blue-500 mt-4">🔍 Fetching live status...</p>
            </div>
        `);
        
        // Get live train status
        const liveStatus = await railwayAPI.getLiveTrainStatus(trainNumber);
        
        if (liveStatus) {
            displayLiveStatusInModal(trainNumber, liveStatus);
        } else {
            showRailwayModal(trainNumber, `
                <div class="text-center p-6">
                    <div class="text-6xl mb-4">🚂</div>
                    <h3 class="text-lg font-semibold text-gray-700 mb-2">Live Status Unavailable</h3>
                    <p class="text-gray-600">Train ${trainNumber} might not be running today or live tracking is unavailable.</p>
                    <div class="mt-4 p-4 bg-blue-50 rounded-lg">
                        <p class="text-sm text-blue-600">💡 This is demo data. In production, you'd get real-time GPS location, delays, and platform information.</p>
                    </div>
                </div>
            `);
        }

    } catch (error) {
        console.error('Error getting train status:', error);
        showRailwayModal(trainNumber, `
            <div class="text-center p-6">
                <div class="text-6xl mb-4">❌</div>
                <h3 class="text-lg font-semibold text-red-600 mb-2">Error Fetching Status</h3>
                <p class="text-gray-600">Unable to get live status. Please try again later.</p>
            </div>
        `);
    }
}

// Show railway modal with improved styling
function showRailwayModal(trainNumber, content) {
    // Remove existing modal if any
    const existingModal = document.getElementById('railway-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'railway-modal';
    modal.className = 'railway-modal';

    const modalContent = document.createElement('div');
    modalContent.className = 'railway-modal-content';

    modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e5e7eb;">
            <h2 style="color: #1f2937; margin: 0; font-size: 1.5em; font-weight: bold;">
                🚂 Train ${trainNumber}
                <span style="font-size: 0.7em; color: #6b7280; font-weight: normal;">Live Status</span>
            </h2>
            <button onclick="document.getElementById('railway-modal').remove()" 
                    style="background: none; border: none; font-size: 28px; cursor: pointer; color: #6b7280; hover: #ef4444;">×</button>
        </div>
        <div id="railway-modal-content">${content}</div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close on backdrop click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.getElementById('railway-modal')) {
            modal.remove();
        }
    });
}

// Display live status in modal with better formatting
function displayLiveStatusInModal(trainNumber, statusData) {
    let content = '';
    
    if (!statusData || !statusData.current_station_name) {
        content = `
            <div style="text-align: center; padding: 30px;">
                <div style="font-size: 4em; margin-bottom: 20px;">🚂</div>
                <h3 style="color: #6b7280; margin-bottom: 10px;">No Live Tracking Data</h3>
                <p style="color: #9ca3af;">Train ${trainNumber} tracking is currently unavailable.</p>
                <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px;">
                    <p style="color: #92400e; font-size: 14px;">💡 This could mean the train is not running today or GPS tracking is temporarily disabled.</p>
                </div>
            </div>
        `;
    } else {
        const delay = statusData.delay_minutes ? `${statusData.delay_minutes} mins late` : 'On time';
        const currentStation = statusData.current_station_name || 'Unknown';
        const nextStation = statusData.next_station_name || 'N/A';
        const speed = statusData.current_speed || '0';
        const lastUpdated = statusData.last_updated || 'N/A';
        const delayColor = statusData.delay_minutes > 0 ? '#dc3545' : '#28a745';
        
        content = `
            <div style="space-y: 20px;">
                <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 5px solid #667eea;">
                    <h3 style="color: #667eea; margin-bottom: 15px; font-size: 1.2em;">📍 Current Location</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <p style="margin: 5px 0;"><strong>Station:</strong> ${currentStation}</p>
                            <p style="margin: 5px 0;"><strong>Speed:</strong> ${speed} km/h</p>
                        </div>
                        <div>
                            <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${delayColor}; font-weight: bold;">${delay}</span></p>
                            <p style="margin: 5px 0;"><strong>Updated:</strong> ${lastUpdated}</p>
                        </div>
                    </div>
                </div>
                
                <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 5px solid #1976d2;">
                    <h3 style="color: #1976d2; margin-bottom: 15px; font-size: 1.2em;">🎯 Next Stop</h3>
                    <p style="margin: 5px 0;"><strong>Station:</strong> ${nextStation}</p>
                    <p style="margin: 5px 0; color: #666;"><em>Approaching next station...</em></p>
                </div>
                
                <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <button onclick="refreshTrainStatus('${trainNumber}')" 
                            style="background: linear-gradient(45deg, #10b981, #059669); color: white; border: none; padding: 12px 30px; border-radius: 25px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); transition: all 0.3s;">
                        🔄 Refresh Status
                    </button>
                    <p style="margin-top: 10px; color: #6b7280; font-size: 12px;">Last updated: ${lastUpdated}</p>
                </div>
            </div>
        `;
    }
    
    document.getElementById('railway-modal-content').innerHTML = content;
}

// Refresh train status
async function refreshTrainStatus(trainNumber) {
    document.getElementById('railway-modal-content').innerHTML = `
        <div style="text-center; padding: 40px;">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p style="margin-top: 15px; color: #6b7280;">🔄 Refreshing status...</p>
        </div>
    `;
    await showTrainLiveStatus(trainNumber);
}

// Get live station info with better error handling
async function getLiveStationInfo() {
    const stationCode = document.getElementById('railway-from-station').value.trim().toUpperCase();
    const resultsDiv = document.getElementById('railway-results');
    
    if (!stationCode) {
        resultsDiv.innerHTML = '<p class="text-red-500">Please enter a station code in the "From / Live Station" field</p>';
        return;
    }

    resultsDiv.innerHTML = `
        <div class="text-center p-4">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p class="text-blue-500 mt-2">📡 Getting live station data...</p>
        </div>
    `;

    try {
        const stationData = await railwayAPI.getLiveStationData(stationCode);
        if (stationData && stationData.length > 0) {
            displayLiveStationData(stationData, stationCode);
        } else {
            resultsDiv.innerHTML = `
                <div class="text-center p-4">
                    <p class="text-gray-600">❌ No live data found for station ${stationCode}</p>
                    <p class="text-sm text-gray-500 mt-2">Station might not exist or no trains scheduled</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error getting station data:', error);
        resultsDiv.innerHTML = '<p class="text-red-500">❌ Error getting station data. Please try again.</p>';
    }
}

// Display live station data with improved formatting
function displayLiveStationData(stationData, stationCode) {
    const resultsDiv = document.getElementById('railway-results');
    
    let html = `
        <div class="mb-4">
            <h3 class="font-bold text-lg text-blue-600">📡 Live Trains at ${stationCode}</h3>
            <p class="text-sm text-gray-500">Real-time arrivals and departures</p>
        </div>
    `;
    
    stationData.slice(0, 15).forEach((train) => {
        const status = train.delay_minutes ? `Delayed by ${train.delay_minutes} min` : 'On Time';
        const statusClass = train.delay_minutes ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
        const platform = train.platform_number ? `Platform ${train.platform_number}` : 'Platform TBD';
        
        html += `
            <div class="train-card" onclick="showTrainLiveStatus('${train.train_number}')">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex-1">
                        <div class="font-bold text-blue-600 text-lg">${train.train_number}</div>
                        <div class="text-sm text-gray-600 font-medium">${train.train_name || 'N/A'}</div>
                    </div>
                    <div class="text-right">
                        <span class="px-2 py-1 rounded-full text-xs font-medium ${statusClass}">
                            ${status}
                        </span>
                        <div class="text-xs text-gray-500 mt-1">${platform}</div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2 text-sm mb-2">
                    <div class="bg-gray-50 border border-gray-200 p-2 rounded">
                        <strong class="text-gray-700">🚉 From</strong><br>
                        <div class="text-gray-800">${train.source_station_name || 'N/A'}</div>
                    </div>
                    <div class="bg-blue-50 border border-blue-200 p-2 rounded">
                        <strong class="text-blue-700">🎯 To</strong><br>
                        <div class="text-gray-800">${train.destination_station_name || 'N/A'}</div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    <div class="text-center p-2 bg-green-50 rounded">
                        <div class="font-semibold text-green-700">Scheduled Arrival</div>
                        <div class="text-green-600">${train.scheduled_arrival_time || 'N/A'}</div>
                    </div>
                    <div class="text-center p-2 bg-orange-50 rounded">
                        <div class="font-semibold text-orange-700">Expected Arrival</div>
                        <div class="text-orange-600">${train.expected_arrival_time || 'N/A'}</div>
                    </div>
                </div>
            </div>
        `;
    });

    if (stationData.length > 15) {
        html += `<div class="text-center text-sm text-gray-500 mt-2">... and ${stationData.length - 15} more trains</div>`;
    }

    resultsDiv.innerHTML = html;
}

// Set station codes in input fields
function setStations(from, to) {
    document.getElementById('railway-from-station').value = from;
    if (to) {
        document.getElementById('railway-to-station').value = to;
    }
    
    // Auto-focus to next field if both are filled
    if (from && to) {
        document.getElementById('railway-from-station').focus();
    }
}

// Enhanced keyboard navigation
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement.id === 'railway-from-station') {
            // If only from station is filled, move to to station
            const toStation = document.getElementById('railway-to-station').value.trim();
            if (!toStation) {
                document.getElementById('railway-to-station').focus();
            } else {
                searchRailwayTrains();
            }
        } else if (activeElement.id === 'railway-to-station') {
            searchRailwayTrains();
        }
    }
});

// Auto-complete station codes (basic implementation)
const commonStations = {
    'new delhi': 'NDLS',
    'delhi': 'NDLS', 
    'mumbai central': 'BCT',
    'mumbai': 'BCT',
    'howrah': 'HWH',
    'kolkata': 'HWH',
    'chennai central': 'MAS',
    'chennai': 'MAS',
    'bangalore': 'SBC',
    'pune': 'PUNE',
    'jaipur': 'JP',
    'agra': 'AGC'
};

// Add input event listeners for auto-suggestions
document.getElementById('railway-from-station').addEventListener('input', function(e) {
    const value = e.target.value.toLowerCase();
    if (commonStations[value]) {
        // Show a small hint
        console.log(`Suggestion: ${value} → ${commonStations[value]}`);
    }
});

document.getElementById('railway-to-station').addEventListener('input', function(e) {
    const value = e.target.value.toLowerCase();
    if (commonStations[value]) {
        console.log(`Suggestion: ${value} → ${commonStations[value]}`);
    }
});

// Simulate some live transport data for the public transport map
function simulateLiveTransportData() {
    const transportStatusList = document.getElementById('transport-status-list');
    
    if (transportStatusList) {
        const liveData = [
            { route: 'Line 1 (Red)', status: 'Normal', delay: 0, color: '#dc2626' },
            { route: 'Line 2 (Yellow)', status: 'Minor Delays', delay: 5, color: '#eab308' },
            { route: 'Line 3 (Blue)', status: 'Normal', delay: 0, color: '#2563eb' },
            { route: 'Line 6 (Pink)', status: 'Normal', delay: 0, color: '#ec4899' },
            { route: 'Airport Express', status: 'Normal', delay: 0, color: '#059669' }
        ];

        let html = '<h4 class="font-semibold mb-3 text-gray-700">🚇 Delhi Metro Live Status</h4>';
        
        liveData.forEach(line => {
            const statusColor = line.delay > 0 ? 'text-orange-600' : 'text-green-600';
            const statusIcon = line.delay > 0 ? '⚠️' : '✅';
            
            html += `
                <div class="status-item mb-2 p-3 bg-white rounded-lg border">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <div class="status-indicator" style="background-color: ${line.color}"></div>
                            <span class="font-medium text-sm">${line.route}</span>
                        </div>
                        <div class="text-right">
                            <span class="text-xs ${statusColor}">${statusIcon} ${line.status}</span>
                            ${line.delay > 0 ? `<div class="text-xs text-gray-500">${line.delay}min delay</div>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });

        transportStatusList.innerHTML = html;

        // Add some metro station markers to the map
        const metroStations = [
            { name: 'Rajiv Chowk', lat: 28.6328, lng: 77.2197, line: 'Blue/Yellow' },
            { name: 'New Delhi', lat: 28.6431, lng: 77.2197, line: 'Yellow' },
            { name: 'Karol Bagh', lat: 28.6506, lng: 77.1902, line: 'Blue' },
            { name: 'Dwarka Sector 21', lat: 28.5521, lng: 77.0589, line: 'Blue' }
        ];

        metroStations.forEach(station => {
            L.circleMarker([station.lat, station.lng], {
                color: '#2563eb',
                fillColor: '#3b82f6',
                fillOpacity: 0.8,
                radius: 6
            }).addTo(map)
              .bindPopup(`<b>🚇 ${station.name}</b><br>Line: ${station.line}<br>Status: Normal`);
        });
    }
}

// Initialize live transport simulation
setTimeout(simulateLiveTransportData, 1000);

// Update live data every 30 seconds
setInterval(simulateLiveTransportData, 30000);

// Add some safety markers to the safety map
function addSafetyMarkers() {
    const safetyPoints = [
        { 
            lat: 28.6139, 
            lng: 77.2090, 
            type: 'safe', 
            title: 'Well-lit Main Road',
            description: 'Major road with good lighting and regular patrol'
        },
        { 
            lat: 28.6500, 
            lng: 77.2167, 
            type: 'caution', 
            title: 'Dimly lit area',
            description: 'Exercise caution during night hours'
        },
        { 
            lat: 28.6000, 
            lng: 77.2300, 
            type: 'safe', 
            title: 'Police Station Nearby',
            description: 'Safe area with police station within 200m'
        }
    ];

    safetyPoints.forEach(point => {
        const color = point.type === 'safe' ? '#10b981' : point.type === 'caution' ? '#f59e0b' : '#ef4444';
        const icon = point.type === 'safe' ? '🛡️' : point.type === 'caution' ? '⚠️' : '🚨';
        
        L.circleMarker([point.lat, point.lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.7,
            radius: 8
        }).addTo(safetymap)
          .bindPopup(`<b>${icon} ${point.title}</b><br>${point.description}`);
    });
}

// Initialize safety markers
setTimeout(addSafetyMarkers, 1000);

// Add feedback form handling
document.getElementById('feedback-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Show success message
    const form = e.target;
    const formData = new FormData(form);
    
    // Simulate form submission
    setTimeout(() => {
        alert('✅ Thank you for your feedback! Your report has been submitted successfully.');
        form.reset();
    }, 500);
});

// Add some utility functions for better UX
function showLoading(elementId, message = 'Loading...') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="text-center p-4">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p class="text-blue-500 mt-2">${message}</p>
            </div>
        `;
    }
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<p class="text-red-500 text-center p-4">${message}</p>`;
    }
}

function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<p class="text-green-500 text-center p-4">${message}</p>`;
    }
}

// Console welcome message
console.log(`
🌟 EcoCitty Connect - Smart City Services Dashboard
🚀 Frontend loaded successfully!
🎯 Demo Mode: Active
📡 Backend: http://localhost:5000
🔧 Debug: Open Network tab to monitor API calls
`);

// Add helpful keyboard shortcuts info
console.log(`
⌨️  Keyboard Shortcuts:
• Enter in station fields: Search trains
• Escape: Close modals
• Tab: Navigate between fields
`);