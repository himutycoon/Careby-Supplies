import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DownloadPdfButton({ submissionId }: { submissionId: string }) {
  return (
    <Button
      size="lg"
      render={<a href={`/report/${submissionId}/pdf`} download />}
    >
      <Download className="size-4" /> Download PDF
    </Button>
  );
}
