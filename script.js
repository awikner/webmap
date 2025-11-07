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
    
    // Recluster markers when zoom level changes
    map.on('zoomend', function() {
        if (allCrashData.length > 0) {
            updateMarkersByYear();
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

// Determine the most severe crash from a group of crashes
function getMostSevereCrash(crashes) {
    let mostSevere = { fatalities: 0, injuries: 0 };
    
    crashes.forEach(crash => {
        const fatalities = Number(crash.fatalities) || 0;
        const injuries = Number(crash.injuries) || 0;
        
        // Prioritize fatalities over injuries
        if (fatalities > mostSevere.fatalities) {
            mostSevere = { fatalities, injuries };
        } else if (fatalities === mostSevere.fatalities && injuries > mostSevere.injuries) {
            mostSevere = { fatalities, injuries };
        }
    });
    
    return mostSevere;
}

// Calculate distance between two lat/lng points in meters
function getDistanceInMeters(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Calculate pixel distance between two markers at current zoom level
function getPixelDistance(marker1, marker2, map) {
    try {
        // Use stored lat/lng or get from marker
        const lat1 = marker1._lat || (marker1.getLatLng ? marker1.getLatLng().lat : marker1.lat);
        const lng1 = marker1._lng || (marker1.getLatLng ? marker1.getLatLng().lng : marker1.lng);
        const lat2 = marker2._lat || (marker2.getLatLng ? marker2.getLatLng().lat : marker2.lat);
        const lng2 = marker2._lng || (marker2.getLatLng ? marker2.getLatLng().lng : marker2.lng);
        
        const point1 = map.latLngToContainerPoint(L.latLng(lat1, lng1));
        const point2 = map.latLngToContainerPoint(L.latLng(lat2, lng2));
        return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
    } catch (e) {
        console.warn('Error calculating pixel distance:', e);
        // Return a large distance if calculation fails
        return 999999;
    }
}

// Cluster markers that are close together using geographic distance
function clusterMarkers(markerList, map, distanceMeters = 50) {
    if (!markerList || markerList.length === 0) return [];
    
    const clusters = [];
    const processed = new Set();
    
    markerList.forEach((marker, index) => {
        if (processed.has(index)) return;
        
        const cluster = [marker];
        const crashData = [{
            fatalities: marker._fatalities || 0,
            injuries: marker._injuries || 0
        }];
        
        // Get lat/lng for this marker
        const lat1 = marker._lat;
        const lng1 = marker._lng;
        
        if (!lat1 || !lng1) {
            // If no stored lat/lng, skip clustering for this marker
            processed.add(index);
            clusters.push({ markers: cluster, crashData });
            return;
        }
        
        // Find all markers within distanceMeters
        markerList.forEach((otherMarker, otherIndex) => {
            if (index === otherIndex || processed.has(otherIndex)) return;
            
            const lat2 = otherMarker._lat;
            const lng2 = otherMarker._lng;
            
            if (!lat2 || !lng2) return;
            
            // Calculate geographic distance in meters
            const distance = getDistanceInMeters(lat1, lng1, lat2, lng2);
            
            if (distance <= distanceMeters) {
                cluster.push(otherMarker);
                crashData.push({
                    fatalities: otherMarker._fatalities || 0,
                    injuries: otherMarker._injuries || 0
                });
                processed.add(otherIndex);
            }
        });
        
        processed.add(index);
        clusters.push({ markers: cluster, crashData });
    });
    
    const clusterCount = clusters.filter(c => c.markers.length > 1).length;
    console.log(`Clustered ${markerList.length} markers into ${clusters.length} groups (${clusterCount} clusters with 2+ markers)`);
    return clusters;
}

// Create a cluster marker with count and severity-based color
function createClusterMarker(cluster, map) {
    const { markers, crashData } = cluster;
    
    // Calculate center point
    let totalLat = 0;
    let totalLng = 0;
    markers.forEach(marker => {
        // Use stored lat/lng or get from marker
        const lat = marker._lat || (marker.getLatLng ? marker.getLatLng().lat : marker.lat);
        const lng = marker._lng || (marker.getLatLng ? marker.getLatLng().lng : marker.lng);
        totalLat += lat;
        totalLng += lng;
    });
    const centerLat = totalLat / markers.length;
    const centerLng = totalLng / markers.length;
    
    // Determine most severe crash
    const mostSevere = getMostSevereCrash(crashData);
    const markerColor = getMarkerColor(mostSevere.fatalities, mostSevere.injuries);
    
    // Create combined popup content
    const popupContent = `
        <div style="text-align: left; min-width: 200px;">
            <h4 style="margin-top: 0;">Crash Cluster</h4>
            <p>This cluster represents <strong>${markers.length}</strong> crash/crashes at this location.</p>
            <p>Most severe crash: <strong>${mostSevere.fatalities}</strong> fatality/fatalities, <strong>${mostSevere.injuries}</strong> injury/injuries.</p>
        </div>
    `;
    
    // Determine size and font size based on count
    const count = markers.length;
    let size = 30;
    let fontSize = 12;
    if (count > 9) {
        size = 35;
        fontSize = 11;
    }
    if (count > 99) {
        size = 40;
        fontSize = 10;
    }
    
    // Create count label using a div icon
    const countIcon = L.divIcon({
        className: 'cluster-marker',
        html: `<div style="background-color: ${markerColor}; border: 3px solid white; border-radius: 50%; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: ${fontSize}px; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">${count}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
    });
    
    const clusterMarker = L.marker([centerLat, centerLng], {
        icon: countIcon
    });
    
    clusterMarker.bindPopup(popupContent);
    
    // Store original markers and location for reference
    clusterMarker._originalMarkers = markers;
    clusterMarker._lat = centerLat;
    clusterMarker._lng = centerLng;
    
    return clusterMarker;
}

// Create a marker from crash data
function createCrashMarker(props) {
    const lat = props.TSCrashLat;
    const lon = props.TSCrashLon;
    
    if (!lat || !lon) return null;
    
    const crashDate = formatCrashDate(props.CrashDateT);
    const collisionType = props.COLL_TYPE || 'N/A';
    const injuries = props.INJURIES || 0;
    const fatalities = props.FATALITIES || 0;
    const weather = props.WEATHER || 'N/A';
    const lighting = props.LIGHTING || 'N/A';
    const year = extractYear(props.YEAR);
    
    // Determine marker color based on severity
    const markerColor = getMarkerColor(fatalities, injuries);
    
    // Create popup content with crash information in paragraph form
    const popupContent = `
        <div style="text-align: left; min-width: 200px;">
            <h4 style="margin-top: 0;">Crash Report</h4>
            <p>This crash occurred on <strong>${crashDate}</strong>. The collision type was <strong>${collisionType}</strong>. There were <strong>${injuries}</strong> injury/injuries and <strong>${fatalities}</strong> fatality/fatalities.</p>
            <p>Weather conditions were <strong>${weather}</strong> and lighting was <strong>${lighting}</strong>.</p>
            <p>Coordinates: <strong>Lat: ${lat.toFixed(6)}, Lng: ${lon.toFixed(6)}</strong></p>
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
    
    // Store year, severity data, and lat/lng with marker for filtering and clustering
    marker._crashYear = year;
    marker._fatalities = fatalities;
    marker._injuries = injuries;
    marker._lat = lat;
    marker._lng = lon;
    
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
    const allMarkers = [];
    
    // Filter and create markers based on selected years
    allCrashData.forEach(feature => {
        const props = feature.properties;
        const year = extractYear(props.YEAR);
        
        // Debug: count by year
        if (year) {
            yearCounts[year] = (yearCounts[year] || 0) + 1;
        }
        
        // Only create marker if year is selected
        if (year && selectedYears.includes(year)) {
            const marker = createCrashMarker(props);
            if (marker) {
                allMarkers.push(marker);
            }
        }
    });
    
    // Cluster markers that are close together (within 50 meters)
    // Using geographic distance instead of pixel distance for reliability
    const clusters = clusterMarkers(allMarkers, map, 50);
    
    console.log(`Created ${clusters.length} clusters from ${allMarkers.length} markers`);
    let clusterCount = 0;
    let individualCount = 0;
    
    // Add clustered or individual markers to map
    clusters.forEach(cluster => {
        if (cluster.markers.length > 1) {
            // Create cluster marker for multiple markers
            clusterCount++;
            const clusterMarker = createClusterMarker(cluster, map);
            clusterMarker.addTo(map);
            markers.push(clusterMarker);
            markerCount++;
            console.log(`Created cluster with ${cluster.markers.length} markers at lat: ${clusterMarker._lat || 'N/A'}, lng: ${clusterMarker._lng || 'N/A'}`);
        } else {
            // Add individual marker
            individualCount++;
            const marker = cluster.markers[0];
            marker.addTo(map);
            markers.push(marker);
            markerCount++;
        }
    });
    
    console.log(`Displayed ${clusterCount} clusters and ${individualCount} individual markers`);
    
    // Debug: log year counts
    console.log('Total data by year:', yearCounts);
    console.log('Selected years:', selectedYears);
    
    // Fit map to show all visible markers
        if (markers.length > 0) {
            fitMapToMarkers();
    }
    
    updateMarkerCount();
    console.log(`Displaying ${markers.length} markers (${allMarkers.length} total crashes) for years: ${selectedYears.join(', ')}`);
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
        
        // Count crashes by year and update checkbox labels
        const yearCounts = {};
        if (allCrashData.length > 0) {
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
        
        // Update checkbox labels with crash counts
        updateYearCheckboxLabels(yearCounts);
        
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

// Update checkbox labels with crash counts by year
function updateYearCheckboxLabels(yearCounts) {
    const yearCheckboxes = document.querySelectorAll('.year-checkbox');
    yearCheckboxes.forEach(checkbox => {
        const year = parseInt(checkbox.getAttribute('data-year'));
        const count = yearCounts[year] || 0;
        const label = checkbox.closest('.year-checkbox-label');
        if (label) {
            const span = label.querySelector('span');
            if (span) {
                span.textContent = `${year} (${count} crashes)`;
            }
        }
    });
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
