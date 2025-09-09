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
        wasteResultsDiv.innerHTML = `<p class="text-gray-600">Sorry, no schedule available for "${neighborhoodInput.value.trim()}".</p>`;
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

    // Search trains between stations
    async searchTrains(fromStation, toStation) {
        try {
            const response = await fetch(`${this.baseUrl}/api/search-trains?from_station=${fromStation}&to_station=${toStation}`);
            const data = await response.json();
            
            if (data.status && data.trains.length > 0) {
                this.plotTrainRoute(data);
                return data;
            } else {
                console.log('No trains found between stations');
                return null;
            }
        } catch (error) {
            console.error('Error searching trains:', error);
            return null;
        }
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
              .bindPopup(`<b>${from_station_coords.name}</b><br>Source Station<br>Trains: ${trains.length}`);
            
            // Add destination station marker  
            const toMarker = L.marker([to_station_coords.lat, to_station_coords.lng], {
                icon: this.createStationIcon('destination')
            }).addTo(this.map)
              .bindPopup(`<b>${to_station_coords.name}</b><br>Destination Station`);
            
            // Add route line
            const routeLine = L.polyline([
                [from_station_coords.lat, from_station_coords.lng],
                [to_station_coords.lat, to_station_coords.lng]
            ], {
                color: '#2563eb',
                weight: 4,
                opacity: 0.8,
                dashArray: '10, 5'
            }).addTo(this.map);
            
            this.trainMarkers.push(fromMarker, toMarker);
            this.routeLines.push(routeLine);
            
            // Fit map to show route
            const group = L.featureGroup([fromMarker, toMarker]);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    // Get live train status and plot on map
    async getLiveTrainStatus(trainNumber, startDay = 0) {
        try {
            const response = await fetch(`${this.baseUrl}/api/live-train-status/${trainNumber}?start_day=${startDay}`);
            const data = await response.json();
            
            if (data.status && data.data) {
                return data.data;
            }
            return null;
        } catch (error) {
            console.error('Error getting live train status:', error);
            return null;
        }
    }

    // Get live station data and plot
    async getLiveStationData(stationCode, hours = 2) {
        try {
            const response = await fetch(`${this.baseUrl}/api/live-station/${stationCode}?hours=${hours}`);
            const data = await response.json();
            
            if (data.status && data.station_coords) {
                this.plotLiveStation(data);
                return data.station_data;
            }
            return null;
        } catch (error) {
            console.error('Error getting live station data:', error);
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
                Live Trains: ${station_data.length}<br>
                Station Code: ${station_code}
              `);
            
            this.trainMarkers.push(stationMarker);
            this.map.setView([station_coords.lat, station_coords.lng], 12);
        }
    }

    // Create custom icons
    createStationIcon(type) {
        let iconColor;
        
        switch(type) {
            case 'source':
                iconColor = '#22c55e';
                break;
            case 'destination':
                iconColor = '#ef4444';
                break;
            case 'live':
                iconColor = '#3b82f6';
                break;
            default:
                iconColor = '#6b7280';
        }
        
        return L.divIcon({
            html: `<div style="background-color: ${iconColor}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
    }

    createTrainIcon() {
        return L.divIcon({
            html: '<div style="background-color: #dc2626; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">🚂</div>',
            iconSize: [30, 20],
            iconAnchor: [15, 10]
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

    resultsDiv.innerHTML = '<div class="text-center"><p class="text-blue-500">🔍 Searching for trains...</p></div>';

    try {
        const trains = await railwayAPI.searchTrains(fromStation, toStation);
        if (trains && trains.trains.length > 0) {
            displayTrainResults(trains.trains);
        } else {
            resultsDiv.innerHTML = '<p class="text-gray-600">❌ No trains found between these stations. Please check station codes.</p>';
        }
    } catch (error) {
        console.error('Error searching trains:', error);
        resultsDiv.innerHTML = '<p class="text-red-500">❌ Error searching trains. Please try again.</p>';
    }
}

// Display train results
function displayTrainResults(trains) {
    const resultsDiv = document.getElementById('railway-results');
    
    if (trains.length === 0) {
        resultsDiv.innerHTML = '<p class="text-gray-600">No trains found</p>';
        return;
    }

    // Sort trains by train number
    trains.sort((a, b) => a.train_number - b.train_number);

    let html = '';
    trains.slice(0, 10).forEach((train) => { // Show top 10 trains
        html += `
            <div class="train-card" onclick="showTrainLiveStatus('${train.train_number}')">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <div class="font-bold text-blue-600">${train.train_number}</div>
                        <div class="text-sm text-gray-600">${train.train_name || 'N/A'}</div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div class="bg-green-100 p-2 rounded">
                        <strong>Departure</strong><br>
                        ${train.from_station_name || 'N/A'}<br>
                        ${train.departure_time || 'N/A'}
                    </div>
                    <div class="bg-red-100 p-2 rounded">
                        <strong>Arrival</strong><br>
                        ${train.to_station_name || 'N/A'}<br>
                        ${train.arrival_time || 'N/A'}
                    </div>
                </div>
                <div class="text-center mt-2">
                    <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                        🚂 ${train.duration || 'Duration N/A'}
                    </span>
                </div>
            </div>
        `;
    });

    resultsDiv.innerHTML = html;
}

// Show train live status
async function showTrainLiveStatus(trainNumber) {
    try {
        console.log(`Getting live status for train ${trainNumber}`);
        
        // Show modal with loading
        showRailwayModal(trainNumber, 'Loading live status...');
        
        // Get live train status
        const liveStatus = await railwayAPI.getLiveTrainStatus(trainNumber);
        
        if (liveStatus) {
            displayLiveStatusInModal(trainNumber, liveStatus);
        } else {
            showRailwayModal(trainNumber, 'Unable to fetch live status. Train might not be running today.');
        }

    } catch (error) {
        console.error('Error getting train status:', error);
        showRailwayModal(trainNumber, 'Error fetching live status. Please try again.');
    }
}

// Show railway modal
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
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="color: #333; margin: 0;">🚂 Train ${trainNumber} Live Status</h2>
            <button onclick="document.getElementById('railway-modal').remove()" 
                    style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
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
}

// Display live status in modal
function displayLiveStatusInModal(trainNumber, statusData) {
    let content = '';
    
    if (!statusData || !statusData.current_station_name) {
        content = `
            <div style="text-align: center; padding: 20px;">
                <p>❌ No live tracking data available for train ${trainNumber}</p>
                <p>Train might not be running today or tracking is unavailable.</p>
            </div>
        `;
    } else {
        const delay = statusData.delay_minutes ? `${statusData.delay_minutes} mins late` : 'On time';
        const currentStation = statusData.current_station_name || 'Unknown';
        const nextStation = statusData.next_station_name || 'N/A';
        const speed = statusData.current_speed || '0';
        
        content = `
            <div style="space-y: 15px;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <h3 style="color: #667eea; margin-bottom: 10px;">📍 Current Location</h3>
                    <p><strong>Station:</strong> ${currentStation}</p>
                    <p><strong>Status:</strong> <span style="color: ${delay === 'On time' ? '#28a745' : '#dc3545'}; font-weight: bold;">${delay}</span></p>
                </div>
                
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <h3 style="color: #1976d2; margin-bottom: 10px;">🎯 Next Stop</h3>
                    <p><strong>Station:</strong> ${nextStation}</p>
                    <p><strong>Speed:</strong> ${speed} km/h</p>
                </div>
                
                <div style="text-align: center; padding-top: 20px;">
                    <button onclick="refreshTrainStatus('${trainNumber}')" 
                            style="background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                        🔄 Refresh Status
                    </button>
                </div>
            </div>
        `;
    }
    
    document.getElementById('railway-modal-content').innerHTML = content;
}

// Refresh train status
async function refreshTrainStatus(trainNumber) {
    document.getElementById('railway-modal-content').innerHTML = '<div style="text-align: center;">🔄 Refreshing...</div>';
    await showTrainLiveStatus(trainNumber);
}

// Get live station info
async function getLiveStationInfo() {
    const stationCode = document.getElementById('railway-from-station').value.trim().toUpperCase();
    const resultsDiv = document.getElementById('railway-results');
    
    if (!stationCode) {
        resultsDiv.innerHTML = '<p class="text-red-500">Please enter a station code in the "From / Live Station" field</p>';
        return;
    }

    resultsDiv.innerHTML = '<div class="text-center"><p class="text-blue-500">📡 Getting live station data...</p></div>';

    try {
        const stationData = await railwayAPI.getLiveStationData(stationCode);
        if (stationData && stationData.length > 0) {
            displayLiveStationData(stationData, stationCode);
        } else {
            resultsDiv.innerHTML = '<p class="text-gray-600">❌ No live data found for this station.</p>';
        }
    } catch (error) {
        console.error('Error getting station data:', error);
        resultsDiv.innerHTML = '<p class="text-red-500">❌ Error getting station data. Please try again.</p>';
    }
}

// Display live station data
function displayLiveStationData(stationData, stationCode) {
    const resultsDiv = document.getElementById('railway-results');
    
    let html = `<h3 class="font-bold text-lg mb-3">📡 Live Trains at ${stationCode}</h3>`;
    
    stationData.slice(0, 15).forEach((train) => {
        const status = train.delay_minutes ? `Delayed by ${train.delay_minutes} min` : 'On Time';
        const statusClass = train.delay_minutes ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
        
        html += `
            <div class="train-card" onclick="showTrainLiveStatus('${train.train_number}')">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <div class="font-bold text-blue-600">${train.train_number}</div>
                        <div class="text-sm text-gray-600">${train.train_name || 'N/A'}</div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div class="bg-gray-100 p-2 rounded">
                        <strong>From</strong><br>
                        ${train.source_station_name || 'N/A'}<br>
                        Sch: ${train.scheduled_arrival_time || 'N/A'}
                    </div>
                    <div class="bg-blue-100 p-2 rounded">
                        <strong>To</strong><br>
                        ${train.destination_station_name || 'N/A'}<br>
                        Exp: ${train.expected_arrival_time || 'N/A'}
                    </div>
                </div>
                <div class="text-center mt-2">
                    <span class="px-2 py-1 rounded-full text-xs ${statusClass}">
                        ${status}
                    </span>
                </div>
            </div>
        `;
    });

    resultsDiv.innerHTML = html;
}

// Set station codes in input fields
function setStations(from, to) {
    document.getElementById('railway-from-station').value = from;
    document.getElementById('railway-to-station').value = to;
}

// Allow Enter key to trigger search
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement.id === 'railway-from-station' || activeElement.id === 'railway-to-station') {
            searchRailwayTrains();
        }
    }
});

