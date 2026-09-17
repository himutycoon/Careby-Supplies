import {
  AlertTriangle,
  Image as ImageIcon,
  Palette,
  Receipt,
  ShieldCheck,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { FEATURES } from "@/data/mock";

const ICONS: Record<string, LucideIcon> = {
  Image: ImageIcon,
  AlertTriangle,
  Receipt,
  ShieldCheck,
  Palette,
  UserCheck,
};

export function FeatureGrid() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2>Everything in your report</h2>
        <p className="mt-2 text-muted-foreground">
          One submission gets you a complete picture of your renovation —
          not just a number.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => {
          const Icon = ICONS[feature.icon] ?? ImageIcon;
          return (
            <Card key={feature.title} className="gap-3 p-5">
              <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
