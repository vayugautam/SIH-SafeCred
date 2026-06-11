import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Image as ImageIcon, Download, Target, MapPin, AlertTriangle, ChevronDown 
} from 'lucide-react';
import html2canvas from 'html2canvas';

// =========================================================================
// MOCK DATA
// =========================================================================

const mockGeoJSON: any = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Pune", state: "MH", band: "B", avgCCS: 680, disbursal: 85, completeness: 90 },
      geometry: { type: "Polygon", coordinates: [[[73, 18], [74, 18], [74, 19], [73, 19], [73, 18]]] }
    },
    {
      type: "Feature",
      properties: { name: "Lucknow", state: "UP", band: "D", avgCCS: 420, disbursal: 45, completeness: 60 },
      geometry: { type: "Polygon", coordinates: [[[80, 26], [81, 26], [81, 27], [80, 27], [80, 26]]] }
    },
    {
      type: "Feature",
      properties: { name: "Bhopal", state: "MP", band: "C", avgCCS: 550, disbursal: 60, completeness: 75 },
      geometry: { type: "Polygon", coordinates: [[[77, 23], [78, 23], [78, 24], [77, 24], [77, 23]]] }
    }
  ]
};

const topDistricts = [
  { name: 'Pune, MH', score: 710 },
  { name: 'Bengaluru, KA', score: 695 },
  { name: 'Mumbai, MH', score: 680 },
  { name: 'Hyderabad, TS', score: 675 },
  { name: 'Ahmedabad, GJ', score: 660 },
];

const worstDistricts = [
  { name: 'Gaya, BR', score: 280 },
  { name: 'Bastar, CG', score: 310 },
  { name: 'Malkangiri, OR', score: 315 },
  { name: 'Dhubri, AS', score: 330 },
  { name: 'Kupwara, JK', score: 345 },
];

// =========================================================================
// MAP ZOOM CONTROLLER COMPONENT
// =========================================================================

const stateCoordinates: Record<string, { center: [number, number], zoom: number }> = {
  'ALL': { center: [22.5937, 78.9629], zoom: 5 },
  'MH': { center: [19.7515, 75.7139], zoom: 6 },
  'UP': { center: [26.8467, 80.9462], zoom: 6 },
  'MP': { center: [22.9734, 78.6569], zoom: 6 }
};

function MapUpdater({ selectedState }: { selectedState: string }) {
  const map = useMap();
  useEffect(() => {
    const coords = stateCoordinates[selectedState] || stateCoordinates['ALL'];
    map.setView(coords.center, coords.zoom, { animate: true, duration: 1.5 });
  }, [selectedState, map]);
  return null;
}

// =========================================================================
// MAP COMPONENT
// =========================================================================

export default function RiskHeatMapPage() {
  const [metric, setMetric] = useState<'band' | 'ccs' | 'disbursal' | 'completeness'>('band');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [showLabels, setShowLabels] = useState(true);
  const [showMarkers, setShowMarkers] = useState(false);
  const [showClusters, setShowClusters] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  const handleExportPNG = async () => {
    if (!mapRef.current) return;
    try {
      const canvas = await html2canvas(mapRef.current, { useCORS: true });
      const link = document.createElement('a');
      link.download = 'nbcfdc-risk-map.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to export map:', err);
    }
  };

  const resetZoom = () => {
    setSelectedState('ALL');
  };

  // Helper to color districts based on the selected metric
  const getFeatureStyle = (feature: any) => {
    let fillColor = '#CBD5E1'; // Default
    
    if (metric === 'band') {
      const b = feature.properties.band;
      if (b === 'A') fillColor = '#10B981'; // Emerald
      else if (b === 'B') fillColor = '#3B82F6'; // Blue
      else if (b === 'C') fillColor = '#D97706'; // Amber
      else if (b === 'D') fillColor = '#F97316'; // Orange
      else if (b === 'E') fillColor = '#EF4444'; // Red
    } else if (metric === 'ccs') {
      const c = feature.properties.avgCCS;
      fillColor = c > 600 ? '#10B981' : c > 450 ? '#D97706' : '#EF4444';
    } else if (metric === 'disbursal') {
      const d = feature.properties.disbursal;
      fillColor = d >= 80 ? '#10B981' : d >= 50 ? '#D97706' : '#EF4444';
    } else if (metric === 'completeness') {
      const c = feature.properties.completeness;
      fillColor = c >= 80 ? '#10B981' : c >= 60 ? '#D97706' : '#EF4444';
    }

    // Fade unselected state out slightly if a state is selected
    const isStateSelected = selectedState !== 'ALL' && feature.properties.state !== selectedState;

    return {
      fillColor,
      weight: 1,
      opacity: isStateSelected ? 0.2 : 1,
      color: 'white',
      fillOpacity: isStateSelected ? 0.1 : 0.7
    };
  };

  const getLegendContent = () => {
    if (metric === 'band') {
      return (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">Dominant Risk Band</h4>
          <LegendRow color="bg-emerald-500" label="Band A (Low Risk)" />
          <LegendRow color="bg-blue-500" label="Band B" />
          <LegendRow color="bg-amber-500" label="Band C" />
          <LegendRow color="bg-orange-500" label="Band D" />
          <LegendRow color="bg-red-500" label="Band E (High Risk)" />
        </div>
      );
    } else if (metric === 'ccs') {
      return (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">Average CCS</h4>
          <LegendRow color="bg-emerald-500" label="> 600 (Healthy)" />
          <LegendRow color="bg-amber-500" label="450 - 600 (Fair)" />
          <LegendRow color="bg-red-500" label="< 450 (Poor)" />
        </div>
      );
    } else if (metric === 'disbursal') {
      return (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">Disbursal Rate</h4>
          <LegendRow color="bg-emerald-500" label="> 80% (High)" />
          <LegendRow color="bg-amber-500" label="50% - 80% (Medium)" />
          <LegendRow color="bg-red-500" label="< 50% (Low)" />
        </div>
      );
    } else if (metric === 'completeness') {
      return (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">Data Completeness</h4>
          <LegendRow color="bg-emerald-500" label="> 80% (Excellent)" />
          <LegendRow color="bg-amber-500" label="60% - 80% (Adequate)" />
          <LegendRow color="bg-red-500" label="< 60% (Poor)" />
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] space-y-4 font-sans">
      
      {/* 1. TOP CONTROL BAR */}
      <div className="glass flex flex-col md:flex-row justify-between items-center p-5 rounded-2xl relative">
        
        {/* Metric Segmented Control */}
        <div className="flex bg-slate-200/50 p-1.5 rounded-xl border border-slate-200/50 backdrop-blur-sm shadow-inner">
          {[
            { id: 'band', label: 'Dominant Band' },
            { id: 'ccs', label: 'Average CCS' },
            { id: 'disbursal', label: 'Disbursal Rate' },
            { id: 'completeness', label: 'Data Completeness' }
          ].map(m => (
            <button 
              key={m.id}
              className={`px-5 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${metric === m.id ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
              onClick={() => setMetric(m.id as any)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 mt-4 md:mt-0">
          {/* State Dropdown */}
          <div className="relative group">
            <select 
              className="appearance-none bg-white border border-slate-200 rounded-xl pl-5 pr-12 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm cursor-pointer hover:border-slate-300 transition-colors"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
            >
              <option value="ALL">All States (India View)</option>
              <option value="MH">Maharashtra</option>
              <option value="UP">Uttar Pradesh</option>
              <option value="MP">Madhya Pradesh</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" />
          </div>

          <button onClick={handleExportPNG} className="flex items-center text-sm font-bold text-slate-700 bg-white border border-slate-200 px-5 py-2.5 rounded-xl hover:bg-slate-50 transition shadow-sm">
            <ImageIcon className="w-4 h-4 mr-2" /> Export Map
          </button>
          <button className="flex items-center text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-emerald-600/20 transition-all border border-transparent">
            <Download className="w-4 h-4 mr-2" /> Export Data
          </button>
        </div>
      </div>

      {/* 2. MAIN LAYOUT: MAP + SIDEBAR */}
      <div className="flex flex-1 gap-6 overflow-hidden">
        
        {/* MAP CONTAINER (Left / Main) */}
        <div className="flex-1 glass rounded-2xl relative flex flex-col overflow-hidden border border-slate-200" ref={mapRef}>
          
          <MapContainer 
            center={stateCoordinates['ALL'].center}
            zoom={stateCoordinates['ALL'].zoom}
            scrollWheelZoom={true}
            className="w-full h-full flex-1 z-0"
            zoomControl={false} // We will use custom placement if needed
          >
            <MapUpdater selectedState={selectedState} />
            {/* Using a light-themed generic tile layer for analytics map background */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            
            <GeoJSON 
              data={mockGeoJSON} 
              style={getFeatureStyle}
              onEachFeature={(feature, layer) => {
                layer.bindPopup(`
                  <div class="p-3 font-sans">
                    <strong class="text-base text-slate-800">${feature.properties.name}, ${feature.properties.state}</strong>
                    <div class="mt-3 space-y-1">
                      <div class="text-sm flex justify-between gap-4"><span class="text-slate-500 font-medium">Risk Band:</span> <strong class="text-slate-800">${feature.properties.band}</strong></div>
                      <div class="text-sm flex justify-between gap-4"><span class="text-slate-500 font-medium">Avg CCS:</span> <strong class="text-slate-800">${feature.properties.avgCCS}</strong></div>
                      <div class="text-sm flex justify-between gap-4"><span class="text-slate-500 font-medium">Disbursal:</span> <strong class="text-slate-800">${feature.properties.disbursal}%</strong></div>
                      <div class="text-sm flex justify-between gap-4"><span class="text-slate-500 font-medium">Data Completeness:</span> <strong class="text-slate-800">${feature.properties.completeness}%</strong></div>
                    </div>
                  </div>
                `);
              }}
            />
          </MapContainer>

          {/* OVERLAY: Color Legend */}
          <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-md p-5 rounded-xl shadow-lg border border-slate-200 z-10 min-w-[200px]">
            {getLegendContent()}
          </div>

          {/* OVERLAY: Layer Controls */}
          <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-200 z-10 flex flex-col gap-3">
            <label className="flex items-center text-sm font-bold text-slate-600 cursor-pointer hover:text-slate-800 transition">
              <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} className="mr-3 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              District Labels
            </label>
            <label className="flex items-center text-sm font-bold text-slate-600 cursor-pointer hover:text-slate-800 transition">
              <input type="checkbox" checked={showMarkers} onChange={(e) => setShowMarkers(e.target.checked)} className="mr-3 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              Disbursal Markers
            </label>
            <label className="flex items-center text-sm font-bold text-slate-600 cursor-pointer hover:text-slate-800 transition">
              <input type="checkbox" checked={showClusters} onChange={(e) => setShowClusters(e.target.checked)} className="mr-3 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              High-Risk Clusters
            </label>
          </div>

          {/* OVERLAY: Reset Zoom */}
          <button 
            onClick={resetZoom}
            className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-lg border border-slate-200 z-10 hover:bg-slate-50 transition-colors text-slate-700 flex items-center justify-center group"
            title="Reset Map View"
          >
            <Target className="w-5 h-5 group-hover:text-blue-600 transition-colors" />
          </button>
        </div>

        {/* STATS SIDEBAR (Right) */}
        <div className="w-[320px] glass rounded-2xl p-6 flex flex-col shrink-0 overflow-y-auto border border-slate-200">
          <h3 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-blue-600" /> Regional Analytics
          </h3>

          <div className="space-y-8">
            <div>
              <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3 flex justify-between items-center">
                <span>Top 5 Districts</span>
                <span>Avg CCS</span>
              </h4>
              <div className="space-y-3">
                {topDistricts.map((d, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 hover:bg-emerald-50 transition-colors">
                    <span className="text-sm font-bold text-slate-700">{i+1}. {d.name}</span>
                    <span className="text-sm font-extrabold text-emerald-700">{d.score}</span>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-slate-200" />

            <div>
              <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3 flex justify-between items-center">
                <span className="flex items-center text-red-600"><AlertTriangle className="w-4 h-4 mr-1.5"/> Action Needed</span>
                <span>Avg CCS</span>
              </h4>
              <div className="space-y-3">
                {worstDistricts.map((d, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-red-50/50 border border-red-100 hover:bg-red-50 transition-colors">
                    <span className="text-sm font-bold text-slate-700">{d.name}</span>
                    <span className="text-sm font-extrabold text-red-700">{d.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function LegendRow({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center text-sm font-bold text-slate-600">
      <div className={`w-4 h-4 rounded-md ${color} mr-3 shadow-inner border border-black/5`}></div>
      {label}
    </div>
  );
}
