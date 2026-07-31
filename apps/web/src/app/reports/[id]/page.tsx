import { ReportView } from "@/components/report/ReportView";
import { getReport } from "@/lib/reportData";

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  const report = getReport(params.id);
  return <ReportView report={report} />;
}
