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
    north: { name: 'North (Main North Rd)', coords: [-43.477230, 172.616740], id: '13347' }, // West side
    south: { name: 'South (Main North Rd)', coords: [-43.477250, 172.617030], id: '15319' }, // East side
    east:  { name: 'East (Daniels Rd)', coords: [-43.478260, 172.617800], id: '29195' }, // North side
    west:  { name: 'West (Daniels Rd)', coords: [-43.478370, 172.617420], id: '29900' }  // South side
};

const footpaths = {
    north: [venueCoords, [-43.47826, 172.61740], [-43.47826, 172.61690], [-43.47830, 172.61670], stops.north.coords],
    south: [venueCoords, [-43.47826, 172.61740], [-43.47826, 172.61690], stops.south.coords],
    east:  [venueCoords, [-43.47826, 172.61740], [-43.47826, 172.617800], stops.east.coords],
    west:  [venueCoords, [-43.47826, 172.61740], [-43.47826, 172.61745], [-43.47835, 172.61745], stops.west.coords]
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
    
    // Calculate Walking Distance and ETA
    const stopLatLng = L.latLng(stop.coords);
    const venueLatLng = L.latLng(venueCoords);
    const dist = Math.round(venueLatLng.distanceTo(stopLatLng));
    const walkingTime = Math.ceil(dist / 84);
    
    // Store HTML — walking info is inside the panel
    popups[key] = `<div class="eta-card" id="card-${key}">
        <h3>${stop.name}</h3>
        <p class="walk-info">🚶 ${dist} meters (${walkingTime} min walk)</p>
        <div class="eta-loading">Loading ETAs...</div>
    </div>`;
    
    // Draw Red Walking Line (no tooltip)
    const walkLine = L.polyline(footpaths[key], {
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
// Main North Road is a divided highway with separate one-way roads.
// Source: OpenStreetMap Overpass API
// ============================================================

// SOUTHBOUND carriageway (East side, heading toward City Centre)
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

// NORTHBOUND carriageway (West side, heading toward Belfast)
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
    ...offsetRoute(danielsRoadCenter, 0.000015, -0.000015)
];

const route125Path_Westbound = [
    ...offsetRoute([...danielsRoadCenter].reverse(), -0.000015, 0.000015),
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

// Carousel Logic (Rotate active panel every 15 seconds)
const stopKeys = Object.keys(stops);
let currentStopIndex = 0;

function positionPanel(key) {
    const board = document.getElementById('arrivals-board');
    const stopPixel = map.latLngToContainerPoint(stops[key].coords);
    
    const width = 480;
    const height = board.offsetHeight || 300;
    const mapW = map.getSize().x;
    const mapH = map.getSize().y;
    
    let left = stopPixel.x;
    let top = stopPixel.y;
    
    if (key === 'north') {
        left = stopPixel.x + 40; // Right of the North stop
        top = stopPixel.y - height / 2;
    } else if (key === 'south') {
        left = stopPixel.x + 40; // Right of the South stop
        top = stopPixel.y - height / 2;
    } else if (key === 'east') {
        left = stopPixel.x - width / 2; // Above the East stop
        top = stopPixel.y - height - 40;
    } else if (key === 'west') {
        left = stopPixel.x - width - 40; // Left of the West stop
        top = stopPixel.y - height / 2;
    }
    
    if (left < 20) left = 20;
    if (top < 100) top = 100;
    if (left + width > mapW - 20) left = mapW - width - 20;
    if (top + height > mapH - 20) top = mapH - height - 20;
    
    board.style.left = left + 'px';
    board.style.top  = top + 'px';
}

function cyclePanels() {
    const activeKey = stopKeys[currentStopIndex];
    
    // Hide all walking lines
    for (const key of stopKeys) {
        walkingPaths[key].setStyle({ opacity: 0 });
    }
    
    // Hide all routes
    [mainLine, mainLineRev, route95Line, route95LineRev, danielsLine, danielsLineRev].forEach(line => {
        line.setStyle({ opacity: 0 });
    });
    activeDecorators.forEach(d => map.removeLayer(d.deco));
    
    // Update and position the panel
    const board = document.getElementById('arrivals-board');
    board.style.display = 'block';
    board.innerHTML = popups[activeKey];
    positionPanel(activeKey);
    
    walkingPaths[activeKey].setStyle({ opacity: 0.9 });
    
    // Show only active routes
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

// Static Mock Data for GitHub Pages
const mockArrivals = {
    north: [
        { route: '1', destination: 'Rangiora', time: 'Due' },
        { route: '95', destination: 'Pegasus', time: '5 min' },
        { route: '1', destination: 'Rangiora', time: '15 min' }
    ],
    south: [
        { route: '1', destination: 'Cashmere', time: '2 min' },
        { route: '95', destination: 'City', time: '10 min' }
    ],
    east: [
        { route: '125', destination: 'Redwood', time: '7 min' }
    ],
    west: [
        { route: '125', destination: 'Westlake', time: '12 min' }
    ]
};

// Data Fetching Logic (Static)
function fetchETAs() {
    try {
        const data = mockArrivals;
        
        for (const [key, stop] of Object.entries(stops)) {
            const stopData = data[key];
            const stopLatLng = L.latLng(stop.coords);
            const venueLatLng = L.latLng(venueCoords);
            const dist = Math.round(venueLatLng.distanceTo(stopLatLng));
            const walkingTime = Math.ceil(dist / 84);
            
            let html = `<h3>${stop.name}</h3>`;
            html += `<p class="walk-info">🚶 ${dist}m · ${walkingTime} min walk</p>`;
            
            if (stopData && stopData.length > 0) {
                stopData.forEach(eta => {
                    const routeClass = `route-${eta.route}`;
                    html += `
                    <div class="eta-row">
                        <span class="eta-route ${routeClass}">${eta.route}</span>
                        <span class="eta-dest">${eta.destination}</span>
                        <span class="eta-time">${eta.time}</span>
                    </div>`;
                });
            } else {
                html += `<div class="eta-loading">No upcoming buses</div>`;
            }
            
            popups[key] = `<div class="eta-card" id="card-${key}">${html}</div>`;
        }
    } catch (err) {
        console.error('Error rendering arrivals:', err);
    }
}

// Render data immediately
setTimeout(fetchETAs, 1000);

// Start Carousel
setInterval(cyclePanels, 15000);
setTimeout(cyclePanels, 1500);

// Clock Logic (BLINKING COLONS)
function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes().toString().padStart(2, '0');
    let ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    hours = hours.toString().padStart(2, '0');
    
    // Blinking colon based on seconds
    const showColon = now.getSeconds() % 2 === 0;
    const colon = showColon ? ':' : '<span style="visibility: hidden;">:</span>';
    
    const timeString = `${hours}${colon}${minutes} <span style="font-size: 0.6em">${ampm}</span>`;
    document.getElementById('clock').innerHTML = timeString;
}
setInterval(updateClock, 1000);
updateClock();
