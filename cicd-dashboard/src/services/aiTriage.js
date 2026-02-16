/**
 * AI Triage Service
 * Fetches pipeline context (code diff, metrics) and sends to locally-hosted LLM via cloudflared.
 */

const GITLAB_API = "https://gitlab.com/api/v4";
const PROJECT_ID = import.meta.env.VITE_GITLAB_PROJECT_ID;
const TOKEN = import.meta.env.VITE_GITLAB_TOKEN;
const LLM_URL = import.meta.env.VITE_LLM_URL;
const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL || "llama3";
// If VITE_LLM_URL is the full chat endpoint (e.g. https://xxx.trycloudflare.com/api/chat), use as-is.
// Otherwise append this path. Override via VITE_LLM_CHAT_PATH if your setup differs.
const CHAT_PATH = import.meta.env.VITE_LLM_CHAT_PATH || "/api/chat"; 

/**
 * Fetch full pipeline details (includes sha, ref) when list response is minimal
 */
export async function fetchPipelineDetails(pipelineId) {
  if (!PROJECT_ID || !TOKEN || !pipelineId) return null;
  try {
    const res = await fetch(
      `${GITLAB_API}/projects/${PROJECT_ID}/pipelines/${pipelineId}`,
      { headers: { "PRIVATE-TOKEN": TOKEN } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch pipeline details:", err);
    return null;
  }
}

/**
 * Fetch commit diff from GitLab for a pipeline's commit
 */
export async function fetchCommitDiff(sha) {
  if (!PROJECT_ID || !TOKEN || !sha) return null;
  try {
    const res = await fetch(
      `${GITLAB_API}/projects/${PROJECT_ID}/repository/commits/${sha}/diff`,
      { headers: { "PRIVATE-TOKEN": TOKEN } }
    );
    if (!res.ok) return null;
    const diffs = await res.json();
    return diffs.map((d) => `--- ${d.old_path}\n+++ ${d.new_path}\n${d.diff}`).join("\n\n");
  } catch (err) {
    console.error("Failed to fetch commit diff:", err);
    return null;
  }
}

/**
 * Fetch commit details (message, author) from GitLab
 */
export async function fetchCommitDetails(sha) {
  if (!PROJECT_ID || !TOKEN || !sha) return null;
  try {
    const res = await fetch(
      `${GITLAB_API}/projects/${PROJECT_ID}/repository/commits/${sha}`,
      { headers: { "PRIVATE-TOKEN": TOKEN } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch commit details:", err);
    return null;
  }
}

/**
 * Build triage context from pipeline, diff, commit details, and metrics
 */
function buildTriageContext(pipeline, diff, commitDetails, metrics) {
  const parts = [
    `## Pipeline #${pipeline.id}`,
    `- Status: ${pipeline.status}`,
    `- Branch: ${pipeline.ref || "unknown"}`,
    `- Duration: ${pipeline.time}`,
    `- Commit SHA: ${pipeline.sha?.slice(0, 8) || "unknown"}`,
    pipeline.created_at ? `- Created: ${pipeline.created_at}` : null,
  ].filter(Boolean);
  if (commitDetails) {
    parts.push(`- Commit message: ${commitDetails.title}`);
    if (commitDetails.message && commitDetails.message !== commitDetails.title) {
      parts.push(`- Full message: ${commitDetails.message}`);
    }
    parts.push(`- Author: ${commitDetails.author_name} <${commitDetails.author_email}>`);
  } else {
    parts.push("- Commit details: (not available - focus analysis on pipeline status and simulation metrics)");
  }
  if (metrics) {
    const generalStr = metrics.generalMetrics?.map((m) => `  - ${m.label}: ${m.value}`).join("\n") || "";
    const controlStr = metrics.controlMetrics?.map((m) => `  - ${m.label}: ${m.value}`).join("\n") || "";
    parts.push("\n## Simulation Metrics");
    if (generalStr) parts.push("\nGeneral:\n" + generalStr);
    if (controlStr) parts.push("\nControl:\n" + controlStr);
  }
  if (diff) {
    parts.push("\n## Code Diff\n```diff\n" + diff + "\n```");
  } else {
    parts.push("\n## Code Diff\n(Not available - analyze based on pipeline status and simulation metrics above)");
  }
  return parts.join("\n");
}

const TRIAGE_SYSTEM_PROMPT = `You are an expert CI/CD triage assistant for the aUToronto simulation team. Your job is to analyze pipeline runs and help engineers understand failures or successes.

You will receive pipeline context: status, branch, duration, simulation metrics, and optionally commit message and code diff. Analyze whatever is provided.

Always provide useful triage. Do NOT say "the pipeline run did not include" or refuse to analyze. Instead:
1. If commit/diff available: summarize changes and relate to the outcome
2. If only pipeline info and metrics: analyze based on status and simulation metrics (collision count, destination reached, control metrics, etc.)
3. If pipeline failed: suggest likely causes from the metrics and next steps
4. If pipeline passed: note any risks or observations from the metrics

Be concise and technical. Use clear section headers. Focus on simulation/autonomous driving context when relevant.`;

/**
 * Send pipeline context to LLM and return triage analysis
 */
export async function fetchAITriage(pipeline, diff, commitDetails, metrics) {
  const base = LLM_URL.replace(/\/$/, "");
  const chatUrl = base.includes("/api/") ? base : `${base}${CHAT_PATH.startsWith("/") ? "" : "/"}${CHAT_PATH}`;
  const context = buildTriageContext(pipeline, diff, commitDetails, metrics);
  const userMessage = `Please triage this pipeline run:\n\n${context}`;

  try {
    const res = await fetch(chatUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: "system", content: TRIAGE_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        stream: false,
      }),
    });

    if (!res.ok) {
      throw new Error(`LLM returned ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    // Ollama returns { message: { content: "..." } }
    return (
      data.message?.content ||
      data.content ||
      data.choices?.[0]?.message?.content ||
      (typeof data === "string" ? data : JSON.stringify(data))
    );
  } catch (err) {
    console.error("AI Triage error:", err);
    throw err;
  }
}
