// src/data/usePipelineData.js

export const PIPELINE_DETAILS = {
  "100021": {
    scenarioName: "Green traffic light",
    ciLink: "www.gitlab.com",
    branch: "autopath",
    mapImage: "https://placehold.co/400x400/e2e8f0/94a3b8?text=Map+View", // TODO
    generalMetrics: [
      { label: "Collision count", value: "0", status: "neutral" },
      { label: "Traffic sign behaviour", value: "True", status: "good" },
      { label: "Destination reached", value: "True", status: "good" }
    ],
    controlMetrics: [
      { label: "Max solve time", value: "0.5s", status: "neutral" },
      { label: "Torque", value: "Pass", status: "good" },
      { label: "Steer", value: "Pass", status: "good" },
      { label: "Acceleration", value: "Pass", status: "good" }
    ],
    speedChart: [
      { time: 0, val: 0 }, { time: 2, val: 0 }, { time: 4, val: 20 },
      { time: 6, val: 22 }, { time: 8, val: 22 }, { time: 10, val: 23 },
      { time: 12, val: 10 }, { time: 14, val: 10 }
    ]
  }
};