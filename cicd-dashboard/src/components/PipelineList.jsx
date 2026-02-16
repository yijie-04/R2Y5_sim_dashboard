import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Bot, Loader2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { PIPELINE_DETAILS } from '../data/usePipelineData';
import { SCENARIOS } from '../data/scenarios';
import { fetchCommitDiff, fetchCommitDetails, fetchAITriage } from '../services/aiTriage';
import CleanMap from './CleanMap';
import OSMMap from './OSMMap';
import SimulationMap from './SimulationMap';

const StatusBadge = ({ status, value }) => {
  // For metrics: use value for display, status for color. For pipeline row: status is both.
  const displayText = value !== undefined ? value : status;
  const metricStatus = value !== undefined ? (status ?? 'neutral') : null;
  const colorClass = metricStatus
    ? metricStatus === 'good'
      ? 'text-green-600'
      : metricStatus === 'neutral'
        ? 'text-gray-600'
        : 'text-red-600'
    : (status === 'Pass' || status === 'good' || status === 'True')
      ? 'text-green-600'
      : 'text-red-600';
  return <span className={`text-sm ${colorClass}`}>{displayText}</span>;
};

export default function PipelineList({ pipelines }) {
  const [expandedId, setExpandedId] = useState(null);
  const [triageState, setTriageState] = useState({}); // { pipelineId: { loading, result, error } }
  const [scenarioByPipeline, setScenarioByPipeline] = useState({}); // { pipelineId: scenarioId }

  const toggleRow = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const runAITriage = async (pipeline, metrics) => {
    const id = pipeline.id;
    setTriageState((prev) => ({ ...prev, [id]: { loading: true, result: null, error: null } }));
    try {
      const [diff, commitDetails] = await Promise.all([
        pipeline.sha ? fetchCommitDiff(pipeline.sha) : null,
        pipeline.sha ? fetchCommitDetails(pipeline.sha) : null,
      ]);
      const result = await fetchAITriage(pipeline, diff, commitDetails, metrics);
      setTriageState((prev) => ({ ...prev, [id]: { loading: false, result, error: null } }));
    } catch (err) {
      setTriageState((prev) => ({
        ...prev,
        [id]: { loading: false, result: null, error: err.message || 'AI triage failed' },
      }));
    }
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
        const selectedScenario = scenarioByPipeline[p.id] || 'sce_1';
        const scenarioDetails = PIPELINE_DETAILS[selectedScenario] || PIPELINE_DETAILS.sce_1;
        const scenarioConfig = SCENARIOS.find((s) => s.id === selectedScenario) || SCENARIOS[0];
        // Pass pipeline: all scenarios show passed metrics. Fail pipeline: only sce_2 shows failed metrics.
        const isPipelineFailed = p.status === 'Fail';
        const useFailedMetrics = isPipelineFailed && selectedScenario === 'sce_2';
        const details = {
          ...scenarioDetails,
          generalMetrics: useFailedMetrics && scenarioDetails.generalMetricsFailed
            ? scenarioDetails.generalMetricsFailed
            : scenarioDetails.generalMetrics,
          controlMetrics: useFailedMetrics && scenarioDetails.controlMetricsFailed
            ? scenarioDetails.controlMetricsFailed
            : scenarioDetails.controlMetrics,
        };

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
                  value={selectedScenario}
                  onChange={(e) =>
                    setScenarioByPipeline(prev => ({
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

                  {/* LEFT: MAP SECTION with Scenario dropdown */}
                  <div className="w-full lg:w-1/3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Scenario</label>
                      <select
                        value={selectedScenario}
                        onChange={(e) => setScenarioByPipeline((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {SCENARIOS.map((s) => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="relative rounded-lg overflow-hidden border border-gray-300 bg-gray-200 aspect-square">
                      <SimulationMap 
                        latCsv={isPipelineFailed && scenarioConfig.latCsvFail ? scenarioConfig.latCsvFail : scenarioConfig.latCsv} 
                        lngCsv={isPipelineFailed && scenarioConfig.lngCsvFail ? scenarioConfig.lngCsvFail : scenarioConfig.lngCsv} 
                      />
                    </div>
                  </div>

                  {/* MIDDLE: GENERAL METRICS */}
                  <div className="flex-1">
                    <div className="bg-white p-4 rounded-lg shadow-sm h-full"> {/* Added h-full */}
                        <div className="mb-4 text-sm space-y-1">
                            <div className="font-semibold text-gray-900">Scenario Name: <span className="font-normal">{details.scenarioName}</span></div>
                            {/* ... rest of content ... */}
                        </div>

                        <h4 className="font-semibold text-gray-800 mb-3 text-sm">General Metrics</h4>
                        <div className="space-y-3">
                            {details.generalMetrics.map((m, i) => (
                                <div key={i} className="flex justify-between text-sm border-b border-gray-100 pb-2 last:border-0">
                                    <span className="text-gray-600">{m.label}</span>
                                    <StatusBadge value={m.value} status={m.status} />
                                </div>
                            ))}
                        </div>
                    </div>
                  </div>

                  {/* RIGHT: CONTROL METRICS & CHART */}
                  <div className="w-full lg:w-1/3 bg-white p-4 rounded-lg shadow-sm">
                     <h4 className="font-semibold text-gray-800 mb-3 text-sm">Planning and Control Metrics</h4>
                     <div className="space-y-3 mb-3">
                        {details.controlMetrics.map((m, i) => (
                            <div key={i} className="flex justify-between text-sm border-b border-gray-100 pb-2">
                                <span className="text-gray-600">{m.label}</span>
                                <StatusBadge value={m.value} status={m.status} />
                            </div>
                        ))}
                     </div>
                  </div>

                </div>

                {/* AI Triage Section - Full width */}
                <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                      <Bot size={18} className="text-blue-600" />
                      AI-Assisted Triage
                    </h4>
                    <button
                      onClick={() => runAITriage(p, details)}
                      disabled={triageState[p.id]?.loading}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {triageState[p.id]?.loading ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={14} />
                          {triageState[p.id]?.result ? 'Re-run Triage' : 'Run AI Triage'}
                        </>
                      )}
                    </button>
                  </div>
                  {triageState[p.id]?.error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                      {triageState[p.id].error}
                    </div>
                  )}
                  {triageState[p.id]?.result && (
                    <div className="p-4 text-sm text-gray-700 bg-gray-50 rounded-lg border border-gray-200 [&_strong]:font-semibold [&_code]:bg-black/10 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-black/10 [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4">
                      <ReactMarkdown>{triageState[p.id].result}</ReactMarkdown>
                    </div>
                  )}
                  {!triageState[p.id]?.result && !triageState[p.id]?.loading && !triageState[p.id]?.error && (
                    <p className="text-sm text-gray-500 italic">
                      Click &quot;Run AI Triage&quot; to send this pipeline&apos;s code diff and metrics to the LLM for analysis.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
