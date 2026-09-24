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
          Your full material plan arrives within 48 hours
        </h3>
        <p className="text-sm text-muted-foreground">
          A CareBy advisor is checking the quantities against your photos by
          hand. You&apos;ll get an email with the finished list and a concept
          image — and it&apos;ll show up right here in your dashboard, ready
          to order from.
        </p>
      </div>
    </Card>
  );
}
