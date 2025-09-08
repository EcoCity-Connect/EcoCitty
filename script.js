// Mobile Menu Toggle
document.getElementById('mobile-menu-button').addEventListener('click', () => {
    document.getElementById('mobile-menu').classList.toggle('hidden');
});

// --- Waste Collection Feature ---
const neighborhoodInput = document.getElementById('neighborhood-input');
const searchWasteBtn = document.getElementById('search-waste-btn');
const wasteResultsDiv = document.getElementById('waste-results');

// Empty object (no fake data)
const wasteSchedules = {};

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
