import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'; 
import osmtogeojson from 'osmtogeojson'; 
import 'leaflet/dist/leaflet.css';
import mapData from '../map/mcity.json'; 

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function OSMMap({ lat, lng, zoom }) {
  
  const geoJsonData = useMemo(() => {
    if (!mapData) return null;

    let converted = mapData;
    if (mapData.elements) {
        converted = osmtogeojson(mapData);
    } else if (mapData.data && mapData.data.elements) {
        converted = osmtogeojson(mapData.data);
    }

    if (converted && converted.features) {
        const cleanFeatures = converted.features.filter(feature => {
            return feature.geometry && feature.geometry.coordinates;
        });
        
        return {
            ...converted,
            features: cleanFeatures
        };
    }

    return converted;
  }, []);

  const isValid = geoJsonData && geoJsonData.type === "FeatureCollection" && geoJsonData.features.length > 0;

  return (
    <div className="w-full h-full z-0 bg-[#222]">
      <MapContainer 
        center={[lat, lng]} 
        zoom={zoom} 
        zoomSnap={0}
        style={{ height: "100%", width: "100%", background: '#222' }}
        zoomControl={false}
        scrollWheelZoom={true} 
      >
        <MapController center={[lat, lng]} zoom={zoom} />

        <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
        />

        {isValid ? (
          <GeoJSON 
             key="clean-map-layer" 
             data={geoJsonData} 
          />
        ) : null}
      </MapContainer>
    </div>
  );
}