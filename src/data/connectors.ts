import type { Connector, Device, TelemetryStream } from "@/types";

export const connectors: Connector[] = [
  {
    id: "connector-bc-modbus",
    organizationId: "org-varaha-south",
    name: "Chikmagalur Gasifier Modbus Link",
    connectorType: "industrial_protocol",
    protocol: "modbus",
    status: "connected",
    endpoint: "10.0.2.41:502",
  },
  {
    id: "connector-gh-opcua",
    organizationId: "org-novah2",
    name: "NovaH2 Electrolyzer OPC-UA Server",
    connectorType: "industrial_protocol",
    protocol: "opc_ua",
    status: "connected",
    endpoint: "opc.tcp://10.0.4.12:4840",
  },
  {
    id: "connector-gh-grid-api",
    organizationId: "org-novah2",
    name: "PPA Counterparty Generation API",
    connectorType: "external_database",
    status: "connected",
  },
  {
    id: "connector-gh-water-modbus",
    organizationId: "org-novah2",
    name: "Water Flow Meter Modbus Link",
    connectorType: "industrial_protocol",
    protocol: "modbus",
    status: "degraded",
    endpoint: "10.0.4.30:502",
  },
];

export const devices: Device[] = [
  {
    id: "device-bc-gasifier-1",
    connectorId: "connector-bc-modbus",
    name: "Gasifier Unit 1",
    externalRef: "40001",
    calibration: { certNumber: "CAL-2026-041", validFrom: "2026-01-10", validTo: "2027-01-10" },
    coveragePct: 96,
    lastGapMinutes: 11,
    tags: [
      { externalRef: "40001", parameterCode: "chamber_temp_c", parameterLabel: "Chamber Temperature", unit: "°C", mapped: true },
      { externalRef: "40002", parameterCode: "residence_time_min", parameterLabel: "Residence Time", unit: "min", mapped: true },
    ],
  },
  {
    id: "device-gh-stack-a1",
    connectorId: "connector-gh-opcua",
    name: "Electrolyzer Stack A1",
    externalRef: "ns=2;s=Stack-A1",
    calibration: { certNumber: "CAL-2026-014", validFrom: "2026-03-01", validTo: "2027-03-01" },
    coveragePct: 98,
    lastGapMinutes: 4,
    tags: [
      { externalRef: "Reactor-A1/Current", parameterCode: "stack_current_a", parameterLabel: "Stack Current", unit: "A", mapped: true },
      { externalRef: "Reactor-A1/Voltage", parameterCode: "stack_voltage_v", parameterLabel: "Stack Voltage", unit: "V", mapped: true },
      { externalRef: "Reactor-A1/Pressure", parameterCode: "stack_pressure_bar", parameterLabel: "Stack Pressure", unit: "bar", mapped: false, isNew: true },
    ],
  },
  {
    id: "device-gh-stack-a2",
    connectorId: "connector-gh-opcua",
    name: "Electrolyzer Stack A2",
    externalRef: "ns=2;s=Stack-A2",
    coveragePct: 91,
    lastGapMinutes: 34,
    tags: [
      { externalRef: "Reactor-A2/Current", parameterCode: "stack_current_a", parameterLabel: "Stack Current", unit: "A", mapped: true },
      { externalRef: "Reactor-A2/Voltage", parameterCode: "stack_voltage_v", parameterLabel: "Stack Voltage", unit: "V", mapped: true },
    ],
  },
  {
    id: "device-gh-smart-meter",
    connectorId: "connector-gh-grid-api",
    name: "Grid Smart Meter",
    externalRef: "meter-882",
    coveragePct: 100,
    tags: [{ externalRef: "meter-882/import", parameterCode: "grid_import_kwh", parameterLabel: "Grid Import", unit: "kWh", mapped: true }],
  },
  {
    id: "device-gh-water-meter",
    connectorId: "connector-gh-water-modbus",
    name: "Water Flow Meter",
    externalRef: "30011",
    coveragePct: 88,
    lastGapMinutes: 52,
    tags: [{ externalRef: "30011", parameterCode: "water_intake_m3", parameterLabel: "Water Intake", unit: "m³", mapped: true }],
  },
];

export const telemetryStreams: TelemetryStream[] = [
  {
    deviceId: "device-gh-stack-a1",
    parameterCode: "stack_current_a",
    unit: "A",
    latestValue: 1840,
    thresholdHigh: 2000,
    points: [
      { timestamp: "06:00", value: 1720 },
      { timestamp: "08:00", value: 1790 },
      { timestamp: "10:00", value: 1810 },
      { timestamp: "12:00", value: 1840 },
      { timestamp: "14:00", value: 1835 },
      { timestamp: "16:00", value: 1802 },
    ],
  },
  {
    deviceId: "device-bc-gasifier-1",
    parameterCode: "chamber_temp_c",
    unit: "°C",
    latestValue: 612,
    thresholdHigh: 650,
    points: [
      { timestamp: "06:00", value: 580 },
      { timestamp: "08:00", value: 601 },
      { timestamp: "10:00", value: 615 },
      { timestamp: "12:00", value: 612 },
      { timestamp: "14:00", value: 608 },
      { timestamp: "16:00", value: 612 },
    ],
  },
];

export function getDevicesByConnector(connectorId: string): Device[] {
  return devices.filter((device) => device.connectorId === connectorId);
}

export function getDevice(id: string): Device | undefined {
  return devices.find((device) => device.id === id);
}

export function getConnectorsByOrganization(organizationId: string): Connector[] {
  return connectors.filter((connector) => connector.organizationId === organizationId);
}

export function getConnector(id: string): Connector | undefined {
  return connectors.find((connector) => connector.id === id);
}
