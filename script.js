// Global variables
let map;
let markers = [];
let markerCount = 0;

// Default map center (San Francisco)
const defaultCenter = [37.7749, -122.4194];
const defaultZoom = 13;

// Initialize the map when the page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    setupEventListeners();
    addSampleMarkers();
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
    // Add marker button
    document.getElementById('addMarker').addEventListener('click', function() {
        const center = map.getCenter();
        addMarker(center.lat, center.lng);
    });
    
    // Clear markers button
    document.getElementById('clearMarkers').addEventListener('click', function() {
        clearAllMarkers();
    });
    
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
function addMarker(lat, lng, title = 'Custom Marker') {
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
            <p><strong>Coordinates:</strong><br>
            Lat: ${lat.toFixed(6)}<br>
            Lng: ${lng.toFixed(6)}</p>
            <button onclick="removeMarker(${markers.length})" style="background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Remove</button>
        </div>
    `);
    
    marker.addTo(map);
    markers.push(marker);
    markerCount++;
    updateMarkerCount();
    
    return marker;
}

// Remove a specific marker
function removeMarker(index) {
    if (index >= 0 && index < markers.length) {
        map.removeLayer(markers[index]);
        markers.splice(index, 1);
        markerCount--;
        updateMarkerCount();
    }
}

// Clear all markers
function clearAllMarkers() {
    markers.forEach(marker => {
        map.removeLayer(marker);
    });
    markers = [];
    markerCount = 0;
    updateMarkerCount();
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

// Add sample markers for demonstration
function addSampleMarkers() {
    const sampleLocations = [
        { lat: 37.7849, lng: -122.4094, title: 'Sample Location 1' },
        { lat: 37.7649, lng: -122.4294, title: 'Sample Location 2' },
        { lat: 37.7549, lng: -122.4094, title: 'Sample Location 3' }
    ];
    
    sampleLocations.forEach(location => {
        addMarker(location.lat, location.lng, location.title);
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
    removeMarker: removeMarker,
    clearAllMarkers: clearAllMarkers,
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
