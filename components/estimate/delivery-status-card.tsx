import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

export function DeliveryStatusCard() {
  return (
    <Card className="flex-row items-center gap-4 border-primary/30 bg-primary/5 p-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Clock className="size-5" />
      </span>
      <div>
        <h3 className="font-semibold">
          Your full plan arrives within 48 hours
        </h3>
        <p className="text-sm text-muted-foreground">
          A CareBy designer is reviewing your submission by hand.
          You&apos;ll get an email with your complete renovation plan and
          concept image — and it&apos;ll show up right here in your
          dashboard.
        </p>
      </div>
    </Card>
  );
}
