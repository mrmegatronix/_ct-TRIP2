// API Configuration
const API_KEY = '5vgJIJQTkmeJXN7h2n9drK0UuqrSoWOW';
const RELEVANT_ROUTES = ['1', '95', '125'];

// Venue Location
const venueCoords = [-43.47813787786105, 172.61740700674628];

// Map Initialization
const map = L.map('map', {
    center: venueCoords,
    zoom: 17,
    zoomControl: false // Disable zoom control for cleaner dashboard look
});

// Add Dark Theme Map Tiles (CartoDB Dark Matter)
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

// Venue Marker using Coasters Logo
const venueIcon = L.icon({
    iconUrl: 'logo.png',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    className: 'venue-logo'
});

L.marker(venueCoords, { icon: venueIcon, zIndexOffset: 1000 }).addTo(map)
    .bindPopup('<b>Coasters Tavern</b><br>1 Daniels Road');

// Bus Stop Definitions
const stops = {
    north: { name: 'North (Main North Rd)', coords: [-43.4755, 172.6171], id: '13347' },
    south: { name: 'South (Main North Rd)', coords: [-43.4795, 172.6162], id: '15319' },
    east:  { name: 'East (Daniels Rd)', coords: [-43.4782, 172.6188], id: '29195' },
    west:  { name: 'West (Daniels Rd)', coords: [-43.4781, 172.6160], id: '29900' }
};

const stopIcon = L.divIcon({
    className: 'stop-icon',
    html: '🚌',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

const popups = {};
const stopMarkers = {};
const walkingPaths = {};

// Add Bus Stops, Popups, and Walking Lines
for (const [key, stop] of Object.entries(stops)) {
    const marker = L.marker(stop.coords, { icon: stopIcon }).addTo(map);
    stopMarkers[key] = marker;
    
    // Create an empty popup with specific styling
    const popup = L.popup({
        autoClose: false,
        closeOnClick: false,
        className: 'custom-popup'
    })
    .setLatLng(stop.coords)
    .setContent(`<div class="eta-card" id="card-${key}"><h3>${stop.name}</h3><div style="text-align:center; padding:10px;">Loading ETAs...</div></div>`);
    
    marker.bindPopup(popup);
    popups[key] = popup;
    
    // Calculate Walking Distance and ETA
    const stopLatLng = L.latLng(stop.coords);
    const venueLatLng = L.latLng(venueCoords);
    const dist = Math.round(venueLatLng.distanceTo(stopLatLng));
    const walkingTime = Math.ceil(dist / 84); // ~1.4 m/s average walking speed
    
    // Draw Red Walking Line
    const walkLine = L.polyline([venueCoords, stop.coords], {
        color: '#ff4d4d',
        weight: 3,
        dashArray: '5, 10',
        opacity: 0 // Hidden initially
    }).addTo(map);
    
    walkLine.bindTooltip(`Walk: ${dist}m (${walkingTime} min)`, {
        permanent: true,
        className: 'walking-tooltip',
        direction: 'center'
    });
    
    walkingPaths[key] = walkLine;
}

// Draw Bus Routes with Directional Arrows
const mainNorthRoute = [
    [-43.4680, 172.6176], [-43.4755, 172.617096], [-43.476456, 172.61702],
    [-43.47741, 172.616942], [-43.477471, 172.616937], [-43.477768, 172.616913],
    [-43.478174, 172.61688], [-43.478202, 172.616878], [-43.478287, 172.616871],
    [-43.478383, 172.616863], [-43.479117, 172.616804], [-43.479664, 172.616761],
    [-43.4844, 172.6164]
];

const route125Path = [
    [-43.4680, 172.6176], [-43.4755, 172.617096], [-43.476456, 172.61702],
    [-43.47741, 172.616942], [-43.477471, 172.616937], [-43.477768, 172.616913],
    [-43.478174, 172.61688], [-43.478199, 172.616878], [-43.478202, 172.616878],
    [-43.478287, 172.616871], [-43.478292, 172.616984], [-43.478292, 172.617],
    [-43.478308, 172.617393], [-43.478316, 172.617585], [-43.478349, 172.618325],
    [-43.478352, 172.618394], [-43.478369, 172.618786], [-43.4785, 172.6240]
];

// Draw main routes
const mainLine = L.polyline(mainNorthRoute, { color: '#3498db', weight: 5, opacity: 0.2 }).addTo(map); // Blue for Route 1
const route95Path = mainNorthRoute.map(coord => [coord[0], coord[1] - 0.00005]);
const route95Line = L.polyline(route95Path, { color: '#9b59b6', weight: 5, opacity: 0.2 }).addTo(map); // Purple for Route 95
const danielsLine = L.polyline(route125Path, { color: '#2ecc71', weight: 5, opacity: 0.2 }).addTo(map); // Green for Route 125

// Add animated arrows to the routes
L.polylineDecorator(mainLine, { patterns: [{ offset: 0, repeat: 100, symbol: L.Symbol.arrowHead({pixelSize: 15, pathOptions: {fillOpacity: 1, weight: 0, color: '#3498db'}}) }] }).addTo(map);
L.polylineDecorator(route95Line, { patterns: [{ offset: 25, repeat: 100, symbol: L.Symbol.arrowHead({pixelSize: 15, pathOptions: {fillOpacity: 1, weight: 0, color: '#9b59b6'}}) }] }).addTo(map);
L.polylineDecorator(danielsLine, { patterns: [{ offset: 50, repeat: 100, symbol: L.Symbol.arrowHead({pixelSize: 15, pathOptions: {fillOpacity: 1, weight: 0, color: '#2ecc71'}}) }] }).addTo(map);

// Carousel Logic (Rotate active panel every 15 seconds)
const stopKeys = Object.keys(stops);
let currentStopIndex = 0;

function cyclePanels() {
    const activeKey = stopKeys[currentStopIndex];
    
    // Hide all popups and walking lines, dim routes
    for (const key of stopKeys) {
        map.closePopup(popups[key]);
        walkingPaths[key].setStyle({ opacity: 0 });
        walkingPaths[key].closeTooltip();
    }
    
    mainLine.setStyle({ opacity: 0.2, weight: 4 });
    route95Line.setStyle({ opacity: 0.2, weight: 4 });
    danielsLine.setStyle({ opacity: 0.2, weight: 4 });
    
    // Highlight Active Stop
    stopMarkers[activeKey].openPopup();
    walkingPaths[activeKey].setStyle({ opacity: 0.9 });
    walkingPaths[activeKey].openTooltip();
    
    // Highlight Active Route(s)
    if (activeKey === 'north' || activeKey === 'south') {
        mainLine.setStyle({ opacity: 1, weight: 6 });
        route95Line.setStyle({ opacity: 1, weight: 6 });
    } else {
        danielsLine.setStyle({ opacity: 1, weight: 6 });
    }
    
    currentStopIndex = (currentStopIndex + 1) % stopKeys.length;
}

// Client-Side Data Fetching Logic
async function fetchETAs() {
    try {
        const timestamp = Date.now();
        for (const [key, stop] of Object.entries(stops)) {
            const response = await fetch(`https://go.metroinfo.co.nz/mtbp/service/ui/eta/stop/Metro%20Canterbury:${stop.id}/${timestamp}/200?locale=en-gb`, {
                headers: { 'authorization': `ApiKey ${API_KEY}` }
            });
            const data = await response.json();
            
            let allArrivals = [];
            for (const pattern of Object.values(data)) {
                if (Array.isArray(pattern)) {
                    allArrivals = allArrivals.concat(pattern);
                }
            }
            
            // Sort by departure time
            allArrivals.sort((a, b) => new Date(a.realtimeDeparture || a.scheduledDeparture) - new Date(b.realtimeDeparture || b.scheduledDeparture));
            
            // Take next 5
            const upcoming = allArrivals.slice(0, 5);
            
            let html = `<h3>${stop.name} (#${stop.id})</h3>`;
            
            if (upcoming.length > 0) {
                upcoming.forEach(eta => {
                    let routeNum = 'Unknown';
                    if (eta.routeId.includes('1_0854')) routeNum = '1';
                    if (eta.routeId.includes('95_7946')) routeNum = '95';
                    if (eta.routeId.includes('125_6143')) routeNum = '125';
                    
                    const dt = new Date(eta.realtimeDeparture || eta.scheduledDeparture);
                    
                    // Simple relative time parsing
                    const diffMs = dt - new Date();
                    const diffMins = Math.round(diffMs / 60000);
                    let timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    if (diffMins <= 60 && diffMins > 0) {
                        timeStr = `${diffMins} min`;
                    } else if (diffMins <= 0) {
                        timeStr = 'Due';
                    }
                    
                    const routeClass = `route-${routeNum}`;
                    html += `
                    <div class="eta-row">
                        <span class="eta-route ${routeClass}">${routeNum}</span>
                        <span class="eta-dest">${eta.headSign}</span>
                        <span class="eta-time">${timeStr}</span>
                    </div>`;
                });
            } else {
                html += `<div style="text-align:center; padding:10px; font-style:italic;">No upcoming buses found</div>`;
            }
            
            const cardEl = document.getElementById(`card-${key}`);
            if (cardEl) {
                cardEl.innerHTML = html;
            }
        }
    } catch (err) {
        console.error('Error fetching arrivals:', err);
    }
}

// Start polling data
setInterval(fetchETAs, 10000);
setTimeout(fetchETAs, 1000);

// Start Carousel
setInterval(cyclePanels, 15000);
setTimeout(cyclePanels, 1500); // Trigger first cycle slightly after data load

// --- LIVE VEHICLE TRACKING ---
let activePatterns = [];
const busMarkers = {};

function getBusIcon(route) {
    let color = '#45a29e'; // default
    if (route === '1') color = '#3498db'; // Blue
    if (route === '95') color = '#9b59b6'; // Purple
    if (route === '125') color = '#2ecc71'; // Green
    
    return L.divIcon({
        className: 'live-bus-icon',
        html: `<div style="
            background-color: ${color}; 
            width: 24px; 
            height: 24px; 
            border-radius: 50%; 
            border: 2px solid #0b0c10;
            box-shadow: 0 0 10px ${color};
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 11px;
            color: white;
        ">${route}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });
}

async function discoverPatterns() {
    try {
        const res = await fetch('https://go.metroinfo.co.nz/mtbp/service/ui/master-data/en-gb', {
            headers: { 'authorization': `ApiKey ${API_KEY}` }
        });
        const data = await res.json();
        
        const validRouteIds = Object.values(data.routes)
            .filter(r => RELEVANT_ROUTES.includes(r.shortName))
            .map(r => r.id);
            
        activePatterns = Object.values(data.routePatterns)
            .filter(p => validRouteIds.includes(p.routeId))
            .map(p => p.id);
            
        console.log(`Discovered ${activePatterns.length} active patterns for routes 1, 95, 125.`);
    } catch (e) {
        console.error('Failed to discover patterns:', e);
    }
}

async function fetchLiveVehicles() {
    if (activePatterns.length === 0) return;
    
    try {
        let allVehicles = {};
        const fetchPromises = activePatterns.map(patternId => 
            fetch(`https://go.metroinfo.co.nz/mtbp/service/ui/eta/vehicles-on-pattern/${encodeURIComponent(patternId)}`, {
                headers: { 'authorization': `ApiKey ${API_KEY}` }
            })
            .then(r => r.json())
            .catch(e => null)
        );
        
        const results = await Promise.all(fetchPromises);
        
        for (const data of results) {
            if (data && Array.isArray(data)) {
                data.forEach(vehicle => {
                    let routeNum = 'Unknown';
                    if (vehicle.routeId.includes('1_0854')) routeNum = '1';
                    if (vehicle.routeId.includes('95_7946')) routeNum = '95';
                    if (vehicle.routeId.includes('125_6143')) routeNum = '125';
                    
                    allVehicles[vehicle.id] = {
                        id: vehicle.id,
                        label: vehicle.label,
                        lat: vehicle.latitude,
                        lng: vehicle.longitude,
                        route: routeNum,
                        status: vehicle.stopStatus
                    };
                });
            }
        }
        
        const activeIds = new Set(Object.keys(allVehicles));
        
        // Spawn or update vehicles
        for (const [id, data] of Object.entries(allVehicles)) {
            if (busMarkers[id]) {
                // Update existing position
                busMarkers[id].setLatLng([data.lat, data.lng]);
            } else {
                // Spawn new
                const marker = L.marker([data.lat, data.lng], {
                    icon: getBusIcon(data.route),
                    zIndexOffset: 800 // High z-index so they float over routes
                }).addTo(map);
                marker.bindTooltip(`Bus ${data.label} (Route ${data.route})`, { direction: 'top', className: 'bus-tooltip' });
                busMarkers[id] = marker;
            }
        }
        
        // Remove stale vehicles that went offline
        for (const id in busMarkers) {
            if (!activeIds.has(id)) {
                map.removeLayer(busMarkers[id]);
                delete busMarkers[id];
            }
        }
        
    } catch (err) {
        console.error('Error fetching live vehicles:', err);
    }
}

// Initialize live vehicles
async function initVehicleTracking() {
    await discoverPatterns();
    if (activePatterns.length > 0) {
        await fetchLiveVehicles();
        // Poll live vehicles every 5 seconds for smooth movement
        setInterval(fetchLiveVehicles, 5000);
    }
}

initVehicleTracking();
