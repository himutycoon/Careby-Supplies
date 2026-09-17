import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhotoPlaceholder } from "@/components/shared/photo-placeholder";
import { VerdictBanner } from "@/components/shared/verdict-banner";
import { formatCad } from "@/lib/format";
import { mockReport } from "@/data/mock";

export function SampleReport() {
  const { estimate } = mockReport;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <FileText className="size-3.5" /> Sample report
          </span>
          <h2>A peek at what you receive</h2>
          <p className="text-muted-foreground">
            Every full plan includes a concept image, an itemised cost
            breakdown, a permit checklist, and a written walkthrough from
            your designer — not just a number.
          </p>
          <Button
            variant="outline"
            className="w-fit"
            render={
              <Link href="/sample-report">
                View a sample report <ArrowRight className="size-4" />
              </Link>
            }
          />
        </div>

        <Card className="gap-4 p-5">
          <VerdictBanner
            verdict={estimate.verdict}
            subtext={`${formatCad(estimate.cost.totalLow)} – ${formatCad(estimate.cost.totalHigh)} estimated`}
          />
          <div className="grid grid-cols-2 gap-3">
            <PhotoPlaceholder label="Before" tone="before" />
            <PhotoPlaceholder label="After (concept)" tone="after" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Full gut</Badge>
            <Badge variant="secondary">Bathroom</Badge>
            <Badge variant="secondary">Mississauga, ON</Badge>
          </div>
        </Card>
      </div>
    </section>
  );
}
