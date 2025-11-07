// Global variables
let map;
let markers = [];
let markerCount = 0;
let allCrashData = []; // Store all crash data
let selectedYears = [2021, 2022, 2023, 2024]; // Default: all years selected

// Default map center
const defaultCenter = [41.557237, -87.665491];
const defaultZoom = 14;

// Initialize the map when the page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    setupEventListeners();
    loadMarkersFromJSON();
});

// Initialize the Leaflet map
function initializeMap() {
    // Create the map
    map = L.map('map').setView(defaultCenter, defaultZoom);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Add click event to show coordinates (if element exists)
    map.on('click', function(e) {
        const coordinatesEl = document.getElementById('coordinates');
        if (coordinatesEl) {
            const lat = e.latlng.lat.toFixed(6);
            const lng = e.latlng.lng.toFixed(6);
            coordinatesEl.textContent = `Lat: ${lat}, Lng: ${lng}`;
        }
    });
    
    // Add mouse move event to show coordinates in real-time (if element exists)
    map.on('mousemove', function(e) {
        const coordinatesEl = document.getElementById('coordinates');
        if (coordinatesEl) {
            const lat = e.latlng.lat.toFixed(6);
            const lng = e.latlng.lng.toFixed(6);
            coordinatesEl.textContent = `Lat: ${lat}, Lng: ${lng}`;
        }
    });
}

// Setup event listeners for buttons
function setupEventListeners() {
    // Fullscreen toggle button
    document.getElementById('toggleFullscreen').addEventListener('click', function() {
        toggleFullscreen();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.getElementById('map').classList.contains('fullscreen')) {
            toggleFullscreen();
        }
    });
    
    // Year filter checkboxes
    const yearCheckboxes = document.querySelectorAll('.year-checkbox');
    yearCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const year = parseInt(this.getAttribute('data-year'));
            if (this.checked) {
                if (!selectedYears.includes(year)) {
                    selectedYears.push(year);
                }
            } else {
                selectedYears = selectedYears.filter(y => y !== year);
            }
            // Update markers based on selected years
            updateMarkersByYear();
        });
    });
}

// Add a marker to the map
function addMarker(lat, lng, title = 'Marker', description = '', category = 'default') {
    const marker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'custom-marker',
            html: '<div style="background: #4CAF50; border: 3px solid white; border-radius: 50%; width: 20px; height: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        })
    });
    
    // Add popup with marker information
    marker.bindPopup(`
        <div style="text-align: center;">
            <h4>${title}</h4>
            <p><strong>Description:</strong><br>${description}</p>
            <p><strong>Coordinates:</strong><br>
            Lat: ${lat.toFixed(6)}<br>
            Lng: ${lng.toFixed(6)}</p>
            <p><strong>Category:</strong> ${category}</p>
        </div>
    `);
    
    marker.addTo(map);
    markers.push(marker);
    markerCount++;
    updateMarkerCount();
    
    return marker;
}

// Convert CrashDateT to readable date format
function formatCrashDate(crashDateT) {
    if (!crashDateT) return 'Date not available';
    
    // CrashDateT is in format: YYYYMMDDHHMMSS (e.g., 20240121122000.0)
    const dateStr = crashDateT.toString();
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(8, 10);
    const minute = dateStr.substring(10, 12);
    
    try {
        const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    } catch (e) {
        return `${month}/${day}/${year} ${hour}:${minute}`;
    }
}

// Determine marker color based on crash severity
function getMarkerColor(fatalities, injuries) {
    // Convert to numbers if they're strings
    const fatCount = Number(fatalities) || 0;
    const injCount = Number(injuries) || 0;
    
    // Red for fatalities
    if (fatCount > 0) {
        return '#FF0000'; // Red
    }
    // Orange for injuries
    if (injCount > 0) {
        return '#FF9800'; // Orange
    }
    // Yellow for default (no injuries or fatalities)
    return '#FFEB3B'; // Yellow
}

// Extract year from YEAR field (handles both 2-digit and 4-digit formats)
function extractYear(yearValue) {
    if (!yearValue) return null;
    const yearStr = yearValue.toString();
    // If it's a 2-digit year (e.g., "24" for 2024), convert to 4-digit
    if (yearStr.length === 2) {
        const twoDigit = parseInt(yearStr);
        // Assume years 00-99 map to 2000-2099
        return 2000 + twoDigit;
    }
    // If it's already 4-digit, return as is
    return parseInt(yearStr);
}

// Create a marker from crash data
function createCrashMarker(props) {
    const lat = props.TSCrashLat;
    const lon = props.TSCrashLon;
    
    if (!lat || !lon) return null;
    
    const crashDate = formatCrashDate(props.CrashDateT);
    const caseId = props.CASE_ID || 'N/A';
    const collisionType = props.COLL_TYPE || 'N/A';
    const injuries = props.INJURIES || 0;
    const fatalities = props.FATALITIES || 0;
    const weather = props.WEATHER || 'N/A';
    const lighting = props.LIGHTING || 'N/A';
    const year = extractYear(props.YEAR);
    
    // Determine marker color based on severity
    const markerColor = getMarkerColor(fatalities, injuries);
    
    // Create popup content with crash information
    const popupContent = `
        <div style="text-align: left; min-width: 200px;">
            <h4 style="margin-top: 0;">Crash Report</h4>
            <p><strong>Case ID:</strong> ${caseId}</p>
            <p><strong>Year:</strong> ${year || 'N/A'}</p>
            <p><strong>Date & Time:</strong><br>${crashDate}</p>
            <p><strong>Collision Type:</strong> ${collisionType}</p>
            <p><strong>Injuries:</strong> ${injuries} | <strong>Fatalities:</strong> ${fatalities}</p>
            <p><strong>Weather:</strong> ${weather}</p>
            <p><strong>Lighting:</strong> ${lighting}</p>
            <p><strong>Coordinates:</strong><br>
            Lat: ${lat.toFixed(6)}<br>
            Lng: ${lon.toFixed(6)}</p>
        </div>
    `;
    
    // Create marker with dynamic color using circleMarker for better color control
    const marker = L.circleMarker([lat, lon], {
        radius: 10,
        fillColor: markerColor,
        color: 'white',
        weight: 3,
        opacity: 1,
        fillOpacity: 1
    });
    
    // Add popup
    marker.bindPopup(popupContent);
    
    // Store year with marker for filtering
    marker._crashYear = year;
    
    return marker;
}

// Update markers based on selected years
function updateMarkersByYear() {
    // Clear existing markers
    markers.forEach(marker => {
        map.removeLayer(marker);
    });
    markers = [];
    markerCount = 0;
    
    // Debug: count markers by year
    const yearCounts = {};
    
    // Filter and add markers based on selected years
    allCrashData.forEach(feature => {
        const props = feature.properties;
        const year = extractYear(props.YEAR);
        
        // Debug: count by year
        if (year) {
            yearCounts[year] = (yearCounts[year] || 0) + 1;
        }
        
        // Only add marker if year is selected
        if (year && selectedYears.includes(year)) {
            const marker = createCrashMarker(props);
            if (marker) {
                marker.addTo(map);
                markers.push(marker);
                markerCount++;
            }
        }
    });
    
    // Debug: log year counts
    console.log('Total data by year:', yearCounts);
    console.log('Selected years:', selectedYears);
    
    // Fit map to show all visible markers
    if (markers.length > 0) {
        fitMapToMarkers();
    }
    
    updateMarkerCount();
    console.log(`Displaying ${markers.length} markers for years: ${selectedYears.join(', ')}`);
}

// Load markers from combined GeoJSON file (2021-2024)
async function loadMarkersFromJSON() {
    try {
        const fileName = '183rdCrashes2021-2024.geojson';
        
        const response = await fetch(fileName);
        
        if (!response.ok) {
            throw new Error(`Failed to load ${fileName}: HTTP ${response.status}`);
        }
        
        const geojson = await response.json();
        
        // Store all crash data
        allCrashData = geojson.features || [];
        
        console.log(`✓ Loaded ${allCrashData.length} crash records from ${fileName}`);
        
        // Debug: show sample year values and count by year
        if (allCrashData.length > 0) {
            const yearCounts = {};
            allCrashData.forEach(feature => {
                const year = extractYear(feature.properties.YEAR);
                if (year) {
                    yearCounts[year] = (yearCounts[year] || 0) + 1;
                }
            });
            console.log('Data by year:', yearCounts);
            
            // Show sample year value
            const sampleYear = allCrashData[0].properties.YEAR;
            console.log(`Sample YEAR value: "${sampleYear}" (extracted: ${extractYear(sampleYear)})`);
        }
        
        // Update markers based on selected years
        updateMarkersByYear();
        
    } catch (error) {
        console.error('Error loading markers from GeoJSON file:', error);
        // Fallback to sample markers if file fails to load
        if (allCrashData.length === 0) {
            addSampleMarkers();
        }
    }
}

// Update marker count display (if element exists)
function updateMarkerCount() {
    const markerCountEl = document.getElementById('markerCount');
    if (markerCountEl) {
        markerCountEl.textContent = `Markers: ${markerCount}`;
    }
}

// Toggle fullscreen mode
function toggleFullscreen() {
    const mapContainer = document.getElementById('map');
    const button = document.getElementById('toggleFullscreen');
    
    if (mapContainer.classList.contains('fullscreen')) {
        mapContainer.classList.remove('fullscreen');
        button.textContent = 'Fullscreen';
        document.body.style.overflow = 'auto';
    } else {
        mapContainer.classList.add('fullscreen');
        button.textContent = 'Exit Fullscreen';
        document.body.style.overflow = 'hidden';
    }
    
    // Trigger map resize after fullscreen toggle
    setTimeout(() => {
        map.invalidateSize();
    }, 100);
}

// Add sample markers for demonstration (fallback)
function addSampleMarkers() {
    const sampleLocations = [
        { lat: 41.560000, lng: -87.660000, title: 'Sample Location 1', description: 'A sample location', category: 'sample' },
        { lat: 41.555000, lng: -87.670000, title: 'Sample Location 2', description: 'Another sample location', category: 'sample' },
        { lat: 41.562000, lng: -87.658000, title: 'Sample Location 3', description: 'Third sample location', category: 'sample' }
    ];
    
    sampleLocations.forEach(location => {
        addMarker(location.lat, location.lng, location.title, location.description, location.category);
    });
}

// Utility function to get current map bounds
function getMapBounds() {
    return map.getBounds();
}

// Utility function to fit map to all markers
function fitMapToMarkers() {
    if (markers.length > 0) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Export functions for external use (WordPress embedding)
window.LeafletMapAPI = {
    addMarker: addMarker,
    loadMarkersFromJSON: loadMarkersFromJSON,
    getMapBounds: getMapBounds,
    fitMapToMarkers: fitMapToMarkers,
    getMap: () => map
};

// Handle window resize
window.addEventListener('resize', function() {
    if (map) {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }
});

// Console log for debugging
console.log('Leaflet Map initialized successfully!');
console.log('Available API methods:', Object.keys(window.LeafletMapAPI));
