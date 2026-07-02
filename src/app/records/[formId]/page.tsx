import { notFound } from "next/navigation";
import { getFormTemplate, getSubmissionsByForm } from "@/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { RecordsGridClient } from "@/components/records/RecordsGridClient";

export default async function RecordsGridPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  const form = getFormTemplate(formId);
  if (!form) notFound();
  const formSubmissions = getSubmissionsByForm(formId);

  return (
    <div>
      <PageHeader eyebrow={form.category} title={form.name} description={form.description} />
      <RecordsGridClient form={form} submissions={formSubmissions} />
    </div>
  );
}
