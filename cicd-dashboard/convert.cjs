const fs = require('fs');
const osmtogeojson = require('osmtogeojson');

const mapData = require('./src/map/mcity.json'); 

console.log('Converting...');

let converted = mapData;
if (mapData.elements) {
    converted = osmtogeojson(mapData);
} else if (mapData.data && mapData.data.elements) {
    converted = osmtogeojson(mapData.data);
}

const outputPath = './src/map/mcity.geojson';
fs.writeFileSync(outputPath, JSON.stringify(converted, null, 2));

console.log(`Success! GeoJSON saved to ${outputPath}`);