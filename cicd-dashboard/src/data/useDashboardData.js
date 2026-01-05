// src/data/useDashboardData.js 
import { useState, useEffect } from 'react';

const GITLAB_API = "https://gitlab.com/api/v4";
const PROJECT_ID = import.meta.env.VITE_GITLAB_PROJECT_ID; 
const TOKEN = import.meta.env.VITE_GITLAB_TOKEN;

function getDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString(); // Returns "2025-12-04T10:00:00.000Z"
}

const getSeconds = (start, end) => {
  if (!start || !end) return 0;
  return (new Date(end) - new Date(start)) / 1000;
};

export function useDashboardData(days, branch='All') {
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
        // Check if environment variables are configured
        if (!PROJECT_ID || !TOKEN) {
          throw new Error(
            'GitLab credentials not configured. ' +
            (import.meta.env.DEV 
              ? 'Please create a .env file with VITE_GITLAB_PROJECT_ID and VITE_GITLAB_TOKEN.' 
              : 'Please contact the administrator to configure GitHub repository secrets.')
          );
        }

        const headers = { "PRIVATE-TOKEN": TOKEN };
        const daysquery = getDateDaysAgo(days || 90);

        let pipelineUrl = `${GITLAB_API}/projects/${PROJECT_ID}/pipelines?per_page=100&scope=finished&created_after=${daysquery}`;
        if (branch && branch !== 'All') {
            pipelineUrl += `&ref=${branch}`;
        }

        const pipeRes = await fetch(pipelineUrl, { headers });

        const commitRef = (branch && branch !== 'All') ? branch : 'master';

        const commitsRes = await fetch(
          `${GITLAB_API}/projects/${PROJECT_ID}/repository/commits?created_after=${daysquery}&per_page=100&ref_name=${commitRef}`, 
          { headers }
        );
        
        // const contribRes = await fetch(
        //   `${GITLAB_API}/projects/${PROJECT_ID}/repository/contributors`,
        //   { headers }
        // );

        // const contribRes = await fetch(
        //   `${GITLAB_API}/projects/${PROJECT_ID}/repository/contributors?order_by=commits&sort=desc`,
        //   { headers }
        // );

        const rawCommits = commitsRes.ok ? await commitsRes.json() : [];
        console.log("Fetched Commits:", rawCommits);

        const authorStats = {};

        rawCommits.forEach(commit => {
            console.log(commit);
            const email = commit.author_email;
            const name = commit.author_name;

            if (!authorStats[email]) {
                authorStats[email] = { name: name, email: email, count: 0 };
            }
            authorStats[email].count += 1;
        });

        const topContributors = Object.values(authorStats)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

        if (!pipeRes.ok) throw new Error("Failed to fetch pipelines. Check ID/Token.");
        
        const rawPipelines = await pipeRes.json();
        // const rawContributors = contribRes.ok ? await contribRes.json() : [];

        const processedPipelines = rawPipelines.map(p => {
            let runSeconds = p.duration;
            if (!runSeconds && p.started_at && p.updated_at) {
                runSeconds = getSeconds(p.started_at, p.updated_at);
            }
            if (!runSeconds && p.created_at && p.updated_at) {
                runSeconds = getSeconds(p.created_at, p.updated_at);
            }
            let queueSeconds = 0;
            if (p.created_at && p.started_at) {
                queueSeconds = getSeconds(p.created_at, p.started_at);
            }

            // console.log(`Pipeline #${p.id} - Duration: ${runSeconds}s, Queue: ${queueSeconds}s`);

            return {
                ...p,
                durationSeconds: runSeconds || 0,
                queueSeconds: queueSeconds || 0
            };
            });

        // Metrics
        const total = rawPipelines.length;
        const successCount = rawPipelines.filter(p => p.status === 'success').length;
        const passRate = total ? Math.round((successCount / total) * 100) + '%' : '0%';
        
        const validRuns = processedPipelines.filter(p => p.durationSeconds > 300 && p.durationSeconds < 3600); // Ignore runs < 1 min (noise)
        const totalSeconds = validRuns.reduce((acc, p) => acc + p.durationSeconds, 0);
        const avgTime = validRuns.length 
            ? Math.round((totalSeconds / validRuns.length) / 60) 
            : 0;
        
        console.log(`Computed Metrics - Total: ${total}, Pass Rate: ${passRate}, Avg Time: ${avgTime} mins`);
        const formattedPipelines = processedPipelines
            .filter(p => p.durationSeconds <= 3600) 
            .slice(0, 7)
            .map(p => ({
                id: p.id,
                time: Math.round(p.durationSeconds / 60) + 'm',
                status: p.status === 'success' ? 'Pass' : 'Fail'
            }));
        
        // Scenarios Chart (Runs per Day)
        const dateMap = {};
        rawPipelines.forEach(p => {
          const date = p.created_at.split('T')[0].slice(5); // MM-DD
          dateMap[date] = (dateMap[date] || 0) + 1;
        });
        const chartArray = Object.keys(dateMap).map(date => ({ date, count: dateMap[date] })).reverse();

        // Update all state at once
        setData({
          metrics: { total, passRate, avgTime },
          pipelines: formattedPipelines,
          chartData: chartArray,
          contributors: topContributors
        });

        setLoading(false);

      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    }

    fetchData();
  }, [days, branch]);

  return { ...data, loading, error };
}