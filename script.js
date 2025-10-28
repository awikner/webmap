// Global variables
let map;
let markers = [];
let markerCount = 0;

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
    
    // Add click event to show coordinates
    map.on('click', function(e) {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);
        document.getElementById('coordinates').textContent = `Lat: ${lat}, Lng: ${lng}`;
    });
    
    // Add mouse move event to show coordinates in real-time
    map.on('mousemove', function(e) {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);
        document.getElementById('coordinates').textContent = `Lat: ${lat}, Lng: ${lng}`;
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

// Load markers from JSON file
async function loadMarkersFromJSON() {
    try {
        const response = await fetch('markers.json');
        const data = await response.json();
        
        // Clear existing markers
        markers.forEach(marker => {
            map.removeLayer(marker);
        });
        markers = [];
        markerCount = 0;
        
        // Add markers from JSON data
        data.markers.forEach(markerData => {
            addMarker(
                markerData.lat,
                markerData.lng,
                markerData.title,
                markerData.description,
                markerData.category
            );
        });
        
        // Fit map to show all markers
        if (markers.length > 0) {
            fitMapToMarkers();
        }
        
        console.log(`Loaded ${markers.length} markers from JSON file`);
    } catch (error) {
        console.error('Error loading markers from JSON:', error);
        // Fallback to sample markers if JSON fails to load
        addSampleMarkers();
    }
}

// Update marker count display
function updateMarkerCount() {
    document.getElementById('markerCount').textContent = `Markers: ${markerCount}`;
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
