import React from 'react';
import { MapContainer, TileLayer, Polygon, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Mock GeoJSON data for Delhi Districts
const delhiGeoJSON: any = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "New Delhi", riskLevel: "Low", defaultColor: "#22c55e", score: 720 },
      geometry: { type: "Polygon", coordinates: [[[77.15, 28.65], [77.25, 28.65], [77.25, 28.55], [77.15, 28.55], [77.15, 28.65]]] }
    },
    {
      type: "Feature",
      properties: { name: "North East Delhi", riskLevel: "High", defaultColor: "#ef4444", score: 410 },
      geometry: { type: "Polygon", coordinates: [[[77.25, 28.75], [77.35, 28.75], [77.35, 28.65], [77.25, 28.65], [77.25, 28.75]]] }
    },
    {
      type: "Feature",
      properties: { name: "South Delhi", riskLevel: "Medium", defaultColor: "#f59e0b", score: 580 },
      geometry: { type: "Polygon", coordinates: [[[77.15, 28.55], [77.25, 28.55], [77.25, 28.45], [77.15, 28.45], [77.15, 28.55]]] }
    }
  ]
};

const mapStyle = (feature: any) => {
  return {
    fillColor: feature.properties.defaultColor,
    weight: 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.6
  };
};

export const DistrictRiskMap = () => {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 h-[calc(100vh-8rem)]">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Geospatial Risk Map</h1>
        <p className="text-slate-500 mt-1">Macro-level credit risk distribution across districts.</p>
      </div>

      <div className="card flex-1 flex flex-col p-0 overflow-hidden relative border-4 border-white shadow-lg">
        
        {/* Map Legend Overlay */}
        <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur p-4 rounded-lg shadow-sm border border-slate-200">
          <h4 className="font-bold text-sm text-slate-800 mb-3">Risk Density</h4>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 rounded bg-safecred-success opacity-80"></div>
            <span className="text-xs text-slate-600">Low Risk (Band A/B)</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 rounded bg-safecred-warning opacity-80"></div>
            <span className="text-xs text-slate-600">Medium Risk (Band C)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-safecred-danger opacity-80"></div>
            <span className="text-xs text-slate-600">High Risk (Band D/E)</span>
          </div>
        </div>

        <MapContainer 
          center={[28.6139, 77.2090]} // Delhi Coordinates
          zoom={11} 
          style={{ height: '100%', width: '100%', zIndex: 1 }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {delhiGeoJSON.features.map((feature: any, idx: number) => {
            // Leaflet Polygons expect [lat, lng], but GeoJSON coordinates are [lng, lat]
            // For a single Polygon ring, coordinates[0] is the outer ring.
            const positions = feature.geometry.coordinates[0].map((coord: number[]) => [coord[1], coord[0]]);
            
            return (
              <Polygon
                key={idx}
                positions={positions}
                pathOptions={mapStyle(feature)}
                eventHandlers={{
                  mouseover: (e) => {
                    e.target.setStyle({ fillOpacity: 0.9, weight: 3 });
                  },
                  mouseout: (e) => {
                    e.target.setStyle({ fillOpacity: 0.6, weight: 2 });
                  }
                }}
              >
                <Tooltip sticky className="custom-tooltip">
                  <div className="p-1">
                    <h4 className="font-bold text-slate-800 mb-1">{feature.properties.name}</h4>
                    <p className="text-xs text-slate-500">Average Score: <span className="font-bold text-slate-800">{feature.properties.score}</span></p>
                    <p className="text-xs text-slate-500">Risk Level: <span className="font-bold text-safecred-danger">{feature.properties.riskLevel}</span></p>
                  </div>
                </Tooltip>
              </Polygon>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};
