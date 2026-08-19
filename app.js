// API Configuration
const API_KEY = '5vgJIJQTkmeJXN7h2n9drK0UuqrSoWOW';
const RELEVANT_ROUTES = ['1', '95', '125'];

// Venue Location
const venueCoords = [-43.47813787786105, 172.61740700674628];

// Map Initialization - Dashboard Mode (No interactions, locked view)
const map = L.map('map', {
    center: [-43.477800, 172.617270], // perfect midpoint
    zoom: 19,
    zoomControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    touchZoom: false
});

// Add Dark Theme Map Tiles (CartoDB Dark Matter without labels)
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

// Add brightened labels as a separate layer
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 20,
    className: 'bright-labels'
}).addTo(map);

// Venue Marker using Coasters Logo
const venueIcon = L.icon({
    iconUrl: 'logo.png',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    className: 'venue-logo'
});

L.marker(venueCoords, { icon: venueIcon, zIndexOffset: 1000 }).addTo(map);

const libraryCoords = [-43.4774150, 172.6164750];
const libraryIcon = L.divIcon({
    className: 'venue-icon',
    html: '📚',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});
L.marker(libraryCoords, { icon: libraryIcon }).addTo(map);

// Bus Stop Definitions
const stops = {
    north: { name: 'North (Main North Rd)', coords: [-43.477230, 172.616740], id: '13347' },
    south: { name: 'South (Main North Rd)', coords: [-43.477250, 172.617030], id: '15319' },
    east:  { name: 'East (Daniels Rd)', coords: [-43.478260, 172.617800], id: '29195' },
    west:  { name: 'West (Daniels Rd)', coords: [-43.478370, 172.617420], id: '29900' }
};

// Panel positioning: which side of the stop should the panel appear?
const panelAnchors = {
    north: { direction: 'left',  offset: [-360, -200] }, // far left and up
    south: { direction: 'right', offset: [60, -80] },    // far right
    east:  { direction: 'right', offset: [60, -200] },   // far right and up
    west:  { direction: 'left',  offset: [-360, 60] }    // far left and down
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

// Add Bus Stops and Walking Lines
for (const [key, stop] of Object.entries(stops)) {
    const marker = L.marker(stop.coords, { icon: stopIcon }).addTo(map);
    stopMarkers[key] = marker;
    
    const stopLatLng = L.latLng(stop.coords);
    const venueLatLng = L.latLng(venueCoords);
    const dist = Math.round(venueLatLng.distanceTo(stopLatLng));
    const walkingTime = Math.ceil(dist / 84);
    
    popups[key] = `<div class="eta-card" id="card-${key}">
        <h3>${stop.name}</h3>
        <p class="walk-info">🚶 ${dist}m · ${walkingTime} min walk</p>
        <div class="eta-loading">Loading ETAs...</div>
    </div>`;
    
    const walkLine = L.polyline([venueCoords, stop.coords], {
        color: '#ff4d4d',
        weight: 3,
        dashArray: '5, 10',
        opacity: 0,
        className: 'walking-path'
    }).addTo(map);
    
    walkingPaths[key] = walkLine;
}

// ============================================================
// REAL OSM ROAD GEOMETRY — actual carriageway coordinates
// ============================================================

const mainNorthRoute_Southbound = [
    [-43.4739075, 172.6172178],
    [-43.4742337, 172.6171929],
    [-43.4753392, 172.6171087],
    [-43.4764564, 172.6170198],
    [-43.4774101, 172.6169421],
    [-43.4774706, 172.6169372],
    [-43.4777678, 172.6169130],
    [-43.4781738, 172.6168799],
    [-43.4782024, 172.6168776],
    [-43.4782869, 172.6168707],
    [-43.4783829, 172.6168628],
    [-43.4791171, 172.6168043],
    [-43.4796639, 172.6167608],
    [-43.4798515, 172.6167479],
    [-43.4812098, 172.6166362],
    [-43.4815305, 172.6166134],
    [-43.4819221, 172.6165798],
    [-43.4826265, 172.6165208],
    [-43.4835056, 172.6164571]
];

const mainNorthRoute_Northbound = [
    [-43.4809881, 172.6165197],
    [-43.4798471, 172.6166076],
    [-43.4792518, 172.6166571],
    [-43.4786799, 172.6167027],
    [-43.4784261, 172.6167214],
    [-43.4783772, 172.6167250],
    [-43.4782811, 172.6167334],
    [-43.4778047, 172.6167723],
    [-43.4775827, 172.6167872],
    [-43.4775247, 172.6167911],
    [-43.4774283, 172.6167990],
    [-43.4772048, 172.6168172],
    [-43.4768553, 172.6168484],
    [-43.4762007, 172.6168999],
    [-43.4753338, 172.6169680]
];

// Route 125 / Daniels Road (Actual OSM Geometry)
function offsetRoute(routePoints, latOffset, lngOffset) {
    return routePoints.map(point => [point[0] + latOffset, point[1] + lngOffset]);
}

const danielsRoadCenter = [
    [-43.4782869, 172.6168707],
    [-43.4782915, 172.6169838],
    [-43.4782921, 172.6169997],
    [-43.4783078, 172.6173932],
    [-43.4783163, 172.6175854],
    [-43.4783489, 172.6183247],
    [-43.4783522, 172.6183944],
    [-43.4783809, 172.6190762],
    [-43.4784096, 172.6197204]
];

const route125Path_Eastbound = [
    [-43.4835056, 172.6163300], [-43.4826265, 172.6163900], [-43.4809881, 172.6165197],
    [-43.4798471, 172.6166076], [-43.4792518, 172.6166571], [-43.4786799, 172.6167027],
    [-43.4783829, 172.6167265], [-43.4782811, 172.6167334],
    ...offsetRoute(danielsRoadCenter, 0.00004, -0.00004)
];

const route125Path_Westbound = [
    ...offsetRoute([...danielsRoadCenter].reverse(), -0.00004, 0.00004),
    [-43.4782869, 172.6168707], [-43.4783829, 172.6168628], [-43.4791171, 172.6168043],
    [-43.4796639, 172.6167608], [-43.4798515, 172.6167479], [-43.4812098, 172.6166362],
    [-43.4815305, 172.6166134], [-43.4819221, 172.6165798], [-43.4826265, 172.6165208],
    [-43.4835056, 172.6164571]
];

const mainLine = L.polyline(mainNorthRoute_Southbound, { color: '#3498db', weight: 6, opacity: 0 }).addTo(map); 
const mainLineRev = L.polyline(mainNorthRoute_Northbound, { color: '#3498db', weight: 6, opacity: 0 }).addTo(map);

const route95Line = L.polyline(mainNorthRoute_Southbound, { color: '#9b59b6', weight: 6, opacity: 0, dashArray: '15, 15' }).addTo(map);
const route95LineRev = L.polyline(mainNorthRoute_Northbound, { color: '#9b59b6', weight: 6, opacity: 0, dashArray: '15, 15' }).addTo(map);

const danielsLine = L.polyline(route125Path_Eastbound, { color: '#2ecc71', weight: 6, opacity: 0 }).addTo(map);
const danielsLineRev = L.polyline(route125Path_Westbound, { color: '#2ecc71', weight: 6, opacity: 0 }).addTo(map);

// Decorators setup
function createDeco(line, color, offset) {
    return {
        deco: L.polylineDecorator(line, { patterns: [] }),
        color: color,
        offset: offset
    };
}

const decoMain = createDeco(mainLine, '#3498db', 0);
const decoMainRev = createDeco(mainLineRev, '#3498db', 50);
const deco95 = createDeco(route95Line, '#9b59b6', 25);
const deco95Rev = createDeco(route95LineRev, '#9b59b6', 75);
const decoDaniels = createDeco(danielsLine, '#2ecc71', 10);
const decoDanielsRev = createDeco(danielsLineRev, '#2ecc71', 60);

let activeDecorators = [];
let arrowOffset = 0;

setInterval(() => {
    arrowOffset = (arrowOffset + 2) % 100;
    activeDecorators.forEach(d => {
        if (map.hasLayer(d.deco)) {
            d.deco.setPatterns([{ 
                offset: ((arrowOffset + d.offset) % 100) + 'px', 
                repeat: '100px', 
                symbol: L.Symbol.arrowHead({pixelSize: 15, pathOptions: {fillOpacity: 1, weight: 0, color: d.color}}) 
            }]);
        }
    });
}, 50);

// Carousel Logic
const stopKeys = Object.keys(stops);
let currentStopIndex = 0;

function positionPanel(key) {
    const board = document.getElementById('arrivals-board');
    const stopPixel = map.latLngToContainerPoint(stops[key].coords);
    const anchor = panelAnchors[key];
    
    board.style.left = (stopPixel.x + anchor.offset[0]) + 'px';
    board.style.top  = (stopPixel.y + anchor.offset[1]) + 'px';
}

function cyclePanels() {
    const activeKey = stopKeys[currentStopIndex];
    
    for (const key of stopKeys) {
        walkingPaths[key].setStyle({ opacity: 0 });
    }
    
    [mainLine, mainLineRev, route95Line, route95LineRev, danielsLine, danielsLineRev].forEach(line => {
        line.setStyle({ opacity: 0 });
    });
    activeDecorators.forEach(d => map.removeLayer(d.deco));
    
    const board = document.getElementById('arrivals-board');
    board.style.display = 'block';
    board.innerHTML = popups[activeKey];
    positionPanel(activeKey);
    
    walkingPaths[activeKey].setStyle({ opacity: 0.9 });
    
    if (activeKey === 'north') {
        mainLineRev.setStyle({ opacity: 1 });
        route95LineRev.setStyle({ opacity: 1 });
        activeDecorators = [decoMainRev, deco95Rev];
    } else if (activeKey === 'south') {
        mainLine.setStyle({ opacity: 1 });
        route95Line.setStyle({ opacity: 1 });
        activeDecorators = [decoMain, deco95];
    } else if (activeKey === 'east') {
        danielsLine.setStyle({ opacity: 1 });
        activeDecorators = [decoDaniels];
    } else if (activeKey === 'west') {
        danielsLineRev.setStyle({ opacity: 1 });
        activeDecorators = [decoDanielsRev];
    }
    
    activeDecorators.forEach(d => map.addLayer(d.deco));
    
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
            
            allArrivals.sort((a, b) => new Date(a.realtimeDeparture || a.scheduledDeparture) - new Date(b.realtimeDeparture || b.scheduledDeparture));
            const upcoming = allArrivals.slice(0, 5);
            
            const stopLatLng = L.latLng(stop.coords);
            const venueLatLng = L.latLng(venueCoords);
            const dist = Math.round(venueLatLng.distanceTo(stopLatLng));
            const walkingTime = Math.ceil(dist / 84);
            
            let html = `<h3>${stop.name}</h3>`;
            html += `<p class="walk-info">🚶 ${dist}m · ${walkingTime} min walk</p>`;
            
            if (upcoming.length > 0) {
                upcoming.forEach(eta => {
                    let routeNum = 'Unknown';
                    if (eta.routeId.includes('1_0854')) routeNum = '1';
                    if (eta.routeId.includes('95_7946')) routeNum = '95';
                    if (eta.routeId.includes('125_6143')) routeNum = '125';
                    
                    const dt = new Date(eta.realtimeDeparture || eta.scheduledDeparture);
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
                html += `<div class="eta-loading">No upcoming buses</div>`;
            }
            
            popups[key] = `<div class="eta-card" id="card-${key}">${html}</div>`;
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
setTimeout(cyclePanels, 1500);

// --- LIVE VEHICLE TRACKING ---
let activePatterns = [];
const busMarkers = {};

function getBusIcon(route) {
    let color = '#45a29e';
    if (route === '1') color = '#3498db';
    if (route === '95') color = '#9b59b6';
    if (route === '125') color = '#2ecc71';
    
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
        
        for (const [id, data] of Object.entries(allVehicles)) {
            if (busMarkers[id]) {
                busMarkers[id].setLatLng([data.lat, data.lng]);
            } else {
                const marker = L.marker([data.lat, data.lng], {
                    icon: getBusIcon(data.route),
                    zIndexOffset: 800
                }).addTo(map);
                marker.bindTooltip(`Bus ${data.label} (Route ${data.route})`, { direction: 'top', className: 'bus-tooltip' });
                busMarkers[id] = marker;
            }
        }
        
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

async function initVehicleTracking() {
    await discoverPatterns();
    if (activePatterns.length > 0) {
        await fetchLiveVehicles();
        setInterval(fetchLiveVehicles, 5000);
    }
}

// Clock Logic (BLINKING COLONS)
function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes().toString().padStart(2, '0');
    let ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    hours = hours.toString().padStart(2, '0');
    
    const showColon = now.getSeconds() % 2 === 0;
    const colon = showColon ? ':' : '<span style="visibility: hidden;">:</span>';
    
    const timeString = `${hours}${colon}${minutes} <span style="font-size: 0.6em">${ampm}</span>`;
    document.getElementById('clock').innerHTML = timeString;
}
setInterval(updateClock, 1000);
updateClock();

initVehicleTracking();
