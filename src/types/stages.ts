export interface Stage {
  id: string;
  domainPackId: string;
  name: string;
  description?: string;
  sortOrder: number;
  /** SCADA/PLC/device connectors bound here purely for automation-status visibility on the stage card. */
  connectorIds: string[];
  /** Ordered forms captured within this stage. */
  formTemplateIds: string[];
}
