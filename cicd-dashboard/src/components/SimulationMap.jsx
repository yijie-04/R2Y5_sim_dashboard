import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, GeoJSON, useMap } from 'react-leaflet';
import Papa from 'papaparse';
import L from 'leaflet';
import { Play, Pause } from 'lucide-react'; 
import 'leaflet/dist/leaflet.css';

import geoJsonData from '../map/mcity_geo.json'; 

const carIcon = L.divIcon({
  className: 'custom-car-icon',
  html: `<div style="width: 20px; height: 20px; background-color: #ef4444; border: 2px solid white; border-radius: 4px; box-shadow: 0 4px 6px rgba(0,0,0,0.5);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: false });
  }, [center, zoom, map]);
  return null;
}

export default function SimulationMap({ latCsv, lngCsv }) {
  const [pathData, setPathData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const requestRef = useRef();

  useEffect(() => {
    if (!latCsv || !lngCsv) return;

    Promise.all([
      fetch(latCsv).then(r => r.text()),
      fetch(lngCsv).then(r => r.text())
    ]).then(([latText, lngText]) => {
      const latData = Papa.parse(latText, { header: false, skipEmptyLines: true }).data;
      const lngData = Papa.parse(lngText, { header: false, skipEmptyLines: true }).data;

      // Merge assuming format: [Time, Value] -> row[1] is the data
      const merged = latData.map((row, i) => {
        const lngRow = lngData[i];
        if (!row || row.length < 2 || !lngRow || lngRow.length < 2) return null;

        return {
          lat: parseFloat(row[1]),
          lng: parseFloat(lngRow[1])
        };
      }).filter(p => p && !isNaN(p.lat) && !isNaN(p.lng));

      console.log(`Loaded ${merged.length} valid points.`);
      
      if (merged.length > 0) {
        setPathData(merged);
        setCurrentIndex(0);
      }
    }).catch(e => console.error("Data load error:", e));
  }, [latCsv, lngCsv]);

  const animate = () => {
    setCurrentIndex(prev => {
      if (prev >= pathData.length - 1) {
        setIsPlaying(false);
        return prev;
      }
      return prev + 1; 
    });
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isPlaying) requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying]);

  const currentPos = pathData.length > 0 
    ? pathData[currentIndex] 
    : { lat: 42.3, lng: -83.7 };

  const isGeoValid = geoJsonData && 
                     geoJsonData.type === "FeatureCollection" && 
                     geoJsonData.features && 
                     geoJsonData.features.length > 0;

  return (
    <div className="w-full h-full relative group bg-[#222]">
      <MapContainer 
        center={[currentPos.lat, currentPos.lng]} 
        zoom={18} 
        zoomControl={false}
        className="w-full h-full z-0"
        style={{ background: '#222' }}
      >
        <MapController center={[currentPos.lat, currentPos.lng]} zoom={18} />
        
        <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
        />

        {isGeoValid && (
          <GeoJSON 
             key="static-map-layer" 
             data={geoJsonData} 
             style={{ color: "#3388ff", weight: 2, opacity: 0.6 }}
          />
        )}

        {pathData.length > 0 && (
          <Marker position={[currentPos.lat, currentPos.lng]} icon={carIcon} />
        )}
      </MapContainer>

      <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-3 z-[500] flex items-center gap-3 backdrop-blur-sm transition-opacity duration-300 opacity-0 group-hover:opacity-100">
        
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="text-white hover:text-blue-400 flex items-center justify-center p-1"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause size={24} fill="currentColor" /> 
          ) : (
            <Play size={24} fill="currentColor" ml-1 /> 
          )}
        </button>
        
        <input
          type="range"
          min="0"
          max={Math.max(0, pathData.length - 1)}
          value={currentIndex}
          onChange={(e) => {
            setIsPlaying(false);
            setCurrentIndex(parseInt(e.target.value));
          }}
          className="flex-1 cursor-pointer accent-blue-500 h-1 bg-gray-600 rounded-lg appearance-none"
        />
        <span className="text-gray-300 text-xs w-10 text-right font-mono">{currentIndex}</span>
      </div>
    </div>
  );
}