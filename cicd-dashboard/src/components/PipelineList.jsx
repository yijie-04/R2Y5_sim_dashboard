import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Play } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { PIPELINE_DETAILS } from '../data/usePipelineData';
import SimulationMap from './SimulationMap';

const SCENARIOS = [  
  { id: 'urban_weather', label: 'Urban Left Turn Barrels – Weather Change' },
  { id: 'urban_day', label: 'Urban Left Turn Barrels – Day' },
  { id: 'urban_night', label: 'Urban Left Turn Barrels – Night' },
  { id: 'urban_rain', label: 'Urban Left Turn Barrels – Rain' },
  { id: 'urban_fog', label: 'Urban Left Turn Barrels – Fog' },  
  { id: 'highway_weather', label: 'Highway Lane Change – Weather Change' },
  { id: 'highway_day', label: 'Highway Lane Change – Day' },
  { id: 'highway_night', label: 'Highway Lane Change – Night' },
  { id: 'highway_merge', label: 'Highway Lane Change – Rain' },
  { id: 'highway_fog', label: 'Highway Lane Change – Fog' },  
  { id: 'pedestrian_weather', label: 'Pedestrian Crossing – Weather Change' },
  { id: 'pedestrian_day', label: 'Pedestrian Crossing – Day' },
  { id: 'pedestrian_night', label: 'Pedestrian Crossing – Night' },
  { id: 'pedestrian_rain', label: 'Pedestrian Crossing – Rain' },
  { id: 'pedestrian_fog', label: 'Pedestrian Crossing – Fog' },
  { id: 'urban_right_weather', label: 'Urban Right Turn – Weather Change' },
  { id: 'urban_right_day', label: 'Urban Right Turn – Day' },
  { id: 'urban_right_night', label: 'Urban Right Turn – Night' },
  { id: 'urban_right_rain', label: 'Urban Right Turn – Rain' },
  { id: 'urban_right_fog', label: 'Urban Right Turn – Fog' },
];

const StatusBadge = ({ status }) => {
  const isPass = status === 'Pass' || status === 'good' || status === 'True';
  return (
    <span className={`text-sm ${isPass ? 'text-green-600' : 'text-red-600'}`}>
      {status}
    </span>
  );
};

export default function PipelineList({ pipelines }) {
  const [expandedId, setExpandedId] = useState(null);

  // ✅ State for selected scenario per pipeline
  const [selectedScenario, setSelectedScenario] = useState({});

  const toggleRow = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

      {/* Header Row */}
      <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 text-sm font-medium text-gray-500">
        <div className="col-span-5">ID</div>
        <div className="col-span-2 text-right">Time</div>
        <div className="col-span-2 text-right">Status</div>
        <div className="col-span-3 text-right">Scenario</div> {/* Add header for dropdown */}
      </div>

      {/* Rows */}
      {pipelines.map((p) => {
        const isExpanded = expandedId === p.id;
        const details = PIPELINE_DETAILS[p.id] || PIPELINE_DETAILS["100021"]; // fallback mock data

        return (
          <div key={p.id} className="border-b border-gray-100 last:border-0">

            {/* SUMMARY ROW */}
            <div 
              onClick={() => toggleRow(p.id)}
              className={`grid grid-cols-12 gap-4 p-4 cursor-pointer transition-colors hover:bg-gray-50 ${isExpanded ? 'bg-gray-50' : ''}`}
            >
              <div className="col-span-5 flex items-center gap-3 font-medium text-gray-900">
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {p.id}
              </div>
              <div className="col-span-2 text-right text-gray-600">{p.time}</div>
              <div className="col-span-2 text-right">
                <StatusBadge status={p.status} />
              </div>

              {/* ✅ Scenario Dropdown */}
              <div className="col-span-3 text-right">
                <select
                  value={selectedScenario[p.id] || ''}
                  onChange={(e) =>
                    setSelectedScenario(prev => ({
                      ...prev,
                      [p.id]: e.target.value
                    }))
                  }
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()} // prevent row toggle on dropdown click
                >
                  <option value="" disabled>Select scenario</option>
                  {SCENARIOS.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* EXPANDED DETAILS PANEL */}
            {isExpanded && (
              <div className="bg-gray-100 p-6 border-t border-gray-200 shadow-inner">
                <div className="flex flex-col lg:flex-row gap-6">

                  {/* LEFT: MAP SECTION */}
                  <div className="w-full lg:w-1/3 relative rounded-lg overflow-hidden border border-gray-300 bg-gray-200 aspect-square">
                    <SimulationMap 
                      latCsv="./example/_new_lat_.csv" 
                      lngCsv="./example/_new_long_.csv" 
                    />
                  </div>

                  {/* MIDDLE: GENERAL METRICS */}
                  <div className="flex-1 space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="mb-4 text-sm space-y-1">
                        <div className="font-semibold text-gray-900">
                          Scenario Name: <span className="font-normal">{details.scenarioName}</span>
                        </div>
                        <div className="font-semibold text-gray-900">
                          Branch: <span className="font-normal">{details.branch}</span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-600 text-sm mt-1">
                          <ExternalLink size={12}/> <a href="#" className="hover:underline">View CI/CD Job</a>
                        </div>
                      </div>

                      <h4 className="font-semibold text-gray-800 mb-3 text-sm">General Metrics</h4>
                      <div className="space-y-3">
                        {details.generalMetrics.map((m, i) => (
                          <div key={i} className="flex justify-between text-sm border-b border-gray-100 pb-2 last:border-0">
                            <span className="text-gray-600">{m.label}</span>
                            <StatusBadge status={m.value} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: CONTROL METRICS & CHART */}
                  <div className="w-full lg:w-1/3 bg-white p-4 rounded-lg shadow-sm">
                     <h4 className="font-semibold text-gray-800 mb-3 text-sm">Planning and Control Metrics</h4>
                     <div className="space-y-3 mb-6">
                        {details.controlMetrics.map((m, i) => (
                            <div key={i} className="flex justify-between text-sm border-b border-gray-100 pb-2">
                                <span className="text-gray-600">{m.label}</span>
                                <StatusBadge status={m.value} />
                            </div>
                        ))}
                     </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
