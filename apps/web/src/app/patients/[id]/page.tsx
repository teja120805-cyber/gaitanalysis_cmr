import { notFound } from "next/navigation";
import { PatientDetail } from "@/components/patient/PatientDetail";
import { getPatientDetail } from "@/lib/patientData";

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const data = getPatientDetail(params.id);
  if (!data) notFound();
  return <PatientDetail data={data} />;
}
