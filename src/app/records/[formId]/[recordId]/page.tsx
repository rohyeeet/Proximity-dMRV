import { notFound } from "next/navigation";
import { getFormTemplate, getSubmission } from "@/data";
import { RecordDetailClient } from "@/components/records/RecordDetailClient";

export default async function RecordDetailPage({ params }: { params: Promise<{ formId: string; recordId: string }> }) {
  const { formId, recordId } = await params;
  const form = getFormTemplate(formId);
  const submission = getSubmission(recordId);
  if (!form || !submission || submission.formTemplateId !== formId) notFound();

  return <RecordDetailClient form={form} submission={submission} />;
}
