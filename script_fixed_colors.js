// Gunnison County Property Map - Fixed Colors and Functionality
// Interactive map with better colors and restored View/Quality functionality

class GunnisonCountyMap {
    constructor() {
        this.map = null;
        this.parcelsLayer = null;
        this.subdivisionLayer = null;
        this.addressLayer = null;
        this.propertyData = new Map();
        this.addressData = new Map();
        this.colorBy = 'SumOfACTUALVALUE'; // Default to value since most parcels have this
        this.colorSchemes = {
            'ATTRIBUTESUBTYPE': {
                'LIMITED OR BELOW AVERAGE': '#FFD700',  // Bright yellow
                'TYPICAL OR AVERAGE': '#FFA500',        // Orange
                'SCENIC OR ABOVE AVERAGE': '#FF6347',   // Tomato red
                'EXCELLENT OR SUPERIOR': '#DC143C'      // Crimson red
            },
            'EXT CONDITION': {
                'Poor': '#FFD700',       // Bright yellow
                'Fair': '#FFA500',       // Orange
                'Average': '#FF6347',    // Tomato red
                'Good': '#DC143C',       // Crimson red
                'Very Good': '#B22222',  // Fire brick
                'Excellent': '#8B0000'   // Dark red
            },
            'SumOfACTUALVALUE': {
                'Low': '#FFD700',        // Bright yellow
                'Medium': '#FFA500',     // Orange
                'High': '#FF6347',       // Tomato red
                'Very High': '#DC143C'   // Crimson red
            },
            'TOTALACTUA': { // Parcel data values
                'Low': '#FFD700',        // Bright yellow
                'Medium': '#FFA500',     // Orange
                'High': '#FF6347',       // Tomato red
                'Very High': '#DC143C'   // Crimson red
            }
        };
        
        console.log('GunnisonCountyMap Fixed Colors constructor called');
        this.init();
    }

    init() {
        console.log('Starting fixed colors map initialization...');
        
        try {
            // Initialize map with county-wide view
            console.log('Creating Leaflet map...');
            this.map = L.map('map').setView([38.7, -106.9], 10);
            
            // Add OpenStreetMap tiles
            console.log('Adding OpenStreetMap tiles...');
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(this.map);
            
            // Load all data
            this.loadData();
            
        } catch (error) {
            console.error('Map initialization failed:', error);
            this.showDataError();
        }
    }

    async loadData() {
        console.log('Loading all data files...');
        
        try {
            // Load all data files in parallel
            const [propertyData, parcelsData, subdivisionData, addressData] = await Promise.all([
                this.loadPropertyData(),
                this.loadParcelsData(),
                this.loadSubdivisionData(),
                this.loadAddressData()
            ]);
            
            console.log('All data loaded successfully');
            console.log(`Property data: ${this.propertyData.size} records`);
            console.log(`Address data: ${this.addressData.size} records`);
            console.log(`Parcels: ${parcelsData.features.length} features`);
            console.log(`Subdivisions: ${subdivisionData.features.length} features`);
            
            // Add layers to map
            this.addSubdivisionLayer(subdivisionData);
            this.addParcelsLayer(parcelsData);
            this.addAddressLayer(addressData);
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Hide loading indicator
            document.getElementById('loading').classList.add('hidden');
            
            console.log('Fixed colors map initialization complete!');
            
        } catch (error) {
            console.error('Data loading failed:', error);
            this.showDataError();
        }
    }

    async loadPropertyData() {
        try {
            console.log('Loading property data...');
            const response = await fetch('./data/Property_Attributes_cleaned.csv');
            const csvText = await response.text();
            this.parsePropertyData(csvText);
            console.log(`Property data loaded: ${this.propertyData.size} records`);
            
            // Debug: Show sample property data
            console.log('Sample property data:');
            const sampleKeys = Array.from(this.propertyData.keys()).slice(0, 3);
            sampleKeys.forEach(key => {
                const prop = this.propertyData.get(key);
                console.log(`  ${key}: Quality=${prop['EXT CONDITION']}, View=${prop.ATTRIBUTESUBTYPE}, Value=${prop.SumOfACTUALVALUE}`);
            });
            
            return this.propertyData;
        } catch (error) {
            console.error('Failed to load property data:', error);
            return new Map();
        }
    }

    async loadParcelsData() {
        try {
            console.log('Loading parcels data...');
            // Try the fixed version first, fallback to original
            let response = await fetch('./data/Taxparcelassessor_fixed.geojson');
            if (!response.ok) {
                console.log('Fixed GeoJSON not found, using original...');
                response = await fetch('./data/Taxparcelassessor.geojson');
            }
            const parcelsData = await response.json();
            console.log(`Parcels data loaded: ${parcelsData.features.length} features`);
            return parcelsData;
        } catch (error) {
            console.error('Failed to load parcels data:', error);
            return { features: [] };
        }
    }

    async loadSubdivisionData() {
        try {
            console.log('Loading subdivision data...');
            const response = await fetch('./data/Subdivision.geojson');
            const subdivisionData = await response.json();
            console.log(`Subdivision data loaded: ${subdivisionData.features.length} features`);
            return subdivisionData;
        } catch (error) {
            console.error('Failed to load subdivision data:', error);
            return { features: [] };
        }
    }

    async loadAddressData() {
        try {
            console.log('Loading address data...');
            const response = await fetch('./data/Address.geojson');
            const addressData = await response.json();
            this.parseAddressData(addressData);
            console.log(`Address data loaded: ${this.addressData.size} records`);
            return addressData;
        } catch (error) {
            console.error('Failed to load address data:', error);
            return { features: [] };
        }
    }

    parseCSVLine(line) {
        // Proper CSV parsing that handles quoted fields with commas
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        // Add the last field
        result.push(current.trim());
        
        return result;
    }

    parsePropertyData(csvText) {
        console.log('Parsing property CSV data with proper CSV parsing...');
        const lines = csvText.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
            console.error('No data lines found in CSV');
            return;
        }
        
        // Parse header
        const headers = this.parseCSVLine(lines[0]);
        console.log('CSV Headers:', headers);
        console.log('Number of headers:', headers.length);
        
        // Parse data lines
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            
            if (values.length !== headers.length) {
                console.warn(`Line ${i+1}: Expected ${headers.length} columns, got ${values.length}`);
                console.warn(`Line content: ${lines[i]}`);
                continue;
            }
            
            const record = {};
            headers.forEach((header, index) => {
                record[header] = values[index] || '';
            });
            
            // Store by ACCOUNTNO for direct lookup
            if (record.ACCOUNTNO) {
                this.propertyData.set(record.ACCOUNTNO, record);
            }
        }
        
        console.log(`Parsed ${this.propertyData.size} property records`);
    }

    parseAddressData(addressData) {
        console.log('Parsing address data...');
        
        addressData.features.forEach(feature => {
            const props = feature.properties;
            if (props.ACCOUNTNO) {
                this.addressData.set(props.ACCOUNTNO, props);
            }
        });
        
        console.log(`Parsed ${this.addressData.size} address records`);
    }

    getParcelData(feature, accountField) {
        // Hybrid approach: try property data first, fallback to parcel data
        const parcelAccount = feature.properties[accountField];
        const propertyInfo = this.propertyData.get(parcelAccount);
        
        if (propertyInfo) {
            // Has property data - use it
            return {
                source: 'property',
                data: propertyInfo,
                account: parcelAccount
            };
        } else {
            // No property data - use parcel data
            const parcelData = feature.properties;
            return {
                source: 'parcel',
                data: {
                    ACCOUNTNO: parcelAccount,
                    SumOfACTUALVALUE: parcelData.TOTALACTUA || 0,
                    'EXT CONDITION': 'Unknown', // Parcel data doesn't have quality
                    ATTRIBUTESUBTYPE: 'Unknown', // Parcel data doesn't have view
                    SITUS: parcelData.PROPERTYLO || 'N/A',
                    SUBNAME: parcelData.SUBDIVISIO || 'N/A',
                    AYB: parcelData.TAXYEAR || 'N/A'
                },
                account: parcelAccount
            };
        }
    }

    addSubdivisionLayer(subdivisionData) {
        console.log('Adding subdivision layer...');
        
        if (subdivisionData.features.length === 0) {
            console.log('No subdivision data to display');
            return;
        }
        
        this.subdivisionLayer = L.geoJSON(subdivisionData, {
            style: {
                color: '#666666',
                weight: 1,
                fillColor: 'transparent',
                fillOpacity: 0.1
            }
        }).addTo(this.map);
        
        console.log('Subdivision layer added successfully');
    }

    addParcelsLayer(parcelsData) {
        console.log('Adding parcels layer...');
        
        if (parcelsData.features.length === 0) {
            console.log('No parcels data to display');
            return;
        }
        
        // Find the account field dynamically
        const firstFeature = parcelsData.features[0];
        const accountField = Object.keys(firstFeature.properties).find(field => 
            ['ACCOUNTNO', 'ACCOUNTNUM', 'ACCOUNT', 'ACCTNO', 'ACCT_NUM'].includes(field)
        );
        
        console.log('Using account field:', accountField);
        
        // Count matches for debugging
        let propertyMatches = 0;
        let parcelMatches = 0;
        let noMatches = 0;
        let colorCounts = { 'ATTRIBUTESUBTYPE': {}, 'EXT CONDITION': {}, 'SumOfACTUALVALUE': {}, 'TOTALACTUA': {} };
        
        parcelsData.features.forEach(feature => {
            const parcelInfo = this.getParcelData(feature, accountField);
            
            if (parcelInfo.source === 'property') {
                propertyMatches++;
                
                // Count color categories
                if (parcelInfo.data.ATTRIBUTESUBTYPE) {
                    colorCounts['ATTRIBUTESUBTYPE'][parcelInfo.data.ATTRIBUTESUBTYPE] = (colorCounts['ATTRIBUTESUBTYPE'][parcelInfo.data.ATTRIBUTESUBTYPE] || 0) + 1;
                }
                if (parcelInfo.data['EXT CONDITION']) {
                    colorCounts['EXT CONDITION'][parcelInfo.data['EXT CONDITION']] = (colorCounts['EXT CONDITION'][parcelInfo.data['EXT CONDITION']] || 0) + 1;
                }
            } else if (parcelInfo.source === 'parcel') {
                parcelMatches++;
                
                // Count parcel value categories
                const value = parseFloat(parcelInfo.data.SumOfACTUALVALUE) || 0;
                let category = 'Low';
                if (value >= 800000) category = 'Very High';
                else if (value >= 400000) category = 'High';
                else if (value >= 200000) category = 'Medium';
                
                colorCounts['TOTALACTUA'][category] = (colorCounts['TOTALACTUA'][category] || 0) + 1;
            } else {
                noMatches++;
            }
        });
        
        console.log(`Hybrid matching: ${propertyMatches} property data, ${parcelMatches} parcel data, ${noMatches} no data`);
        console.log('Color category counts:', colorCounts);
        
        // Add layer with enhanced styling
        this.parcelsLayer = L.geoJSON(parcelsData, {
            style: (feature) => this.getParcelStyle(feature, accountField),
            onEachFeature: (feature, layer) => {
                this.addParcelInteractions(feature, layer, accountField);
            }
        }).addTo(this.map);
        
        console.log('Parcels layer added successfully');
    }

    addAddressLayer(addressData) {
        console.log('Adding address layer...');
        
        if (addressData.features.length === 0) {
            console.log('No address data to display');
            return;
        }
        
        // Add address points as small markers (hidden by default)
        this.addressLayer = L.geoJSON(addressData, {
            pointToLayer: (feature, latlng) => {
                return L.circleMarker(latlng, {
                    radius: 1,
                    color: '#FF6B6B',
                    fillColor: '#FF6B6B',
                    fillOpacity: 0.3,
                    weight: 0.5
                });
            },
            onEachFeature: (feature, layer) => {
                const props = feature.properties;
                layer.bindPopup(`
                    <strong>Address Point</strong><br>
                    Account: ${props.ACCOUNTNO || 'N/A'}<br>
                    Label: ${props.Label || 'N/A'}<br>
                    Vacant: ${props.Vacant || 'N/A'}
                `);
            }
        });
        
        // Don't add to map by default - user can toggle if needed
        console.log('Address layer created (hidden by default)');
    }

    getParcelStyle(feature, accountField) {
        const parcelInfo = this.getParcelData(feature, accountField);
        
        // For Quality and View Description, only show parcels that have that specific data
        if (this.colorBy === 'ATTRIBUTESUBTYPE' || this.colorBy === 'EXT CONDITION') {
            if (!parcelInfo || parcelInfo.source !== 'property') {
                // No property data - make completely transparent
                return {
                    color: 'transparent',
                    weight: 0,
                    fillColor: 'transparent',
                    fillOpacity: 0
                };
            }
            
            const value = parcelInfo.data[this.colorBy];
            const scheme = this.colorSchemes[this.colorBy];
            
            if (!value || value === 'Unknown' || !scheme[value]) {
                // No data for this attribute - make completely transparent
                return {
                    color: 'transparent',
                    weight: 0,
                    fillColor: 'transparent',
                    fillOpacity: 0
                };
            }
            
            // Has data - show with color
            return {
                color: scheme[value],
                weight: 1,
                fillColor: scheme[value],
                fillOpacity: 0.8
            };
        }
        
        // For Total Value, use hybrid approach (property + parcel data)
        if (this.colorBy === 'SumOfACTUALVALUE' || this.colorBy === 'TOTALACTUA') {
            if (!parcelInfo) {
                return {
                    color: 'transparent',
                    weight: 0,
                    fillColor: 'transparent',
                    fillOpacity: 0
                };
            }
            
            const value = parseFloat(parcelInfo.data.SumOfACTUALVALUE) || 0;
            const scheme = this.colorSchemes[this.colorBy];
            
            if (value === 0) {
                // No value data - make transparent
                return {
                    color: 'transparent',
                    weight: 0,
                    fillColor: 'transparent',
                    fillOpacity: 0
                };
            }
            
            let color = scheme['Low']; // Default to Low
            if (value < 200000) color = scheme['Low'];
            else if (value < 400000) color = scheme['Medium'];
            else if (value < 800000) color = scheme['High'];
            else color = scheme['Very High'];
            
            return {
                color: color,
                weight: 1,
                fillColor: color,
                fillOpacity: 0.8
            };
        }
        
        // Fallback - transparent
        return {
            color: 'transparent',
            weight: 0,
            fillColor: 'transparent',
            fillOpacity: 0
        };
    }

    addParcelInteractions(feature, layer, accountField) {
        const parcelInfo = this.getParcelData(feature, accountField);
        const addressInfo = this.addressData.get(parcelInfo.account);
        
        // Tooltip on hover
        layer.bindTooltip(parcelInfo.account, {
            permanent: false,
            direction: 'center'
        });
        
        // Popup on click
        let popupContent = `<strong>Parcel Information</strong><br>`;
        popupContent += `Account: ${parcelInfo.account}<br>`;
        popupContent += `Parcel #: ${feature.properties.ParcelNumb || 'N/A'}<br>`;
        popupContent += `Owner: ${feature.properties.OWNERNAME || 'N/A'}<br>`;
        popupContent += `Property Location: ${feature.properties.PROPERTYLO || 'N/A'}<br>`;
        
        popupContent += `<br><strong>Property Data</strong><br>`;
        popupContent += `Data Source: ${parcelInfo.source}<br>`;
        popupContent += `Situs: ${parcelInfo.data.SITUS || 'N/A'}<br>`;
        popupContent += `Subdivision: ${parcelInfo.data.SUBNAME || 'N/A'}<br>`;
        
        if (parcelInfo.source === 'property') {
            popupContent += `View: ${parcelInfo.data.ATTRIBUTESUBTYPE || 'N/A'}<br>`;
            popupContent += `Quality: ${parcelInfo.data['EXT CONDITION'] || 'N/A'}<br>`;
        } else {
            popupContent += `View: ${parcelInfo.data.ATTRIBUTESUBTYPE || 'N/A'}<br>`;
            popupContent += `Quality: ${parcelInfo.data['EXT CONDITION'] || 'N/A'}<br>`;
        }
        
        popupContent += `Value: $${(parseFloat(parcelInfo.data.SumOfACTUALVALUE) || 0).toLocaleString()}<br>`;
        popupContent += `Year Built: ${parcelInfo.data.AYB || 'N/A'}<br>`;
        
        if (addressInfo) {
            popupContent += `<br><strong>Address Info</strong><br>`;
            popupContent += `Label: ${addressInfo.Label || 'N/A'}<br>`;
            popupContent += `Vacant: ${addressInfo.Vacant || 'N/A'}<br>`;
        }
        
        layer.bindPopup(popupContent);
    }

    setupEventListeners() {
        console.log('Setting up fixed colors event listeners...');
        
        // Color by dropdown
        const colorBySelect = document.getElementById('color-by');
        
        if (colorBySelect) {
            console.log('Color select element found');
            
            // Remove any existing listeners
            colorBySelect.removeEventListener('change', this.handleColorChange);
            
            // Add new listener
            this.handleColorChange = (e) => {
                console.log('Dropdown changed to:', e.target.value);
                this.colorBy = e.target.value;
                this.updateMapColors();
            };
            
            colorBySelect.addEventListener('change', this.handleColorChange);
            
            // Initial legend update
            this.updateLegend();
            console.log('Event listeners set up successfully');
        } else {
            console.error('⚠️ Color select element not found!');
        }
        
        // Add toggle for address layer (optional)
        this.addAddressToggle();
        
        // Add zoom controls
        this.addZoomControls();
    }

    addAddressToggle() {
        // Create a simple toggle button for address points
        const toggleButton = document.createElement('button');
        toggleButton.innerHTML = 'Show Address Points';
        toggleButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 1000;
            background: #224428;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        `;
        
        toggleButton.addEventListener('click', () => {
            if (this.map.hasLayer(this.addressLayer)) {
                this.map.removeLayer(this.addressLayer);
                toggleButton.innerHTML = 'Show Address Points';
            } else {
                this.map.addLayer(this.addressLayer);
                toggleButton.innerHTML = 'Hide Address Points';
            }
        });
        
        document.body.appendChild(toggleButton);
    }

    addZoomControls() {
        // Add zoom to Gunnison button
        const gunnisonButton = document.createElement('button');
        gunnisonButton.innerHTML = 'Zoom to Gunnison';
        gunnisonButton.style.cssText = `
            position: absolute;
            top: 50px;
            right: 10px;
            z-index: 1000;
            background: #224428;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        `;
        
        gunnisonButton.addEventListener('click', () => {
            this.map.setView([38.545, -106.925], 14);
        });
        
        document.body.appendChild(gunnisonButton);
        
        // Add zoom to Crested Butte button
        const cbButton = document.createElement('button');
        cbButton.innerHTML = 'Zoom to Crested Butte';
        cbButton.style.cssText = `
            position: absolute;
            top: 90px;
            right: 10px;
            z-index: 1000;
            background: #224428;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        `;
        
        cbButton.addEventListener('click', () => {
            this.map.setView([38.9, -106.97], 14);
        });
        
        document.body.appendChild(cbButton);
    }

    updateMapColors() {
        console.log('Updating map colors to:', this.colorBy);
        
        if (this.parcelsLayer) {
            // Get the account field from the first feature
            const firstLayer = this.parcelsLayer.getLayers()[0];
            if (firstLayer && firstLayer.feature) {
                const accountField = Object.keys(firstLayer.feature.properties).find(field => 
                    ['ACCOUNTNO', 'ACCOUNTNUM', 'ACCOUNT', 'ACCTNO', 'ACCT_NUM'].includes(field)
                );
                
                console.log('Using account field:', accountField);
                
                // Update the style of all layers
                this.parcelsLayer.setStyle((feature) => this.getParcelStyle(feature, accountField));
                this.updateLegend();
                console.log('Map colors updated successfully');
            } else {
                console.error('No features found in parcels layer');
            }
        } else {
            console.error('No parcels layer found');
        }
    }

    updateLegend() {
        const legendContent = document.getElementById('legend-content');
        const scheme = this.colorSchemes[this.colorBy];
        
        let legendHTML = '';
        
        if (this.colorBy === 'SumOfACTUALVALUE' || this.colorBy === 'TOTALACTUA') {
            legendHTML = `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${scheme['Low']}"></div>
                    <div class="legend-label">Low (&lt; $200K)</div>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${scheme['Medium']}"></div>
                    <div class="legend-label">Medium ($200K-$400K)</div>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${scheme['High']}"></div>
                    <div class="legend-label">High ($400K-$800K)</div>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${scheme['Very High']}"></div>
                    <div class="legend-label">Very High (&gt; $800K)</div>
                </div>
            `;
        } else {
            Object.entries(scheme).forEach(([key, color]) => {
                legendHTML += `
                    <div class="legend-item">
                        <div class="legend-color" style="background-color: ${color}"></div>
                        <div class="legend-label">${key}</div>
                    </div>
                `;
            });
        }
        
        legendContent.innerHTML = legendHTML;
        console.log('Legend updated for:', this.colorBy);
    }

    showDataError() {
        console.error('Showing data error message');
        const loading = document.getElementById('loading');
        if (loading) {
            loading.innerHTML = '<p>⚠️ Data failed to load. Please check console for details.</p>';
        }
    }
}

// Wait for Leaflet to load, then initialize the map
let leafletWaitCount = 0;
const maxLeafletWait = 30; // 3 seconds max wait

function waitForLeaflet() {
    if (typeof L !== 'undefined') {
        console.log('Leaflet loaded, initializing map...');
        new GunnisonCountyMap();
    } else if (leafletWaitCount < maxLeafletWait) {
        leafletWaitCount++;
        setTimeout(waitForLeaflet, 100);
    } else {
        console.error('Leaflet failed to load after 3 seconds');
        document.getElementById('loading').innerHTML = '<p>⚠️ Failed to load map library. Please refresh the page.</p>';
    }
}

// Start waiting for Leaflet when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking for Leaflet...');
    waitForLeaflet();
});
