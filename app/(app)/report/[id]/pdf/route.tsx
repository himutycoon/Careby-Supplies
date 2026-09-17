import { renderToBuffer } from "@react-pdf/renderer";
import { ReportPdfDocument } from "@/components/report/report-pdf-document";
import { getRealReportById } from "@/lib/supabase/queries";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const report = await getRealReportById(id);

  // No mock fallback: emitting a plausible-looking PDF for a report that
  // doesn't exist would hand someone a fabricated document.
  if (!report) {
    return new Response("Report not found", { status: 404 });
  }

  const buffer = await renderToBuffer(<ReportPdfDocument report={report} />);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="careby-renovation-report-${id}.pdf"`,
    },
  });
}
