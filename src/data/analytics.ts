import type { AnalyticsCard, AnalyticsSeries } from "@/types";

export const analyticsCardsByOrg: Record<string, AnalyticsCard[]> = {
  "org-varaha-south": [
    { key: "flow_completion", label: "Flow completion", value: "74%", trend: "up", tone: "good" },
    { key: "returned_submissions", label: "Returned submissions", value: "5", trend: "down", tone: "warn" },
    { key: "correction_turnaround", label: "Avg. correction turnaround", value: "1.8 days", tone: "neutral" },
    { key: "document_readiness", label: "Document readiness", value: "62%", tone: "warn" },
    { key: "device_uptime", label: "Device uptime (7d)", value: "96.4%", tone: "good" },
    { key: "blocked_steps", label: "Blocked steps (live)", value: "3", tone: "critical" },
  ],
  "org-novah2": [
    { key: "flow_completion", label: "Flow completion", value: "58%", trend: "up", tone: "good" },
    { key: "returned_submissions", label: "Returned submissions", value: "2", tone: "warn" },
    { key: "device_uptime", label: "Device uptime (7d)", value: "98.2%", tone: "good" },
    { key: "threshold_breaches", label: "Threshold breaches (7d)", value: "1", tone: "critical" },
    { key: "telemetry_coverage", label: "Telemetry coverage", value: "96%", tone: "good" },
    { key: "carbon_intensity", label: "Avg. carbon intensity", value: "3.1 kgCO₂e/kgH₂", tone: "good" },
  ],
};

export const analyticsSeriesByOrg: Record<string, AnalyticsSeries[]> = {
  "org-varaha-south": [
    {
      key: "submissions_per_week",
      label: "Submissions per week",
      points: [
        { period: "W1", value: 18 },
        { period: "W2", value: 24 },
        { period: "W3", value: 21 },
        { period: "W4", value: 29 },
        { period: "W5", value: 26 },
        { period: "W6", value: 31 },
      ],
    },
    {
      key: "correction_rate",
      label: "Correction rate (%)",
      unit: "%",
      points: [
        { period: "W1", value: 22 },
        { period: "W2", value: 19 },
        { period: "W3", value: 15 },
        { period: "W4", value: 12 },
        { period: "W5", value: 10 },
        { period: "W6", value: 9 },
      ],
    },
  ],
  "org-novah2": [
    {
      key: "h2_output_kg",
      label: "H₂ output (kg/day)",
      unit: "kg",
      points: [
        { period: "Jun 24", value: 880 },
        { period: "Jun 25", value: 910 },
        { period: "Jun 26", value: 875 },
        { period: "Jun 27", value: 940 },
        { period: "Jun 28", value: 905 },
        { period: "Jun 29", value: 960 },
      ],
    },
    {
      key: "carbon_intensity_trend",
      label: "Carbon intensity (kgCO₂e/kgH₂)",
      unit: "kgCO₂e/kgH₂",
      points: [
        { period: "Jun 24", value: 3.6 },
        { period: "Jun 25", value: 3.4 },
        { period: "Jun 26", value: 3.5 },
        { period: "Jun 27", value: 3.2 },
        { period: "Jun 28", value: 3.1 },
        { period: "Jun 29", value: 3.0 },
      ],
    },
  ],
};
