/**
 * Hardcoded failure example for LLM triage demo.
 * Used to prompt the AI Agent with a realistic pipeline failure scenario.
 */

export const FAILURE_EXAMPLE = {
  pipeline: {
    id: 100099,
    status: "Fail",
    time: "12m",
    ref: "r2y5_simulation",
    sha: "a1b2c3d4e5",
  },
  scenario: "Scenario 2 - 90° turn",
  generalMetrics: [
    { label: "Collision count", value: "1", status: "bad" },
    { label: "Traffic sign behaviour", value: "False", status: "bad" },
    { label: "Destination reached", value: "False", status: "bad" },
    { label: "Path length (m)", value: "89", status: "neutral" },
    { label: "Completion time (s)", value: "23.4", status: "neutral" },
  ],
  controlMetrics: [
    { label: "Max solve time", value: "2.1s", status: "bad" },
    { label: "Torque", value: "Fail", status: "bad" },
    { label: "Steer", value: "Pass", status: "good" },
    { label: "Acceleration", value: "Fail", status: "bad" },
  ],
  commitMessage: "tune: increase velocity_ref for faster traversal",
  author: "dev@utoronto.ca",
  codeDiff: `--- a/config/planner_config.yaml
+++ b/config/planner_config.yaml
@@ -12,7 +12,7 @@ planner:
   lookahead_distance: 15.0
   min_turning_radius: 4.5
 
-  velocity_ref: 8.0   # m/s
+  velocity_ref: 14.0  # m/s
   max_accel: 2.0
   max_decel: -3.0`,
};

/**
 * Build the prompt string sent to the LLM for triage
 */
export function buildFailureExamplePrompt() {
  const f = FAILURE_EXAMPLE;
  const generalStr = f.generalMetrics.map((m) => `  - ${m.label}: ${m.value}`).join("\n");
  const controlStr = f.controlMetrics.map((m) => `  - ${m.label}: ${m.value}`).join("\n");

  return `Please triage this failed pipeline run:

## Pipeline #${f.pipeline.id}
- Status: ${f.pipeline.status}
- Branch: ${f.pipeline.ref}
- Duration: ${f.pipeline.time}
- Commit SHA: ${f.pipeline.sha}
- Commit message: ${f.commitMessage}
- Author: ${f.author}

## Scenario
${f.scenario}

## General Metrics (Simulation Outcomes)
${generalStr}

## Planning and Control Metrics
${controlStr}

## Code Diff
\`\`\`diff
${f.codeDiff}
\`\`\`

Analyze the failure: what likely caused it, and what should the team do next?`;
}

export const TRIAGE_SYSTEM_PROMPT = `You are an expert CI/CD triage assistant for the aUToronto simulation team. Your job is to analyze pipeline runs and help engineers understand failures.

Given pipeline status, metrics, and code diff, provide:
1. A brief summary of what changed and what failed
2. Likely root causes
3. Suggested next steps and actionable recommendations

Be concise and technical. Use markdown for structure. Focus on simulation/autonomous driving context when relevant.`;
