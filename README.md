# Custom Interactive Map with Leaflet.js

A responsive, interactive map built with Leaflet.js that can be embedded in WordPress or hosted on GitHub Pages.

## Features

- 🗺️ **Interactive Map**: Full-featured map with zoom, pan, and click interactions
- 📍 **Custom Markers**: Add, remove, and manage markers with custom styling
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- 🎨 **Modern UI**: Beautiful gradient design with smooth animations
- 🔧 **WordPress Ready**: Optimized for embedding in WordPress sites
- 🌐 **GitHub Pages**: Ready to deploy on GitHub Pages
- ⌨️ **Keyboard Shortcuts**: ESC to exit fullscreen mode
- 📊 **Real-time Info**: Live coordinate display and marker count

## Files Structure

```
webmap/
├── index.html              # Main map page (GitHub Pages)
├── wordpress-embed.html    # WordPress embed version
├── styles.css              # Main stylesheet
├── script.js               # Main JavaScript functionality
├── .nojekyll              # GitHub Pages configuration
└── README.md              # This documentation
```

## Quick Start

### GitHub Pages Deployment

1. Push this repository to GitHub
2. Go to repository Settings → Pages
3. Select "Deploy from a branch" → "main" → "/ (root)"
4. Your map will be available at `https://yourusername.github.io/webmap`

### WordPress Embedding

The WordPress embed version has **exactly the same look and functionality** as the main GitHub Pages site, including year filters, crash data visualization, clustering, and fullscreen mode.

1. Upload the following files to a publicly accessible folder on your WordPress site (e.g., `https://yoursite.com/wp-content/uploads/webmap/`):
   - `wordpress-embed.html` - The embed HTML file
   - `styles.css` - Stylesheet (required)
   - `script.js` - JavaScript functionality (required)
   - `183rdCrashes2021-2024.geojson` - Crash data file (required)
   
   **Important**: All files must be in the same directory. The embed HTML references these files using relative paths.

2. Add the map to a WordPress page or post:
   - **Gutenberg/Block Editor**: Insert a *Custom HTML* block and paste the iframe snippet below.
   - **Classic Editor**: Switch to the *Text* tab and paste the same iframe markup.

3. Example iframe markup:
   ```html
   <iframe
       src="https://yoursite.com/wp-content/uploads/webmap/wordpress-embed.html"
       width="100%"
       height="800"
       style="border:0; border-radius:8px;"
       allowfullscreen
       loading="lazy">
   </iframe>
   ```
   
   **Note**: Adjust the `height` attribute (e.g., `800px` or `100vh`) based on your needs. The map includes a header, year filters, and controls, so ensure adequate height.

4. The embed exposes an API via `window.LeafletMapAPI` (available to other scripts on the page) with methods including:
   - `addMarker(lat, lng, title, description, category)` - Add a custom marker
   - `loadMarkersFromJSON()` - Reload crash data
   - `fitMapToMarkers()` - Fit map to show all markers
   - `getMapBounds()` - Get current map bounds
   - `getMap()` - Get the Leaflet map instance

5. If the iframe does not render:
   - Confirm that your security plugins allow iframes from your own domain
   - Verify that all required files (HTML, CSS, JS, GeoJSON) are uploaded and accessible
   - Check browser console for JavaScript errors
   - Ensure WordPress allows iframe embedding

## Customization

### Map Center and Zoom
Edit the default values in `script.js`:
```javascript
const defaultCenter = [37.7749, -122.4194]; // [latitude, longitude]
const defaultZoom = 13;
```

### Custom Markers
Add markers programmatically:
```javascript
// Add a marker at specific coordinates
addMarker(40.7128, -74.0060, 'New York City');

// Add multiple markers
const locations = [
    { lat: 40.7128, lng: -74.0060, title: 'New York' },
    { lat: 34.0522, lng: -118.2437, title: 'Los Angeles' },
    { lat: 41.8781, lng: -87.6298, title: 'Chicago' }
];

locations.forEach(location => {
    addMarker(location.lat, location.lng, location.title);
});
```

### Styling
Modify `styles.css` to change colors, fonts, and layout:
```css
/* Change primary color */
.btn {
    background: linear-gradient(45deg, #your-color, #your-color-darker);
}

/* Change map container height */
.map-container {
    height: 80vh; /* Adjust as needed */
}
```

## API Reference

The map exposes a global API for external control:

```javascript
// Add a marker
window.LeafletMapAPI.addMarker(lat, lng, title);

// Remove a marker by index
window.LeafletMapAPI.removeMarker(index);

// Clear all markers
window.LeafletMapAPI.clearAllMarkers();

// Fit map to show all markers
window.LeafletMapAPI.fitMapToMarkers();

// Get the map instance
const mapInstance = window.LeafletMapAPI.getMap();
```

## WordPress Integration

### Method 1: Direct Embed
```html
<iframe src="https://yoursite.com/wordpress-embed.html" 
        width="100%" 
        height="400" 
        frameborder="0"
        allowfullscreen>
</iframe>
```

### Method 2: Custom Post Type
Create a custom post type in WordPress and use the iframe shortcode.

### Method 3: Plugin Integration
Create a WordPress plugin that includes the map files and provides a shortcode.

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Dependencies

- **Leaflet.js 1.9.4**: Interactive map library
- **OpenStreetMap**: Free map tiles
- **No additional dependencies**: Pure HTML, CSS, and JavaScript

## Performance

- **Lightweight**: ~50KB total (including Leaflet.js)
- **Fast Loading**: Optimized for quick page loads
- **Mobile Optimized**: Responsive design with touch support
- **Caching Friendly**: Static files with proper cache headers

## Troubleshooting

### Map not displaying
1. Check browser console for JavaScript errors
2. Ensure internet connection (requires CDN for Leaflet.js)
3. Verify file paths are correct

### Markers not showing
1. Check if markers array is properly initialized
2. Verify coordinates are valid (lat: -90 to 90, lng: -180 to 180)
3. Check browser console for errors

### WordPress embed issues
1. Ensure iframe is not blocked by security plugins
2. Check that the embed file is accessible via direct URL
3. Verify WordPress allows iframe embedding

## License

This project is open source and available under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
1. Check this README first
2. Search existing GitHub issues
3. Create a new issue with detailed description
4. Include browser version and error messages

---

**Happy Mapping! 🗺️**
