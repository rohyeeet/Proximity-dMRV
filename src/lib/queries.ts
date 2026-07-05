/**
 * Read-side Prisma queries, deliberately named/shaped to match the static getters every page used
 * to import from "@/data" (getFormTemplate, getFlowTemplate, ...) — moving a page from mock data to
 * the database is largely just swapping the import source.
 */
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
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

/** Same as deriveLinkedSubmissionIds, restricted to fields the Studio setup actually marked
 * exclusive (linkedExclusive / lookupSource.excludeAlreadyLinked) — these are the ones that need a
 * real-time re-check at write time, not just at picker-list time, so two submitters can't both
 * claim the same upstream record. */
export function deriveExclusiveLinkedSubmissionIds(fields: FormFieldDefinition[], answers: SubmissionAnswer[]): string[] {
  const exclusiveFieldCodes = new Set(
    fields
      .filter(
        (f) =>
          (f.fieldType === "linked_record" && f.linkedExclusive) ||
          (f.fieldType === "lookup_select" && f.lookupSource?.kind === "internal_form" && f.lookupSource.excludeAlreadyLinked)
      )
      .map((f) => f.fieldCode)
  );
  return answers
    .filter((a) => exclusiveFieldCodes.has(a.fieldCode) && typeof a.value === "string" && a.value.trim() !== "")
    .map((a) => a.value as string);
}

export class LinkedRecordConflictError extends Error {
  constructor(public readonly conflictingIds: string[]) {
    super("One or more linked records have already been claimed by another submission.");
    this.name = "LinkedRecordConflictError";
  }
}

/** Must run inside the same transaction as the submission write it's guarding, at Serializable
 * isolation — a plain read-then-write has a gap where two concurrent submitters can both see a
 * record as unclaimed and both link it. Serializable makes Postgres itself abort one of the two
 * competing transactions (caught by the caller as a P2034 and surfaced as a 409) instead. */
export async function assertLinksStillAvailable(
  tx: Prisma.TransactionClient,
  exclusiveIds: string[],
  excludeSubmissionId?: string
): Promise<void> {
  if (exclusiveIds.length === 0) return;
  const claimants = await tx.submission.findMany({
    where: {
      linkedSubmissionIds: { hasSome: exclusiveIds },
      isTest: false,
      ...(excludeSubmissionId ? { id: { not: excludeSubmissionId } } : {}),
    },
    select: { linkedSubmissionIds: true },
  });
  const claimed = new Set(claimants.flatMap((c) => c.linkedSubmissionIds));
  const conflicts = exclusiveIds.filter((id) => claimed.has(id));
  if (conflicts.length > 0) throw new LinkedRecordConflictError(conflicts);
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

/** Every stage across the caller's own accessible domain packs — see getAllFormTemplates. */
export async function getAllStages(domainPackIds: string[]): Promise<Stage[]> {
  const rows = await prisma.stage.findMany({ where: { domainPackId: { in: domainPackIds } }, orderBy: { sortOrder: "asc" } });
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

/** Every form template across the caller's own accessible domain packs (their orgs' domain packs,
 * or literally every domain pack for a platform admin, by construction of the caller's org list) —
 * used once to hydrate the client Studio store. Never unscoped: a domain pack can be shared by
 * several organizations, but a form/flow/stage design is still that domain pack owner's IP and
 * must not leak to an org on a different domain pack. */
export async function getAllFormTemplates(domainPackIds: string[]): Promise<FormTemplate[]> {
  const rows = await prisma.formTemplate.findMany({ where: { domainPackId: { in: domainPackIds } } });
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

/** Every flow template across the caller's own accessible domain packs — see getAllFormTemplates. */
export async function getAllFlowTemplates(domainPackIds: string[]): Promise<FlowTemplate[]> {
  const rows = await prisma.flowTemplate.findMany({ where: { domainPackId: { in: domainPackIds } } });
  return rows.map(toFlowTemplate);
}

/**
 * A domain pack (and therefore a form) can be shared by several organizations, so a form's
 * submissions must always be scoped to the caller's own organization — never returned unscoped.
 * Capped at 1000 rows; a real paginated Records view is a reasonable follow-up once any single
 * org's history grows past that.
 */
export async function getSubmissionsByForm(formTemplateId: string, organizationId: string): Promise<Submission[]> {
  const rows = await prisma.submission.findMany({
    where: { formTemplateId, isTest: false, submittedBy: { memberships: { some: { organizationId, status: "active" } } } },
    orderBy: { updatedAt: "desc" },
    take: 1000,
  });
  return rows.map(toSubmission);
}

export async function getTestSubmissionsByForm(formTemplateId: string, organizationId: string): Promise<Submission[]> {
  const rows = await prisma.submission.findMany({
    where: { formTemplateId, isTest: true, submittedBy: { memberships: { some: { organizationId, status: "active" } } } },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  return rows.map(toSubmission);
}

export async function getSubmission(id: string): Promise<Submission | undefined> {
  const row = await prisma.submission.findUnique({ where: { id } });
  return row ? toSubmission(row) : undefined;
}

/** Filters a list of user ids down to the ones with active membership in organizationId — used to
 * verify a submission (identified by its submittedByUserId) actually belongs to the caller's org
 * before it's shown, since `getSubmission` itself is org-unaware (it's also used org-safely inside
 * already-scoped flows like resubmit, which separately checks ownership). */
export async function filterUserIdsByOrganization(userIds: string[], organizationId: string): Promise<Set<string>> {
  const uniqueIds = [...new Set(userIds)];
  if (uniqueIds.length === 0) return new Set();
  const memberships = await prisma.orgMembership.findMany({
    where: { userId: { in: uniqueIds }, organizationId, status: "active" },
    select: { userId: true },
  });
  return new Set(memberships.map((m) => m.userId));
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
