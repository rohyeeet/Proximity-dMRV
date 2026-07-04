import { notFound } from "next/navigation";
import { getFormTemplate, getFormTemplateVersionFields, getSubmission, getUser } from "@/lib/queries";
import { RecordDetailClient } from "@/components/records/RecordDetailClient";

export default async function RecordDetailPage({ params }: { params: Promise<{ formId: string; recordId: string }> }) {
  const { formId, recordId } = await params;
  const [form, submission] = await Promise.all([getFormTemplate(formId), getSubmission(recordId)]);
  if (!form || !submission || submission.formTemplateId !== formId) notFound();
  const [submitter, pinnedFields] = await Promise.all([
    getUser(submission.submittedByUserId),
    getFormTemplateVersionFields(formId, submission.formTemplateVersionNo),
  ]);

  const fields = pinnedFields ?? form.currentVersion.fields;
  const linkFieldCodes = new Set(
    fields.filter((f) => f.fieldType === "linked_record" || (f.fieldType === "lookup_select" && f.lookupSource?.kind === "internal_form")).map((f) => f.fieldCode)
  );
  const linkedIds = submission.answers
    .filter((a) => linkFieldCodes.has(a.fieldCode) && typeof a.value === "string" && a.value)
    .map((a) => a.value as string);
  const linkedSubmissions = await Promise.all(linkedIds.map((id) => getSubmission(id)));
  const linkedRecordsById = Object.fromEntries(
    linkedSubmissions.filter((s) => s !== undefined).map((s) => [s!.id, { formTemplateId: s!.formTemplateId, displayId: s!.displayId }])
  );

  return (
    <RecordDetailClient
      form={form}
      fields={fields}
      isStaleVersion={submission.formTemplateVersionNo !== form.currentVersion.versionNo}
      submission={submission}
      submitterName={submitter?.fullName ?? "Unknown"}
      linkedRecordsById={linkedRecordsById}
    />
  );
}
