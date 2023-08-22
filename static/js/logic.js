// Base street map layers
let basicMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

let topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

// Base layer
let mapInstance = L.map("map", {
    center: [38.50, -96.00],
    zoom: 3,
    layers: [topoLayer, basicMap]
});
basicMap.addTo(mapInstance);

let baseLayers = {
    "Basic Map": basicMap,
    Topography: topoLayer
};

// Add tectonic plate layer
let tectonicPlates = new L.LayerGroup();
let earthquakesLayer = new L.LayerGroup();
let layerOverlays = {
    "Tectonic Plates": tectonicPlates,
    Earthquakes: earthquakesLayer
};

// Add layers control to map
L.control.layers(baseLayers, layerOverlays).addTo(mapInstance);

// Fetch earthquake data and process
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson").then(function(data) {
    
    function styleInfo(feature) {
        return {
            opacity: 1,
            fillOpacity: 1,
            fillColor: getColorFromDepth(feature.geometry.coordinates[2]),
            color: "#000000",
            radius: getRadiusFromMagnitude(feature.properties.mag),
            stroke: true,
            weight: 0.5
        };
    }

    function getColorFromDepth(depth) {
        if (depth > 90) return "#ea2c2c";
        if (depth > 70) return "#ea822c";
        if (depth > 50) return "#ee9c00";
        if (depth > 30) return "#eecc00";
        if (depth > 10) return "#d4ee00";
        return "#98ee00";
    }

    function getRadiusFromMagnitude(magnitude) {
        return magnitude === 0 ? 1 : magnitude * 4;
    }

    L.geoJson(data, {
        pointToLayer: function(feature, latlng) {
            return L.circleMarker(latlng);
        },
        style: styleInfo,
        onEachFeature: function(feature, layer) {
            layer.bindPopup(
                `Magnitude: ${feature.properties.mag}<br>Depth: ${feature.geometry.coordinates[2]}<br>Location: ${feature.properties.place}`
            );
        }
    }).addTo(earthquakesLayer);
    earthquakesLayer.addTo(mapInstance);

    // Create and add legend
    let legend = L.control({ position: "bottomright" });
    legend.onAdd = function() {
        let div = L.DomUtil.create("div", "infoLegend");
        let magnitudes = [-10, 10, 30, 50, 70, 90];
        let colors = ["#98ee00", "#d4ee00", "#eecc00", "#ee9c00", "#ea822c", "#ea2c2c"];
        
        for (let i = 0; i < magnitudes.length; i++) {
            div.innerHTML += `
                <div>
                    <i style='background: ${colors[i]}'></i>
                    ${magnitudes[i]}${magnitudes[i + 1] ? `&ndash;${magnitudes[i + 1]}` : "+"}
                </div>`;
        }
        return div;
    };
    legend.addTo(mapInstance);

    // Fetch and render tectonic plates
    d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json").then(function(plateData) {
        L.geoJson(plateData, {
            color: "orange",
            weight: 2
        }).addTo(tectonicPlates);
        tectonicPlates.addTo(mapInstance);
    });
});
