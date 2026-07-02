export type ConnectorType = "internal_lookup" | "external_database" | "industrial_protocol";
export type IndustrialProtocol = "opc_ua" | "modbus" | "mqtt_sparkplug_b";

export interface Connector {
  id: string;
  organizationId: string;
  name: string;
  connectorType: ConnectorType;
  protocol?: IndustrialProtocol;
  status: "connected" | "degraded" | "disconnected";
  endpoint?: string;
}

export interface DeviceCalibration {
  certNumber: string;
  validFrom: string;
  validTo: string;
}

export interface TelemetryTag {
  externalRef: string;
  parameterCode: string;
  parameterLabel: string;
  unit: string;
  mapped: boolean;
  isNew?: boolean;
}

export interface Device {
  id: string;
  connectorId: string;
  name: string;
  externalRef: string;
  calibration?: DeviceCalibration;
  coveragePct: number;
  lastGapMinutes?: number;
  tags: TelemetryTag[];
}

export interface TelemetryPoint {
  timestamp: string;
  value: number;
}

export interface TelemetryStream {
  deviceId: string;
  parameterCode: string;
  unit: string;
  points: TelemetryPoint[];
  latestValue: number;
  thresholdHigh?: number;
}
