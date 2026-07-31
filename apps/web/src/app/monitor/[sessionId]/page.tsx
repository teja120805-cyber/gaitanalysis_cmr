import { CockpitClient } from "@/components/cockpit/CockpitClient";
import { getPatient, PATIENTS } from "@/lib/patients";

/** sessionId doubles as the patient id in the demo. */
export default function MonitorPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const patient = getPatient(params.sessionId) ?? PATIENTS[0];
  return <CockpitClient patient={patient} />;
}
