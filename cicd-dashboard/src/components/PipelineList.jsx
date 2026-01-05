import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Play, Pause } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { PIPELINE_DETAILS } from '../data/usePipelineData';

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

  const toggleRow = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header Row */}
      <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 text-sm font-medium text-gray-500">
        <div className="col-span-8">ID</div>
        <div className="col-span-2 text-right">Time</div>
        <div className="col-span-2 text-right">Status</div>
      </div>

      {/* Rows */}
      {pipelines.map((p) => {
        const isExpanded = expandedId === p.id;
        const details = PIPELINE_DETAILS["100021"] || PIPELINE_DETAILS["100021"]; // Fallback to mock data for demo

        return (
          <div key={p.id} className="border-b border-gray-100 last:border-0">
            
            {/* SUMMARY ROW */}
            <div 
              onClick={() => toggleRow(p.id)}
              className={`grid grid-cols-12 gap-4 p-4 cursor-pointer transition-colors hover:bg-gray-50 ${isExpanded ? 'bg-gray-50' : ''}`}
            >
              <div className="col-span-8 flex items-center gap-3 font-medium text-gray-900">
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {p.id}
              </div>
              <div className="col-span-2 text-right text-gray-600">{p.time}</div>
              <div className="col-span-2 text-right">
                <StatusBadge status={p.status} />
              </div>
            </div>

            {/* EXPANDED DETAILS PANEL */}
            {isExpanded && (
              <div className="bg-gray-100 p-6 border-t border-gray-200 shadow-inner">
                <div className="flex flex-col lg:flex-row gap-6">
                  
                  {/* LEFT: MAP & PLAYBACK */}
                  <div className="w-full lg:w-1/3 relative rounded-lg overflow-hidden border border-gray-300 bg-gray-200 aspect-square">
                    <img src={details.mapImage} alt="Sim Map" className="w-full h-full object-cover opacity-80" />
                    <div className="absolute bottom-4 left-4 flex gap-2">
                       <button className="bg-black/75 text-white p-2 rounded hover:bg-black"><Play size={16}/></button>
                    </div>
                  </div>

                  {/* MIDDLE: GENERAL METRICS */}
                  <div className="flex-1 space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="mb-4 text-sm space-y-1">
                            <div className="font-semibold text-gray-900">Scenario Name: <span className="font-normal">{details.scenarioName}</span></div>
                            <div className="font-semibold text-gray-900">Branch: <span className="font-normal">{details.branch}</span></div>
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
                     
                     {/* Mini Chart */}
                     <div className="h-24">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={details.speedChart}>
                                <Line type="monotone" dataKey="val" stroke="#000" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                        <div className="text-xs text-gray-400 text-center mt-1">Acceleration Profile</div>
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