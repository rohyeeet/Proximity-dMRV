export interface AnalyticsCard {
  key: string;
  label: string;
  value: string;
  trend?: "up" | "down" | "flat";
  tone?: "good" | "warn" | "critical" | "neutral";
}

export interface AnalyticsSeriesPoint {
  period: string;
  value: number;
}

export interface AnalyticsSeries {
  key: string;
  label: string;
  unit?: string;
  points: AnalyticsSeriesPoint[];
}
