# Gunnison County Property Map

An interactive web map visualizing property attributes across Gunnison County, Colorado.

## Features

- **Interactive Property Visualization**: Color parcels by Total Value, Quality, or View Description
- **Hybrid Data Approach**: Combines property assessment data with parcel data for maximum coverage
- **Clean Interface**: No colored overlays - only parcels with data are colored
- **Responsive Design**: Works on desktop and mobile devices
- **Gunnison County Branding**: Uses official color palette

## Live Demo

🌐 **[View Live Demo](https://eesterlein.github.io/gunnison_gis_mapping_static_demo/)**

## Data Sources

- **Property Attributes**: Detailed property data including quality, view, and values
- **Parcel Boundaries**: Tax parcel boundaries from Gunnison County
- **Subdivision Boundaries**: Subdivision outlines for context
- **Address Points**: Address point data for enhanced coverage

## Technical Details

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Mapping**: Leaflet.js with OpenStreetMap tiles
- **Data Format**: GeoJSON, CSV
- **Deployment**: GitHub Pages

## Color Scheme

- **Low Value** (< $200K): Very light gray (transparent)
- **Medium Value** ($200K-$400K): Gold/Brown (#B89A5D)
- **High Value** ($400K-$800K): Dark Forest Green (#224428)
- **Very High Value** (> $800K): Bright Red (#FF6B6B)

## Usage

1. **Select Attribute**: Use the dropdown to choose between Total Value, Quality, or View Description
2. **Explore Map**: Zoom and pan to explore different areas
3. **View Details**: Click on parcels to see detailed property information
4. **Toggle Layers**: Use the address points toggle if needed

## Data Coverage

- **Property Data**: ~6,157 parcels with detailed attributes
- **Parcel Data**: ~15,000 parcels with assessment values
- **Combined Coverage**: ~97% of all parcels have some data

## Local Development

To run locally:

```bash
# Clone the repository
git clone https://github.com/your-username/gis_mapping_comparison.git
cd gis_mapping_comparison

# Serve the html_map folder
cd html_map
python3 -m http.server 8000

# Open http://localhost:8000 in your browser
```

## File Structure

```
html_map/
├── index.html              # Main HTML file
├── script_fixed_colors.js   # Main JavaScript (current version)
├── style.css               # CSS styling
└── data/                   # Data files
    ├── Property_Attributes_cleaned.csv
    ├── Taxparcelassessor_fixed.geojson
    ├── Subdivision.geojson
    └── Address.geojson
```

## License

This project is for educational and demonstration purposes. Data sources are from Gunnison County, Colorado.

## Contributing

This is a demonstration project. For production use, please ensure proper data licensing and attribution.
