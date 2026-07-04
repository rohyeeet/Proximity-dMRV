/**
 * Read-side Prisma queries, deliberately named/shaped to match the static getters every page used
 * to import from "@/data" (getFormTemplate, getFlowTemplate, ...) — moving a page from mock data to
 * the database is largely just swapping the import source.
 */
import { prisma } from "@/lib/db";
import {
  toConnector,
  toDevice,
  toDomainPack,
  toFlowTemplate,
  toFormTemplate,
  toOrganization,
  toRole,
  toStage,
  toSubmission,
  toTelemetryStream,
  toUser,
  type FormCounts,
} from "@/lib/mappers";
import type {
  Connector,
  DomainPack,
  Device,
  FlowTemplate,
  FormFieldDefinition,
  FormTemplate,
  LinkFilter,
  Organization,
  Role,
  Stage,
  Submission,
  SubmissionAnswer,
  TelemetryStream,
  User,
} from "@/types";

/** Which of a form's fields actually reference another submission at runtime — the field types
 * `LinkedRecordPicker` resolves to a real record id, as opposed to a plain typed-in value. */
export function deriveLinkedSubmissionIds(fields: FormFieldDefinition[], answers: SubmissionAnswer[]): string[] {
  const linkFieldCodes = new Set(
    fields
      .filter((f) => f.fieldType === "linked_record" || (f.fieldType === "lookup_select" && f.lookupSource?.kind === "internal_form"))
      .map((f) => f.fieldCode)
  );
  return answers
    .filter((a) => linkFieldCodes.has(a.fieldCode) && typeof a.value === "string" && a.value.trim() !== "")
    .map((a) => a.value as string);
}

export async function getRole(id: string): Promise<Role | undefined> {
  const row = await prisma.role.findUnique({ where: { id } });
  return row ? toRole(row) : undefined;
}

export async function getUser(id: string): Promise<User | undefined> {
  const row = await prisma.user.findUnique({ where: { id } });
  return row ? toUser(row) : undefined;
}

export async function getDomainPack(id: string): Promise<DomainPack | undefined> {
  const row = await prisma.domainPack.findUnique({ where: { id } });
  return row ? toDomainPack(row) : undefined;
}

export async function getOrganization(id: string): Promise<Organization | undefined> {
  const row = await prisma.organization.findUnique({ where: { id } });
  return row ? toOrganization(row) : undefined;
}

export async function getStagesByDomainPack(domainPackId: string): Promise<Stage[]> {
  const rows = await prisma.stage.findMany({ where: { domainPackId }, orderBy: { sortOrder: "asc" } });
  return rows.map(toStage);
}

export async function getStage(id: string): Promise<Stage | undefined> {
  const row = await prisma.stage.findUnique({ where: { id } });
  return row ? toStage(row) : undefined;
}

/** Every stage across every domain pack — used once to hydrate the client Studio store (see (app)/layout.tsx). */
export async function getAllStages(): Promise<Stage[]> {
  const rows = await prisma.stage.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map(toStage);
}

export async function getFormCounts(formTemplateId: string): Promise<FormCounts> {
  const [submissionCount, needsCheckCount, needsFixCount] = await Promise.all([
    prisma.submission.count({ where: { formTemplateId, isTest: false } }),
    prisma.submission.count({ where: { formTemplateId, reviewStatus: "needs_check", isTest: false } }),
    prisma.submission.count({ where: { formTemplateId, reviewStatus: "needs_fix", isTest: false } }),
  ]);
  return { submissionCount, needsCheckCount, needsFixCount };
}

async function latestVersion(formTemplateId: string) {
  return prisma.formTemplateVersion.findFirst({ where: { formTemplateId }, orderBy: { versionNo: "desc" } });
}

/** Version-pinned lookup — used to render a submission's answers against the exact field set it was submitted under. */
export async function getFormTemplateVersionFields(formTemplateId: string, versionNo: number) {
  const version = await prisma.formTemplateVersion.findUnique({
    where: { formTemplateId_versionNo: { formTemplateId, versionNo } },
  });
  return version ? (version.fields as unknown as FormFieldDefinition[]) : undefined;
}

/** The version submitters actually fill out — real field data is only ever collected against
 * what's been published, never an in-progress draft. */
export async function getLatestPublishedVersion(formTemplateId: string) {
  return prisma.formTemplateVersion.findFirst({ where: { formTemplateId, status: "published" }, orderBy: { versionNo: "desc" } });
}

export async function getFormTemplatesByDomainPack(domainPackId: string): Promise<FormTemplate[]> {
  const rows = await prisma.formTemplate.findMany({ where: { domainPackId } });
  const results: FormTemplate[] = [];
  for (const row of rows) {
    const version = await latestVersion(row.id);
    if (!version) continue;
    const counts = await getFormCounts(row.id);
    results.push(toFormTemplate(row, version, counts));
  }
  return results;
}

export async function getFormTemplate(id: string): Promise<FormTemplate | undefined> {
  const row = await prisma.formTemplate.findUnique({ where: { id } });
  if (!row) return undefined;
  const version = await latestVersion(id);
  if (!version) return undefined;
  const counts = await getFormCounts(id);
  return toFormTemplate(row, version, counts);
}

/** Every form template across every domain pack — used once to hydrate the client Studio store. */
export async function getAllFormTemplates(): Promise<FormTemplate[]> {
  const rows = await prisma.formTemplate.findMany();
  const results: FormTemplate[] = [];
  for (const row of rows) {
    const version = await latestVersion(row.id);
    if (!version) continue;
    const counts = await getFormCounts(row.id);
    results.push(toFormTemplate(row, version, counts));
  }
  return results;
}

export async function getFlowTemplatesByDomainPack(domainPackId: string): Promise<FlowTemplate[]> {
  const rows = await prisma.flowTemplate.findMany({ where: { domainPackId } });
  return rows.map(toFlowTemplate);
}

export async function getFlowTemplate(id: string): Promise<FlowTemplate | undefined> {
  const row = await prisma.flowTemplate.findUnique({ where: { id } });
  return row ? toFlowTemplate(row) : undefined;
}

/** Every flow template across every domain pack — used once to hydrate the client Studio store. */
export async function getAllFlowTemplates(): Promise<FlowTemplate[]> {
  const rows = await prisma.flowTemplate.findMany();
  return rows.map(toFlowTemplate);
}

export async function getSubmissionsByForm(formTemplateId: string): Promise<Submission[]> {
  const rows = await prisma.submission.findMany({ where: { formTemplateId, isTest: false }, orderBy: { updatedAt: "desc" } });
  return rows.map(toSubmission);
}

export async function getTestSubmissionsByForm(formTemplateId: string): Promise<Submission[]> {
  const rows = await prisma.submission.findMany({ where: { formTemplateId, isTest: true }, orderBy: { updatedAt: "desc" } });
  return rows.map(toSubmission);
}

export async function getSubmission(id: string): Promise<Submission | undefined> {
  const row = await prisma.submission.findUnique({ where: { id } });
  return row ? toSubmission(row) : undefined;
}

/** A submitter's own submission history for the Collect app's "My submissions" list. */
export async function getSubmissionsByUser(userId: string): Promise<Submission[]> {
  const rows = await prisma.submission.findMany({ where: { submittedByUserId: userId, isTest: false }, orderBy: { updatedAt: "desc" } });
  return rows.map(toSubmission);
}

export interface LinkCandidate {
  id: string;
  displayId: string;
  summary: string;
}

function matchesFilter(submission: Submission, filter: LinkFilter): boolean {
  const answer = submission.answers.find((a) => a.fieldCode === filter.fieldCode);
  const value = String(answer?.value ?? "");
  switch (filter.operator) {
    case "equals":
      return value === filter.value;
    case "not_equals":
      return value !== filter.value;
    case "contains":
      return value.toLowerCase().includes(filter.value.toLowerCase());
  }
}

function summarizeAnswers(submission: Submission): string {
  const parts = submission.answers
    .filter((a) => a.value !== null && a.value !== undefined && String(a.value).trim() !== "")
    .slice(0, 2)
    .map((a) => String(a.value));
  return parts.join(" · ");
}

/**
 * Real candidates for a linked_record / internal-form lookup_select field — the runtime half of
 * the Studio-configured relationship (source form + optional value filter + optional exclusivity).
 * Scoped to the caller's own organization even though a domain pack can be shared by several orgs,
 * and (when requested) excludes anything already claimed by another submission's linkedSubmissionIds.
 */
export async function getLinkCandidates(params: {
  formTemplateId: string;
  organizationId: string;
  filter?: LinkFilter;
  excludeClaimed?: boolean;
}): Promise<LinkCandidate[]> {
  const { formTemplateId, organizationId, filter, excludeClaimed } = params;

  const rows = await prisma.submission.findMany({
    where: {
      formTemplateId,
      isTest: false,
      submittedBy: { memberships: { some: { organizationId, status: "active" } } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  let candidates = rows.map(toSubmission);

  if (filter) {
    candidates = candidates.filter((s) => matchesFilter(s, filter));
  }

  if (excludeClaimed && candidates.length > 0) {
    const claimed = await prisma.submission.findMany({
      where: { linkedSubmissionIds: { hasSome: candidates.map((c) => c.id) } },
      select: { linkedSubmissionIds: true },
    });
    const claimedIds = new Set(claimed.flatMap((c) => c.linkedSubmissionIds));
    candidates = candidates.filter((s) => !claimedIds.has(s.id));
  }

  return candidates.map((s) => ({ id: s.id, displayId: s.displayId, summary: summarizeAnswers(s) }));
}

export async function getConnectorsByOrganization(organizationId: string): Promise<Connector[]> {
  const rows = await prisma.connector.findMany({ where: { organizationId } });
  return rows.map(toConnector);
}

export async function getConnector(id: string): Promise<Connector | undefined> {
  const row = await prisma.connector.findUnique({ where: { id } });
  return row ? toConnector(row) : undefined;
}

export async function getDevicesByConnector(connectorId: string): Promise<Device[]> {
  const rows = await prisma.device.findMany({ where: { connectorId } });
  return rows.map(toDevice);
}

export async function getDevice(id: string): Promise<Device | undefined> {
  const row = await prisma.device.findUnique({ where: { id } });
  return row ? toDevice(row) : undefined;
}

export async function getTelemetryStreamsByDevice(deviceId: string): Promise<TelemetryStream[]> {
  const rows = await prisma.telemetryStream.findMany({ where: { deviceId } });
  return rows.map(toTelemetryStream);
}
