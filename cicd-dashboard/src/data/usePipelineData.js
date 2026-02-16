// src/data/usePipelineData.js
// Hardcoded metrics for each scenario

const baseMetrics = {
  generalMetrics: [
    { label: "Collision count", value: "0", status: "good" },
    { label: "Traffic sign behaviour", value: "True", status: "good" },
    { label: "Destination reached", value: "True", status: "good" },
    { label: "Path length (m)", value: "245", status: "neutral" },
    { label: "Completion time (s)", value: "60.2", status: "neutral" }
  ],
  generalMetricsFailed: [
    { label: "Collision count", value: "1", status: "bad" },
    { label: "Traffic sign behaviour", value: "False", status: "bad" },
    { label: "Destination reached", value: "False", status: "bad" },
    { label: "Path length (m)", value: "89", status: "neutral" },
    { label: "Completion time (s)", value: "23.4", status: "neutral" }
  ],
  controlMetrics: [
    { label: "Max solve time", value: "0.5s", status: "good" },
    { label: "Torque", value: "Pass", status: "good" },
    { label: "Steer", value: "Pass", status: "good" },
    { label: "Acceleration", value: "Pass", status: "good" },
  ],
  controlMetricsFailed: [
    { label: "Max solve time", value: "2.1s", status: "bad" },
    { label: "Torque", value: "Fail", status: "bad" },
    { label: "Steer", value: "Pass", status: "good" },
    { label: "Acceleration", value: "Fail", status: "bad" },
  ],
  speedChart: [
    { time: 0, val: 0 }, { time: 2, val: 0 }, { time: 4, val: 20 },
    { time: 6, val: 22 }, { time: 8, val: 22 }, { time: 10, val: 23 },
    { time: 12, val: 10 }, { time: 14, val: 10 }
  ]
};

export const PIPELINE_DETAILS = {
  sce_1: {
    scenarioName: "Scenario 1",
    ciLink: "www.gitlab.com",
    branch: "autopath",
    lat: 42.300805,
    lng: -83.698180,
    zoom: 16.7,
    ...baseMetrics
  },
  sce_2_fail: {
    scenarioName: "Scenario 2",
    ciLink: "www.gitlab.com",
    branch: "r2y5_simulation",
    lat: 42.300993,
    lng: -83.698180,
    zoom: 16.7,
    generalMetrics: baseMetrics.generalMetrics,
    generalMetricsFailed: baseMetrics.generalMetricsFailed,
    controlMetrics: baseMetrics.controlMetrics,
    controlMetricsFailed: baseMetrics.controlMetricsFailed,
    speedChart: baseMetrics.speedChart
  },
  sce_3: {
    scenarioName: "Scenario 3",
    ciLink: "www.gitlab.com",
    branch: "r2y5_simulation",
    lat: 42.299497,
    lng: -83.698180,
    zoom: 16.7,
    ...baseMetrics
  },
  sce_4: {
    scenarioName: "Scenario 4",
    ciLink: "www.gitlab.com",
    branch: "r2y5_simulation",
    lat: 42.299497,
    lng: -83.698180,
    zoom: 16.7,
    ...baseMetrics
  },
  sce_5: {
    scenarioName: "Scenario 5",
    ciLink: "www.gitlab.com",
    branch: "r2y5_simulation",
    lat: 42.299497,
    lng: -83.698180,
    zoom: 16.7,
    ...baseMetrics
  }
};

// Fallback for pipeline ID lookup (backward compatibility)
PIPELINE_DETAILS["100021"] = PIPELINE_DETAILS.sce_1;
