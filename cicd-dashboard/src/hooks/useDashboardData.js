// src/hooks/useDashboardData.js
import { useState, useEffect } from 'react';

const GITLAB_API = "https://gitlab.com/api/v4";
const PROJECT_ID = import.meta.env.VITE_GITLAB_PROJECT_ID; 
const TOKEN = import.meta.env.VITE_GITLAB_TOKEN;

function getDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString(); // Returns "2025-12-04T10:00:00.000Z"
}

export function useDashboardData(days) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [data, setData] = useState({
    metrics: { total: 0, passRate: '0%', avgTime: 0 },
    chartData: [],
    computeData: [],
    pipelines: [],
    contributors: []
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const headers = { "PRIVATE-TOKEN": TOKEN };
        const lastMonth = getDateDaysAgo(days || 90);
        
        const pipeRes = await fetch(
          `${GITLAB_API}/projects/${PROJECT_ID}/pipelines?per_page=100&scope=finished&updated_after=${lastMonth}`,
          { headers }
        );
        
        const contribRes = await fetch(
          `${GITLAB_API}/projects/${PROJECT_ID}/repository/contributors`,
          { headers }
        );

        if (!pipeRes.ok) throw new Error("Failed to fetch pipelines. Check ID/Token.");
        
        const rawPipelines = await pipeRes.json();
        const rawContributors = contribRes.ok ? await contribRes.json() : [];

        // Metrics
        const total = rawPipelines.length;
        const successCount = rawPipelines.filter(p => p.status === 'success').length;
        const passRate = total ? Math.round((successCount / total) * 100) + '%' : '0%';
        const totalDuration = rawPipelines.reduce((acc, p) => acc + (p.duration || 0), 0);
        const avgTime = total ? Math.round((totalDuration / total) / 60) : 0;

        // Pipeline List
        const formattedPipelines = rawPipelines.slice(0, 7).map(p => ({
          id: p.id,
          time: Math.round((p.duration || 0) / 60) + 'm',
          status: p.status === 'success' ? 'Pass' : 'Fail'
        }));

        // Scenarios Chart (Runs per Day)
        const dateMap = {};
        rawPipelines.forEach(p => {
          const date = p.created_at.split('T')[0].slice(5); // MM-DD
          dateMap[date] = (dateMap[date] || 0) + 1;
        });
        const chartArray = Object.keys(dateMap).map(date => ({ date, count: dateMap[date] })).reverse();

        // Compute Chart (Mins per Month)
        const monthMap = {};
        rawPipelines.forEach(p => {
          const date = new Date(p.created_at);
          const month = date.toLocaleString('default', { month: 'short' });
          const mins = Math.round((p.duration || 0) / 60);
          monthMap[month] = (monthMap[month] || 0) + mins;
        });
        const computeArray = Object.keys(monthMap).map(m => ({ month: m, mins: monthMap[m] }));

        // Update all state at once
        setData({
          metrics: { total, passRate, avgTime },
          pipelines: formattedPipelines,
          chartData: chartArray,
          computeData: computeArray,
          contributors: rawContributors.slice(0, 5)
        });

        setLoading(false);

      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    }

    fetchData();
  }, [days]);

  return { ...data, loading, error };
}