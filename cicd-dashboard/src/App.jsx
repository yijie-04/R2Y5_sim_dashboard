import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Clock, CheckCircle, Search, User } from 'lucide-react';

// --- CONFIGURATION ---
const GITLAB_API = "https://gitlab.com/api/v4";
const PROJECT_ID = import.meta.env.VITE_GITLAB_PROJECT_ID; 
const TOKEN = import.meta.env.VITE_GITLAB_TOKEN;

// --- MOCK DATA (Replace this later with API calls) ---
const mockPipelineData = [
  { date: '1', count: 5 }, { date: '5', count: 8 }, { date: '10', count: 12 },
  { date: '15', count: 25 }, { date: '20', count: 35 }, { date: '25', count: 30 },
  { date: '30', count: 55 },
];

const mockComputeData = [
  { month: 'Jan', mins: 50 }, { month: 'Feb', mins: 55 }, { month: 'Mar', mins: 50 },
  { month: 'Apr', mins: 48 }, { month: 'May', mins: 60 }, { month: 'Jun', mins: 70 },
  { month: 'Jul', mins: 60 }, { month: 'Aug', mins: 65 }, { month: 'Sep', mins: 55 },
  { month: 'Oct', mins: 50 }, { month: 'Nov', mins: 48 }, { month: 'Dec', mins: 30 },
];

const mockPipelines = [
  { id: '100021', time: 23, status: 'Pass' },
  { id: '100023', time: 21, status: 'Fail' },
  { id: '100025', time: 20, status: 'Fail' },
  { id: '100012', time: 19, status: 'Fail' },
];

// --- COMPONENTS ---

// Top Metric Card
const MetricCard = ({ title, value, subtext }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
    <h3 className="text-sm font-semibold text-gray-500 mb-2">{title}</h3>
    <div className="text-4xl font-bold text-gray-900 mb-2">{value}</div>
    <div className="text-sm text-gray-400">{subtext}</div>
  </div>
);

// Main Dashboard Layout
export default function Dashboard() {
  // In a real app, you would fetch data here
  const [metrics, setMetrics] = useState({
    totalRuns: 45,
    passRate: '35%',
    avgRuntime: '20'
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">aUToronto Simulation Dashboard</h1>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-10 pr-4 py-2 border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium">Share</button>
        </div>
      </header>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <MetricCard title="Total Scenarios Run" value={metrics.totalRuns} subtext="+20% month over month" />
        <MetricCard title="Pass Rate" value={metrics.passRate} subtext="+33% month over month" />
        <MetricCard title="Runtime per pipeline (mins)" value={metrics.avgRuntime} subtext="-8% month over month" />
      </div>

      {/* Middle Section: Line Chart & Contributors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-semibold mb-6">Scenarios</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockPipelineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="black" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Contributors (Static List) */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-semibold mb-4">Contributors</h3>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 mb-4 last:mb-0">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User size={20} className="text-gray-500"/>
              </div>
              <div>
                <div className="text-sm font-medium">Contributor Name</div>
                <div className="text-xs text-gray-500">email@example.com</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section: Pipelines List & Compute Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipelines List */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-semibold mb-4">Pipelines</h3>
          <table className="w-full text-sm text-left">
            <thead className="text-gray-500 border-b">
              <tr>
                <th className="pb-2 font-normal">ID</th>
                <th className="pb-2 font-normal text-right">Time</th>
                <th className="pb-2 font-normal text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockPipelines.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-3 font-medium">{p.id}</td>
                  <td className="py-3 text-right">{p.time}</td>
                  <td className={`py-3 text-right ${p.status === 'Pass' ? 'text-green-600' : 'text-red-600'}`}>
                    {p.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Compute Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-semibold mb-6">Compute Usage</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockComputeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="mins" fill="black" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}