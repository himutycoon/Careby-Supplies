import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PROPERTY_TYPE_OPTIONS } from "@/data/mock";
import type { PropertyType } from "@/lib/types";
import type { WizardStepProps } from "@/components/wizard/wizard-types";

const OWNER_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export function StepProperty({ state, update }: WizardStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">About your property</h2>
        <p className="text-sm text-muted-foreground">
          A couple of quick questions before we get into the details.
        </p>
      </div>

      <div>
        <Label className="mb-2 block">Property type</Label>
        <ToggleGroup
          value={[state.propertyType]}
          onValueChange={(values) => {
            const next = values[0];
            if (next) update("propertyType", next as PropertyType);
          }}
          className="flex flex-wrap justify-start gap-2"
        >
          {PROPERTY_TYPE_OPTIONS.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              variant="outline"
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div>
        <Label className="mb-2 block">Are you the property owner?</Label>
        <ToggleGroup
          value={[state.isOwner ? "yes" : "no"]}
          onValueChange={(values) => {
            const next = values[0];
            if (next) update("isOwner", next === "yes");
          }}
          className="flex flex-wrap justify-start gap-2"
        >
          {OWNER_OPTIONS.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              variant="outline"
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {!state.isOwner ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Renovations typically require the property owner&apos;s written
            consent — make sure you have permission before proceeding.
          </p>
        ) : null}
      </div>
    </div>
  );
}
