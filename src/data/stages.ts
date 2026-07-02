import { formTemplates } from "./forms";
import type { Stage } from "@/types";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** Illustrative default connector bindings — freely editable from the Stage Builder afterward. */
const seedConnectorsByStageKey: Record<string, string[]> = {
  "pack-biochar-isometric::Production": ["connector-bc-modbus"],
  "pack-green-hydrogen::Setup": ["connector-gh-opcua"],
  "pack-green-hydrogen::Production": ["connector-gh-water-modbus", "connector-gh-grid-api"],
};

function deriveStages(): Stage[] {
  const stages: Stage[] = [];
  const indexByKey = new Map<string, number>();
  let sortOrder = 0;

  for (const form of formTemplates) {
    const key = `${form.domainPackId}::${form.category}`;
    let index = indexByKey.get(key);
    if (index === undefined) {
      index = stages.length;
      indexByKey.set(key, index);
      stages.push({
        id: `stage-${form.domainPackId.replace("pack-", "")}-${slugify(form.category)}`,
        domainPackId: form.domainPackId,
        name: form.category,
        sortOrder: sortOrder++,
        connectorIds: seedConnectorsByStageKey[key] ?? [],
        formTemplateIds: [],
      });
    }
    stages[index]!.formTemplateIds.push(form.id);
  }

  return stages;
}

export const stages: Stage[] = deriveStages();

export function getStagesByDomainPack(domainPackId: string): Stage[] {
  return stages.filter((stage) => stage.domainPackId === domainPackId).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getStage(id: string): Stage | undefined {
  return stages.find((stage) => stage.id === id);
}
