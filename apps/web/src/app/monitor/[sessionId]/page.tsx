import { CockpitClient } from "@/components/cockpit/CockpitClient";
import { getPatient, PATIENTS } from "@/lib/patients";

/**
 * sessionId doubles as the patient id in the demo. An optional `?session=<id>`
 * query joins a session already fed by a real device / vision worker.
 */
export default function MonitorPage({
  params,
  searchParams,
}: {
  params: { sessionId: string };
  searchParams: { session?: string };
}) {
  const patient = getPatient(params.sessionId) ?? PATIENTS[0];
  return <CockpitClient patient={patient} joinSessionId={searchParams?.session} />;
}
