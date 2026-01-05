import React, { useState } from 'react'; 
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Search, User, Loader2, Calendar } from 'lucide-react'; 
import { useDashboardData } from './data/useDashboardData';
import PipelineList from './components/PipelineList.jsx';

const MetricCard = ({ title, value, subtext }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
    <h3 className="text-sm font-semibold text-gray-500 mb-2">{title}</h3>
    <div className="text-4xl font-bold text-gray-900 mb-2">{value}</div>
    <div className="text-sm text-gray-400">{subtext}</div>
  </div>
);

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [selectedDays, setSelectedDays] = useState(90);
  const [selectedBranch, setSelectedBranch] = useState('All');
  const { metrics, chartData, pipelines, contributors, loading, error } = useDashboardData(selectedDays, selectedBranch);

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">

      {/* Loading / Error States */}
      {loading && (
        <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-3">
             <Loader2 className="animate-spin text-blue-600"/> 
             <span>Updating data...</span>
          </div>
        </div>
      )}
      
      {error && <div className="text-red-500 mb-4 p-4 bg-red-50 rounded">Error: {error}</div>}

      {/* Global Header with Interactive Dropdown */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">aUToronto Simulation Dashboard</h1>
        
        <div className="flex gap-4">
          {/* Branch Selector */}
          <div className="relative">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="6" y1="3" x2="6" y2="15"></line>
              <circle cx="18" cy="6" r="3"></circle>
              <circle cx="6" cy="18" r="3"></circle>
              <path d="M18 9a9 9 0 0 1-9 9"></path>
            </svg>
            <select 
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer hover:bg-gray-50"
            >
              <option value="All">All Branches</option>
              <option value="master">master</option>
              <option value="r2y5-simulation">r2y5-simulation</option>
              <option value="r2y5-sim-cicd">r2y5-sim-cicd</option>
              <option value="simulation-CICD">simulation-CICD</option>
            </select>
          </div>
          
          {/* DATE SELECTOR */}
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <select 
              value={selectedDays}
              onChange={(e) => setSelectedDays(Number(e.target.value))}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer hover:bg-gray-50"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 3 Months</option>
              <option value="365">Last Year</option>
            </select>
          </div>
        </div>
      </header>

      {/* TAB NAVIGATION */}
      <div className="bg-gray-100 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`
              px-4 py-1.5 text-sm font-medium rounded-md transition-all
              ${activeTab === 'dashboard'
                ? 'bg-white text-gray-900 shadow-sm'   // Active Style (White Pill)
                : 'text-gray-500 hover:text-gray-900'}  // Inactive Style
            `}
          >
            Simulation Metrics
          </button>

          <button
            onClick={() => setActiveTab('details')}
            className={`
              px-4 py-1.5 text-sm font-medium rounded-md transition-all
              ${activeTab === 'details'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'}
            `}
          >
            Individual Pipelines
          </button>
        </div>

      {/* --- TAB 1: SIMULATION METRICS --- */}
      {activeTab === 'dashboard' && (
        <>
          {/* Top Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 mt-8">
            <MetricCard title="Total Pipelines Run" value={metrics.total} subtext={`In the last ${selectedDays} days`} />
            <MetricCard title="Pass Rate" value={metrics.passRate} subtext="Success / Total" />
            <MetricCard title="Runtime per pipeline (mins)" value={metrics.avgTime} subtext="Average Duration" />
          </div>

          {/* Pipelines Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-semibold mb-6">Scenarios Trend</h3>
              <div className="h-64" style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="black" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Contributors List */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-semibold mb-4">Contributors</h3>
              {contributors.map((c, i) => (
                <div key={i} className="flex items-center gap-3 mb-4 last:mb-0">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                    {c.name ? c.name.charAt(0) : <User size={20}/>}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-sm font-medium truncate">{c.name}</div>
                    <div className="text-xs text-gray-500 truncate">{c.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Pipelines Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-semibold mb-4">Recent Pipelines</h3>
              <table className="w-full text-sm text-left">
                <thead className="text-gray-500 border-b">
                  <tr>
                    <th className="pb-2 font-normal">ID</th>
                    <th className="pb-2 font-normal text-right">Time</th>
                    <th className="pb-2 font-normal text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pipelines.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">#{p.id}</td>
                      <td className="py-3 text-right">{p.time}</td>
                      <td className={`py-3 text-right ${p.status === 'Pass' ? 'text-green-600' : 'text-red-600'}`}>
                        {p.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* --- TAB 2: INDIVIDUAL PIPELINES --- */}
      {activeTab === 'details' && (
        <div className="animate-fade-in mt-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Pipeline Runs ({pipelines.length})
            </h2>
            
            {/* 2. Use the component and pass the filtered pipelines */}
            <PipelineList pipelines={pipelines} />
        </div>
      )}

    </div>
  );
}