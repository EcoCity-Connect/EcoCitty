document.addEventListener('DOMContentLoaded', () => {
    // --- Mobile Menu Toggle ---
    document.getElementById('mobile-menu-button').addEventListener('click', () => {
        document.getElementById('mobile-menu').classList.toggle('hidden');
    });

    // --- Waste Collection Feature ---
    const neighborhoodInput = document.getElementById('neighborhood-input');
    const searchWasteBtn = document.getElementById('search-waste-btn');
    const wasteResultsDiv = document.getElementById('waste-results');
    const wasteSchedules = { "connaught place": { general: "Daily", recycling: "Friday" }, "karol bagh": { general: "Daily", recycling: "Tuesday" }, "saket": { general: "Daily", recycling: "Wednesday" }, "dwarka": { general: "Daily", recycling: "Thursday" }, "greater kailash": { general: "Daily", recycling: "Monday" }, "vasant kunj": { general: "Daily", recycling: "Friday" }, "patel nagar": { general: "Daily", recycling: "Saturday" }, "civil lines": { general: "Daily", recycling: "Wednesday" }, "mayur vihar": { general: "Daily", recycling: "Thursday" }, "hauz khas": { general: "Daily", recycling: "Tuesday" } };
    
    const neighborhoodPolygons = {
        "connaught place": [[28.635, 77.215], [28.635, 77.225], [28.628, 77.225], [28.628, 77.215]],
        "saket": [[28.528, 77.215], [28.528, 77.225], [28.520, 77.225], [28.520, 77.215]],
        "karol bagh": [[28.655, 77.185], [28.655, 77.195], [28.645, 77.195], [28.645, 77.185]]
    };
    let currentPolygon = null;

    function searchSchedule() {
        if (currentPolygon) {
            wastemap.removeLayer(currentPolygon);
            currentPolygon = null;
        }
        const query = neighborhoodInput.value.trim().toLowerCase();
        if (!query) { 
            wasteResultsDiv.innerHTML = `<p class="text-red-500">Please enter a neighborhood.</p>`; 
            wastemap.setView(delhiCoords, 11);
            return; 
        }
        const schedule = wasteSchedules[query];
        if (schedule) { 
            wasteResultsDiv.innerHTML = `<h3 class="font-bold text-lg">${neighborhoodInput.value.trim()}</h3><p><span class="font-semibold">General Waste:</span> ${schedule.general}</p><p><span class="font-semibold">Recycling:</span> ${schedule.recycling}</p>`; 
        } else { 
            wasteResultsDiv.innerHTML = `<p class="text-gray-600">Sorry, we don't have schedule information for "${neighborhoodInput.value.trim()}".</p>`; 
        }
        if (neighborhoodPolygons[query]) {
            const polygonCoords = neighborhoodPolygons[query];
            currentPolygon = L.polygon(polygonCoords, { color: '#10B981', weight: 3, fillOpacity: 0.5 }).addTo(wastemap);
            wastemap.fitBounds(currentPolygon.getBounds());
        } else {
            wastemap.setView(delhiCoords, 11);
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
        const naturalGas = parseFloat(document.getElementById('natural-gas').value) || 0;
        const carbonResultDiv = document.getElementById('carbon-result');
        
        const electricityFactor = 0.8; // Approx kg CO2e per kWh for India
        const gasFactor = 5.3; // Approx kg CO2e per therm

        const commuteFootprint = (distance * transportFactor * 30) / 1000; // in kg
        const energyFootprint = electricity * electricityFactor; // in kg
        const gasFootprint = naturalGas * gasFactor; // in kg
        const totalFootprint = commuteFootprint + energyFootprint + gasFootprint;
        
        carbonResultDiv.innerHTML = `
            <p class="text-lg">Your estimated monthly footprint is:</p>
            <p class="text-3xl font-bold text-emerald-600">${totalFootprint.toFixed(2)} kg CO₂e</p>
            <div class="mt-2 text-sm text-gray-600">
                <p>Commute: ${commuteFootprint.toFixed(2)} kg | Electricity: ${energyFootprint.toFixed(2)} kg | Natural Gas: ${gasFootprint.toFixed(2)} kg</p>
            </div>`;
    });
    
    // --- Air Quality (AQI) ---
    const aqiStations = [
        { name: "Anand Vihar" }, { name: "Ashok Vihar" }, { name: "Aya Nagar" }, { name: "Bawana" }, { name: "Burari Crossing" }, { name: "CRRI Mathura Road" }, { name: "DTU" }, { name: "Dwarka-Sector 8" }, { name: "IGI Airport (T3)" }, { name: "ITO" }, { name: "Jahangirpuri" }, { name: "Jawaharlal Nehru Stadium" }, { name: "Lodhi Road" }, { name: "Major Dhyan Chand National Stadium" }, { name: "Mandir Marg" }, { name: "Mundka" }, { name: "Najafgarh" }, { name: "Narela" }, { name: "Nehru Nagar" }, { name: "Okhla Phase-2" }, { name: "Patparganj" }, { name: "Punjabi Bagh" }, { name: "Pusa" }, { name: "R K Puram" }, { name: "Rohini" }, { name: "Siri Fort" }
    ];
    aqiStations.forEach(station => {
        station.aqi = Math.floor(Math.random() * (100 - 60 + 1)) + 60;
    });
    const aqiSelector = document.getElementById('aqi-station-selector');
    const selectedIndicator = document.getElementById('selected-aqi-indicator');
    const selectedAdvice = document.getElementById('selected-aqi-advice');
    function updateStationAQI(stationIndex) {
        const station = aqiStations[stationIndex];
        const aqiValue = station.aqi;
        let level, color, advice;
        if (aqiValue <= 100) { level = 'Moderate'; color = 'bg-yellow-400'; advice = 'Sensitive individuals should consider limiting prolonged outdoor exertion.'; } 
        selectedIndicator.className = `text-white text-center p-4 rounded-lg mb-4 ${color}`;
        selectedIndicator.innerHTML = `<p class="text-5xl font-bold">${aqiValue}</p><p class="font-semibold mt-1">${level}</p>`;
        selectedAdvice.innerHTML = `<p>${advice}</p>`;
    }
    aqiStations.forEach((station, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = station.name;
        aqiSelector.appendChild(option);
    });
    aqiSelector.addEventListener('change', (e) => updateStationAQI(e.target.value));
    
    // --- STATIC Disaster & Emergency Alerts ---
    function setStaticAlert() {
        const alertContent = document.getElementById('alert-content');
        const alert = { 
            title: 'FLOOD WATCH IN EFFECT', 
            message: 'The Yamuna River water level is rising. Residents in low-lying areas near the river should prepare for potential evacuation.'
        };
        const bgColor = 'bg-yellow-100';
        const borderColor = 'border-yellow-500';
        const textColor = 'text-yellow-800';
        alertContent.innerHTML = `
            <div class="${bgColor} border-l-4 ${borderColor} ${textColor} p-4 rounded-r-lg" role="alert">
                <p class="font-bold">${alert.title}</p>
                <p>${alert.message}</p>
            </div>`;
    }

    // --- Leaflet Maps ---
    const delhiCoords = [28.6139, 77.2090];
    const ncrBounds = [[28.4, 76.8], [28.9, 77.4]];

    var map = L.map('map', { minZoom: 10, maxBounds: ncrBounds }).setView(delhiCoords, 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
    
    var safetymap = L.map('safetymap', { minZoom: 10, maxBounds: ncrBounds }).setView(delhiCoords, 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '© CARTO', maxZoom: 20 }).addTo(safetymap);

    var wastemap = L.map('wastemap', { minZoom: 10, maxBounds: ncrBounds }).setView(delhiCoords, 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(wastemap);

    // --- Transport Simulation ---
    const createMetroIcon = (color) => L.divIcon({
        className: 'metro-icon',
        html: `<div style="background-color: ${color};" class="w-4 h-4 rounded-full border-2 border-white shadow-lg"></div>`,
        iconSize: [16, 16]
    });
    const stationIcon = L.divIcon({className: 'station-icon', html: '<div class="w-2 h-2 bg-gray-800 border border-white rounded-full"></div>', iconSize: [8, 8]});
    const statusList = document.getElementById('transport-status-list');
    statusList.innerHTML = '';
    const routes = [
        { name: "Red Line", color: "#d1282f", path: [ {name:"Rithala", coords:[28.7185, 77.1065]}, {name:"Rohini West", coords:[28.7128, 77.1166]}, {name:"Rohini East", coords:[28.7063, 77.1259]}, {name:"Pitampura", coords:[28.698, 77.1415]}, {name:"Kohat Enclave", coords:[28.6963, 77.1481]}, {name:"Netaji Subhash Place", coords:[28.6963, 77.1558]}, {name:"Keshav Puram", coords:[28.6896, 77.1611]}, {name:"Kanhaiya Nagar", coords:[28.6833, 77.1658]}, {name:"Inderlok", coords:[28.675, 77.1664]}, {name:"Shastri Nagar", coords:[28.6738, 77.1793]}, {name:"Pratap Nagar", coords:[28.6723, 77.1911]}, {name:"Pul Bangash", coords:[28.6698, 77.2023]}, {name:"Tis Hazari", coords:[28.6677, 77.2133]}, {name:"Kashmere Gate", coords:[28.6673, 77.2291]}, {name:"Shastri Park", coords:[28.6752, 77.2492]}, {name:"Seelampur", coords:[28.6735, 77.2625]}, {name:"Welcome", coords:[28.6725, 77.2768]}, {name:"Shahdara", coords:[28.6702, 77.2917]}, {name:"Mansarovar Park", coords:[28.6708, 77.3032]}, {name:"Jhilmil", coords:[28.6713, 77.3146]}, {name:"Dilshad Garden", coords:[28.6797, 77.3223]}, {name:"Shaheed Nagar", coords:[28.6703, 77.3412]}, {name:"Raj Bagh", coords:[28.6653, 77.3517]}, {name:"Major Mohit Sharma", coords:[28.6588, 77.363]}, {name:"Shyam Park", coords:[28.6528, 77.3732]}, {name:"Mohan Nagar", coords:[28.647, 77.3853]}, {name:"Arthala", coords:[28.642, 77.3973]}, {name:"Hindon River", coords:[28.632, 77.408]}, {name:"Shaheed Sthal", coords:[28.627, 77.415]}] },
        { name: "Yellow Line", color: "#ffd700", path: [ {name:"Samaypur Badli", coords:[28.7495, 77.1534]}, {name:"Rohini Sector 18, 19", coords:[28.7393, 77.155]}, {name:"Haiderpur Badli Mor", coords:[28.7297, 77.1583]}, {name:"Jahangirpuri", coords:[28.7247, 77.1643]}, {name:"Adarsh Nagar", coords:[28.7143, 77.1712]}, {name:"Azadpur", coords:[28.7042, 77.18]}, {name:"Model Town", coords:[28.6975, 77.1943]}, {name:"GTB Nagar", coords:[28.6953, 77.2057]}, {name:"Vishwavidyalaya", coords:[28.6917, 77.2128]}, {name:"Vidhan Sabha", coords:[28.6803, 77.2205]}, {name:"Civil Lines", coords:[28.6735, 77.2235]}, {name:"Kashmere Gate", coords:[28.6673, 77.2291]}, {name:"Chandni Chowk", coords:[28.6582, 77.2292]}, {name:"Chawri Bazar", coords:[28.6492, 77.2282]}, {name:"New Delhi", coords:[28.642, 77.2215]}, {name:"Rajiv Chowk", coords:[28.6328, 77.2166]}, {name:"Patel Chowk", coords:[28.6258, 77.213]}, {name:"Central Secretariat", coords:[28.6147, 77.2115]}, {name:"Udyog Bhawan", coords:[28.612, 77.2162]}, {name:"Lok Kalyan Marg", coords:[28.5997, 77.2165]}, {name:"Jor Bagh", coords:[28.587, 77.2173]}, {name:"Dilli Haat - INA", coords:[28.575, 77.219]}, {name:"AIIMS", coords:[28.566, 77.2078]}, {name:"Green Park", coords:[28.557, 77.2065]}, {name:"Hauz Khas", coords:[28.5443, 77.2058]}, {name:"Malviya Nagar", coords:[28.535, 77.2118]}, {name:"Saket", coords:[28.525, 77.2195]}, {name:"Qutab Minar", coords:[28.514, 77.185]}, {name:"Chhatarpur", coords:[28.502, 77.162]}, {name:"Sultanpur", coords:[28.494, 77.15]}, {name:"Ghitorni", coords:[28.486, 77.138]}, {name:"Arjan Garh", coords:[28.475, 77.122]}, {name:"Guru Dronacharya", coords:[28.47, 77.102]}, {name:"Sikandarpur", coords:[28.468, 77.089]}, {name:"MG Road", coords:[28.465, 77.081]}, {name:"IFFCO Chowk", coords:[28.462, 77.072]}, {name:"HUDA City Centre", coords:[28.4595, 77.0722]}] },
        { name: "Blue Line", color: "#3f83f8", path: [ {name:"Dwarka Sector 21", coords:[28.552, 77.062]}, {name:"Dwarka Sector 8", coords:[28.5707, 77.0722]}, {name:"Dwarka Sector 9", coords:[28.579, 77.0715]}, {name:"Dwarka Sector 10", coords:[28.587, 77.0705]}, {name:"Dwarka Sector 11", coords:[28.595, 77.07]}, {name:"Dwarka Sector 12", coords:[28.604, 77.069]}, {name:"Dwarka Sector 13", coords:[28.612, 77.068]}, {name:"Dwarka Sector 14", coords:[28.62, 77.067]}, {name:"Dwarka", coords:[28.619, 77.054]}, {name:"Dwarka Mor", coords:[28.618, 77.043]}, {name:"Nawada", coords:[28.619, 77.035]}, {name:"Uttam Nagar West", coords:[28.622, 77.025]}, {name:"Uttam Nagar East", coords:[28.625, 77.015]}, {name:"Janakpuri West", coords:[28.628, 77.081]}, {name:"Janakpuri East", coords:[28.631, 77.095]}, {name:"Tilak Nagar", coords:[28.635, 77.105]}, {name:"Subhash Nagar", coords:[28.639, 77.115]}, {name:"Tagore Garden", coords:[28.642, 77.12]}, {name:"Rajouri Garden", coords:[28.645, 77.123]}, {name:"Ramesh Nagar", coords:[28.646, 77.133]}, {name:"Moti Nagar", coords:[28.647, 77.143]}, {name:"Kirti Nagar", coords:[28.65, 77.153]}, {name:"Shadipur", coords:[28.652, 77.163]}, {name:"Patel Nagar", coords:[28.653, 77.173]}, {name:"Rajendra Place", coords:[28.645, 77.183]}, {name:"Karol Bagh", coords:[28.6479, 77.1932]}, {name:"Jhandewalan", coords:[28.642, 77.203]}, {name:"R K Ashram Marg", coords:[28.637, 77.21]}, {name:"Rajiv Chowk", coords:[28.6328, 77.2166]}, {name:"Barakhamba Road", coords:[28.628, 77.225]}, {name:"Mandi House", coords:[28.6264, 77.2344]}, {name:"Supreme Court", coords:[28.62, 77.243]}, {name:"Indraprastha", coords:[28.631, 77.252]}, {name:"Yamuna Bank", coords:[28.627, 77.27]}, {name:"Akshardham", coords:[28.618, 77.278]}, {name:"Mayur Vihar-I", coords:[28.6095, 77.2895]}, {name:"Mayur Vihar Ext", coords:[28.602, 77.295]}, {name:"New Ashok Nagar", coords:[28.594, 77.303]}, {name:"Noida Sector 15", coords:[28.587, 77.31]}, {name:"Noida Sector 16", coords:[28.58, 77.317]}, {name:"Noida Sector 18", coords:[28.572, 77.325]}, {name:"Botanical Garden", coords:[28.565, 77.333]}, {name:"Golf Course", coords:[28.558, 77.345]}, {name:"Noida City Centre", coords:[28.57, 77.355]}, {name:"Noida Sector 34", coords:[28.58, 77.36]}, {name:"Noida Sector 52", coords:[28.59, 77.365]}, {name:"Noida Sector 61", coords:[28.6, 77.37]}, {name:"Noida Sector 59", coords:[28.61, 77.372]}, {name:"Noida Sector 62", coords:[28.615, 77.373]}, {name:"Noida Electronic City", coords:[28.62, 77.3731]}] },
        { name: "Green Line", color: "#55a630", path: [ {name:"Inderlok", coords:[28.675, 77.1664]}, {name:"Ashok Park Main", coords:[28.671, 77.148]}, {name:"Punjabi Bagh", coords:[28.67, 77.135]}, {name:"Shivaji Park", coords:[28.669, 77.125]}, {name:"Madipur", coords:[28.672, 77.115]}, {name:"Paschim Vihar East", coords:[28.675, 77.105]}, {name:"Paschim Vihar West", coords:[28.675, 77.085]}, {name:"Peera Garhi", coords:[28.67, 77.07]}, {name:"Udyog Nagar", coords:[28.665, 77.06]}, {name:"Surajmal Stadium", coords:[28.655, 77.05]}, {name:"Nangloi", coords:[28.65, 77.04]}, {name:"Nangloi Railway Station", coords:[28.645, 77.03]}, {name:"Rajdhani Park", coords:[28.64, 77.02]}, {name:"Mundka", coords:[28.635, 77.01]}, {name:"Mundka Industrial Area", coords:[28.63, 76.995]}, {name:"Ghevra", coords:[28.628, 76.98]}, {name:"Tikri Kalan", coords:[28.626, 76.965]}, {name:"Tikri Border", coords:[28.625, 76.958]}, {name:"Pandit Shree Ram Sharma", coords:[28.625, 76.955]}, {name:"Bahadurgarh City", coords:[28.625, 76.954]}, {name:"Brig. Hoshiar Singh", coords:[28.625, 76.953]}] },
        { name: "Violet Line", color: "#800080", path: [ {name:"Kashmere Gate", coords:[28.6673, 77.2291]}, {name:"Lal Quila", coords:[28.656, 77.239]}, {name:"Jama Masjid", coords:[28.647, 77.234]}, {name:"Delhi Gate", coords:[28.64, 77.237]}, {name:"ITO", coords:[28.632, 77.241]}, {name:"Mandi House", coords:[28.6264, 77.2344]}, {name:"Janpath", coords:[28.62, 77.22]}, {name:"Central Secretariat", coords:[28.6147, 77.2115]}, {name:"Khan Market", coords:[28.605, 77.227]}, {name:"Jawaharlal Nehru Stadium", coords:[28.583, 77.234]}, {name:"Jangpura", coords:[28.575, 77.24]}, {name:"Lajpat Nagar", coords:[28.568, 77.242]}, {name:"Moolchand", coords:[28.56, 77.235]}, {name:"Kailash Colony", coords:[28.555, 77.243]}, {name:"Nehru Place", coords:[28.547, 77.251]}, {name:"Kalkaji Mandir", coords:[28.551, 77.258]}, {name:"Govind Puri", coords:[28.54, 77.265]}, {name:"Harkesh Nagar Okhla", coords:[28.53, 77.27]}, {name:"Jasola Apollo", coords:[28.525, 77.28]}, {name:"Sarita Vihar", coords:[28.518, 77.29]}, {name:"Mohan Estate", coords:[28.51, 77.3]}, {name:"Tughlakabad Station", coords:[28.50, 77.305]}, {name:"Badarpur Border", coords:[28.49, 77.308]}, {name:"Sarai", coords:[28.47, 77.31]}, {name:"NHPC Chowk", coords:[28.455, 77.312]}, {name:"Mewla Maharajpur", coords:[28.44, 77.314]}, {name:"Sector 28", coords:[28.425, 77.316]}, {name:"Badkhal Mor", coords:[28.415, 77.317]}, {name:"Faridabad", coords:[28.408, 77.318]}, {name:"Neelam Chowk Ajronda", coords:[28.395, 77.3185]}, {name:"Bata Chowk", coords:[28.385, 77.3188]}, {name:"Escorts Mujesar", coords:[28.378, 77.319]}, {name:"Sant Surdas", coords:[28.376, 77.319]}, {name:"Raja Nahar Singh", coords:[28.374, 77.319]}] },
        { name: "Pink Line", color: "#e55a8a", path: [ {name:"Majlis Park", coords:[28.718, 77.168]}, {name:"Azadpur", coords:[28.7042, 77.18]}, {name:"Shalimar Bagh", coords:[28.705, 77.15]}, {name:"Netaji Subhash Place", coords:[28.6963, 77.1558]}, {name:"Shakurpur", coords:[28.685, 77.145]}, {name:"Punjabi Bagh West", coords:[28.67, 77.13]}, {name:"ESI - Basaidarapur", coords:[28.65, 77.13]}, {name:"Rajouri Garden", coords:[28.645, 77.123]}, {name:"Mayapuri", coords:[28.63, 77.12]}, {name:"Naraina Vihar", coords:[28.615, 77.14]}, {name:"Delhi Cantt", coords:[28.6, 77.15]}, {name:"Durgabai Deshmukh South Campus", coords:[28.58, 77.165]}, {name:"Sir M. Vishweshwaraiah Moti Bagh", coords:[28.57, 77.175]}, {name:"Bhikaji Cama Place", coords:[28.56, 77.185]}, {name:"Sarojini Nagar", coords:[28.57, 77.2]}, {name:"Dilli Haat - INA", coords:[28.575, 77.219]}, {name:"South Extension", coords:[28.568, 77.22]}, {name:"Lajpat Nagar", coords:[28.568, 77.242]}, {name:"Vinobapuri", coords:[28.56, 77.25]}, {name:"Ashram", coords:[28.575, 77.26]}, {name:"Sarai Kale Khan - Nizamuddin", coords:[28.59, 77.26]}, {name:"Mayur Vihar-I", coords:[28.6095, 77.2895]}, {name:"Mayur Vihar Pocket I", coords:[28.615, 77.29]}, {name:"Trilokpuri Sanjay Lake", coords:[28.62, 77.3]}, {name:"East Vinod Nagar - Mayur Vihar-II", coords:[28.625, 77.305]}, {name:"Mandawali - West Vinod Nagar", coords:[28.63, 77.31]}, {name:"IP Extension", coords:[28.635, 77.312]}, {name:"Anand Vihar", coords:[28.647, 77.315]}, {name:"Karkarduma", coords:[28.65, 77.305]}, {name:"Karkarduma Court", coords:[28.655, 77.295]}, {name:"Krishna Nagar", coords:[28.66, 77.285]}, {name:"East Azad Nagar", coords:[28.665, 77.275]}, {name:"Welcome", coords:[28.6725, 77.2768]}, {name:"Jaffrabad", coords:[28.68, 77.27]}, {name:"Maujpur - Babarpur", coords:[28.688, 77.265]}, {name:"Gokulpuri", coords:[28.7, 77.27]}, {name:"Johri Enclave", coords:[28.71, 77.28]}, {name:"Shiv Vihar", coords:[28.715, 77.311]}] },
        { name: "Magenta Line", color: "#e6007e", path: [ {name:"Janakpuri West", coords:[28.628, 77.081]}, {name:"Dabri Mor - Janakpuri South", coords:[28.61, 77.082]}, {name:"Dashrath Puri", coords:[28.605, 77.083]}, {name:"Palam", coords:[28.59, 77.095]}, {name:"Sadar Bazar Cantonment", coords:[28.58, 77.11]}, {name:"Terminal 1 - IGI Airport", coords:[28.56, 77.12]}, {name:"Shankar Vihar", coords:[28.55, 77.14]}, {name:"Vasant Vihar", coords:[28.558, 77.16]}, {name:"Munirka", coords:[28.55, 77.17]}, {name:"R.K. Puram", coords:[28.56, 77.187]}, {name:"IIT Delhi", coords:[28.545, 77.193]}, {name:"Hauz Khas", coords:[28.5443, 77.2058]}, {name:"Panchsheel Park", coords:[28.538, 77.218]}, {name:"Chirag Delhi", coords:[28.535, 77.23]}, {name:"Greater Kailash", coords:[28.54, 77.24]}, {name:"Nehru Enclave", coords:[28.545, 77.25]}, {name:"Kalkaji Mandir", coords:[28.551, 77.258]}, {name:"Okhla NSIC", coords:[28.548, 77.268]}, {name:"Sukhdev Vihar", coords:[28.55, 77.28]}, {name:"Jamia Millia Islamia", coords:[28.56, 77.285]}, {name:"Okhla Vihar", coords:[28.565, 77.295]}, {name:"Jasola Vihar Shaheen Bagh", coords:[28.56, 77.305]}, {name:"Kalindi Kunj", coords:[28.55, 77.315]}, {name:"Okhla Bird Sanctuary", coords:[28.558, 77.325]}, {name:"Botanical Garden", coords:[28.565, 77.333]}] },
        { name: "Airport Express", color: "#f58025", path: [ {name:"New Delhi", coords:[28.642, 77.2215]}, {name:"Shivaji Stadium", coords:[28.629, 77.214]}, {name:"Dhaula Kuan", coords:[28.592, 77.173]}, {name:"Delhi Aerocity", coords:[28.568, 77.13]}, {name:"IGI Airport", coords:[28.558, 77.121]}, {name:"Dwarka Sector 21", coords:[28.552, 77.062]}, {name:"Yashobhoomi Dwarka", coords:[28.549, 77.054]}] }
    ];

    routes.forEach((route, index) => {
        route.icon = createMetroIcon(route.color);
        
        route.path.forEach(station => { 
            L.marker(station.coords, {icon: stationIcon}).addTo(map).bindPopup(station.name); 
        });

        for (let i = 0; i < route.path.length - 1; i++) {
            const start = route.path[i].coords;
            const end = route.path[i+1].coords;
            L.polyline([start, end], { color: route.color, weight: 3, opacity: 0.7 }).addTo(map);
        }
        
        let marker = L.marker(route.path[0].coords, { icon: route.icon }).addTo(map);
        let statusDiv = document.createElement('div');
        statusDiv.className = 'p-2 bg-white rounded-md shadow-sm';
        statusList.appendChild(statusDiv);
        
        let animationState = {
            currentSegmentIndex: Math.floor(Math.random() * (route.path.length - 1)),
            progressInSegment: Math.random(),
            state: 'stopped',
            stopTimer: index * 20 
        };
        
        setInterval(() => {
            if (animationState.state === 'stopped') {
                animationState.stopTimer--;
                if (animationState.stopTimer <= 0) {
                    animationState.state = 'moving';
                }
                return;
            }

            if (animationState.state === 'moving') {
                animationState.progressInSegment += 0.005;

                const startPoint = route.path[animationState.currentSegmentIndex].coords;
                const endPoint = route.path[animationState.currentSegmentIndex + 1].coords;
                
                const lat = startPoint[0] + (endPoint[0] - startPoint[0]) * animationState.progressInSegment;
                const lng = startPoint[1] + (endPoint[1] - startPoint[1]) * animationState.progressInSegment;
                marker.setLatLng([lat, lng]);

                const approachingStation = route.path[animationState.currentSegmentIndex + 1].name;
                const statusText = `On Time | Approaching ${approachingStation}`;
                marker.bindPopup(`<b>${route.name}</b><br>${statusText}`);
                statusDiv.innerHTML = `<div class="flex items-center"><div class="w-3 h-3 rounded-full mr-2" style="background-color: ${route.color}"></div><div><p class="font-bold">${route.name}</p><p class="text-sm text-gray-600">${statusText}</p></div></div>`;

                if (animationState.progressInSegment >= 1.0) {
                    const reachedStationName = route.path[animationState.currentSegmentIndex + 1].name;
                    
                    animationState.state = 'stopped';
                    animationState.stopTimer = 200;
                    animationState.progressInSegment = 0;
                    animationState.currentSegmentIndex = (animationState.currentSegmentIndex + 1) % (route.path.length - 1);
                    
                    const reachedStatusText = `Reached ${reachedStationName}`;
                    marker.setLatLng(route.path[animationState.currentSegmentIndex].coords);
                    marker.bindPopup(`<b>${route.name}</b><br>${reachedStatusText}`);
                    statusDiv.innerHTML = `<div class="flex items-center"><div class="w-3 h-3 rounded-full mr-2" style="background-color: ${route.color}"></div><div><p class="font-bold">${route.name}</p><p class="text-sm text-gray-600 font-semibold">${reachedStatusText}</p></div></div>`;
                }
            }
        }, 50);
    });

    // --- Green and Safe Spaces ---
    const parkIcon = L.divIcon({ className: 'park-icon', html: '<div class="bg-green-500 w-3 h-3 rounded-full border-2 border-white"></div>', iconSize: [12, 12] });
    const greenSpaces = [
        { name: "Lodhi Garden", coords: [28.5926, 77.2196] },
        { name: "Nehru Park", coords: [28.5880, 77.1970] },
        { name: "Garden of Five Senses", coords: [28.5135, 77.1985] },
        { name: "Sunder Nursery", coords: [28.6017, 77.2438] },
        { name: "Deer Park", coords: [28.555, 77.205] },
        { name: "Sanjay Van", coords: [28.528, 77.185] },
        { name: "Aravalli Biodiversity Park", coords: [28.485, 77.065] }
    ];
    greenSpaces.forEach(space => { L.marker(space.coords, { icon: parkIcon }).addTo(safetymap).bindPopup(`<b>${space.name}</b><br>Green Space`); });
    
    const safeRoutes = [ 
        { name: "Lodhi Garden Loop", path: [[28.5926, 77.2196], [28.5950, 77.2230], [28.5910, 77.2250], [28.5890, 77.2210], [28.5926, 77.2196]] }, 
        { name: "India Gate - Kartavya Path", path: [[28.6129, 77.2295], [28.6129, 77.2185]] }, 
        { name: "Hauz Khas Village Lakeside", path: [[28.5539, 77.1944], [28.5515, 77.1953]] }, 
        { name: "Nehru Park Path", path: [[28.5869, 77.1996], [28.5900, 77.1950]]},
        { name: "Shanti Path", path: [[28.598, 77.193], [28.588, 77.185]]},
        { name: "Sanjay Lake Track", path: [[28.615, 77.300], [28.618, 77.305], [28.614, 77.308], [28.612, 77.302], [28.615, 77.300]]}
    ];
    safeRoutes.forEach(route => { L.polyline(route.path, { color: '#10B981', weight: 5, opacity: 0.9 }).addTo(safetymap).bindPopup(route.name); });

    // --- Waste Report Form Submission ---
    const wasteReportForm = document.getElementById('waste-report-form');
    wasteReportForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const wasteResponseDiv = document.getElementById('waste-response');
        const formData = {
            location: document.getElementById('waste-location').value,
            waste_type: document.getElementById('waste-type').value,
            description: document.getElementById('waste-description').value
        };

        fetch('/api/waste-reports', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        })
        .then(response => response.json())
        .then(data => {
            wasteResponseDiv.innerHTML = `<p class="text-green-500">${data.message}</p>`;
            wasteReportForm.reset();
        })
        .catch((error) => {
            wasteResponseDiv.innerHTML = `<p class="text-red-500">An error occurred: ${error}</p>`;
        });
    });

    // --- Safety Hotspot Form Submission ---
    const safetyHotspotForm = document.getElementById('safety-hotspot-form');
    safetyHotspotForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const safetyResponseDiv = document.getElementById('safety-response');
        const formData = {
            location: document.getElementById('safety-location').value,
            issue_type: document.getElementById('safety-issue-type').value,
            description: document.getElementById('safety-description').value
        };

        fetch('/api/safety-hotspots', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        })
        .then(response => response.json())
        .then(data => {
            safetyResponseDiv.innerHTML = `<p class="text-green-500">${data.message}</p>`;
            safetyHotspotForm.reset();
        })
        .catch((error) => {
            safetyResponseDiv.innerHTML = `<p class="text-red-500">An error occurred: ${error}</p>`;
        });
    });
    
    // --- Initialize all data on load ---
    updateStationAQI(0);
    setStaticAlert();
    setInterval(() => updateStationAQI(aqiSelector.value), 15000);
});

const feedbackForm = document.getElementById('feedback-form');
if (feedbackForm) {
    feedbackForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const feedbackResponseDiv = document.getElementById('feedback-response');
        const formData = {
            name: document.getElementById('feedback-name').value,
            issue_type: document.getElementById('feedback-issue-type').value,
            description: document.getElementById('feedback-description').value
        };

        fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                feedbackResponseDiv.innerHTML = `<p class="text-green-500">${data.message}</p>`;
                feedbackForm.reset();
            } else {
                feedbackResponseDiv.innerHTML = `<p class="text-red-500">${data.error || 'An unknown error occurred.'}</p>`;
            }
        })
        .catch((error) => {
            feedbackResponseDiv.innerHTML = `<p class="text-red-500">An error occurred: ${error}</p>`;
        });
    });
}