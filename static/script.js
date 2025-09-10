document.addEventListener('DOMContentLoaded', () => {
    // --- Initializations ---
    initMetroTracker();
    initWasteManagement();
    initSafetyHotspots();
    initCarbonCalculator();
    initFeedbackForm();
});

// --- Metro Live Tracker ---
function initMetroTracker() {
    const metroMap = L.map('metro-map').setView([28.6139, 77.2090], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(metroMap);
    
    fetch('/api/metro-status')
        .then(response => response.json())
        .then(data => {
            const resultsDiv = document.getElementById('metro-results');
            if (data.status) {
                let html = '';
                data.data.forEach(line => {
                    const statusColor = line.status === 'Normal' ? 'text-green-600' : 'text-yellow-600';
                    html += `<div class="p-2 rounded bg-gray-100">
                                <div class="font-bold text-lg" style="color:${line.line.toLowerCase()}">${line.line} Line</div>
                                <div class="text-sm ${statusColor}">${line.status}</div>
                                <p class="text-xs text-gray-500">${line.details}</p>
                             </div>`;
                });
                resultsDiv.innerHTML = html;
            }
        });
}

// --- Waste Management ---
function initWasteManagement() {
    const wasteMap = L.map('waste-map').setView([28.6139, 77.2090], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(wasteMap);

    // --- START: FETCH AND DISPLAY GARBAGE TRUCKS ---
    fetch('/api/garbage-collection')
        .then(response => response.json())
        .then(data => {
            if (data.trucks) {
                const truckIcon = L.icon({
                    iconUrl: 'https://img.icons8.com/ios-filled/50/000000/garbage-truck.png', // A free garbage truck icon
                    iconSize: [30, 30],
                });

                data.trucks.forEach(truck => {
                    L.marker([truck.lat, truck.lon], { icon: truckIcon })
                        .addTo(wasteMap)
                        .bindPopup(`<b>${truck.id}</b><br>Status: ${truck.status}`);
                });
            }
        })
        .catch(error => console.error('Error fetching garbage collection data:', error));
    // --- END: FETCH AND DISPLAY GARBAGE TRUCKS ---

    document.getElementById('waste-report-form').addEventListener('submit', e => {
        e.preventDefault();
        const responseDiv = document.getElementById('waste-response');
        const report = {
            location: document.getElementById('waste-location').value,
            waste_type: document.getElementById('waste-type').value,
            description: document.getElementById('waste-description').value,
        };
        
        fetch('/api/waste-reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(report),
        })
        .then(res => res.json())
        .then(data => {
            responseDiv.innerHTML = `<p class="text-green-500">${data.message}</p>`;
            e.target.reset();
        });
    });
}


// --- Public Safety Hotspots ---
function initSafetyHotspots() {
    const safetyMap = L.map('safety-map').setView([28.6139, 77.2090], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(safetyMap);

    document.getElementById('safety-hotspot-form').addEventListener('submit', e => {
        e.preventDefault();
        const responseDiv = document.getElementById('safety-response');
        const hotspot = {
            location: document.getElementById('safety-location').value,
            issue_type: document.getElementById('safety-issue-type').value,
            description: document.getElementById('safety-description').value,
        };
        
        fetch('/api/safety-hotspots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(hotspot),
        })
        .then(res => res.json())
        .then(data => {
            responseDiv.innerHTML = `<p class="text-green-500">${data.message}</p>`;
            e.target.reset();
        });
    });
}

// --- Carbon Footprint Calculator ---
function initCarbonCalculator() {
    document.getElementById('carbon-calculator-form').addEventListener('submit', e => {
        e.preventDefault();
        const resultDiv = document.getElementById('carbon-result');
        const footprintData = {
            electricity: document.getElementById('carbon-electricity').value,
            gas: document.getElementById('carbon-gas').value,
            transport: document.getElementById('carbon-transport').value,
        };

        fetch('/api/calculate-carbon-footprint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(footprintData),
        })
        .then(res => res.json())
        .then(data => {
            resultDiv.innerHTML = `Your estimated monthly carbon footprint is ${data.carbon_footprint} kg CO2.`;
        });
    });
}

// --- Feedback Form ---
function initFeedbackForm() {
    document.getElementById('feedback-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const responseDiv = document.getElementById('feedback-response');
        const feedbackData = {
            name: document.getElementById('feedback-name').value,
            issue_type: document.getElementById('feedback-issue-type').value,
            description: document.getElementById('feedback-description').value,
        };

        const response = await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(feedbackData),
        });
        const result = await response.json();
        if (response.ok) {
            responseDiv.innerHTML = `<p class="text-green-500">${result.message}</p>`;
            this.reset();
        } else {
            responseDiv.innerHTML = `<p class="text-red-500">${result.error}</p>`;
        }
    });
}