import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Condition } from "@/lib/types";
import type { WizardStepProps } from "@/components/wizard/wizard-types";

const CONDITION_OPTIONS: { value: Condition; label: string }[] = [
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

export function StepDimensions({ state, update }: WizardStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Dimensions and condition</h2>
        <p className="text-sm text-muted-foreground">
          Rough measurements are fine — you can always adjust later.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm font-medium">
            <span>Length</span>
            <span className="text-muted-foreground">{state.lengthFt} ft</span>
          </div>
          <Slider
            value={state.lengthFt}
            min={4}
            max={40}
            step={1}
            onValueChange={(value) => update("lengthFt", value)}
          />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-sm font-medium">
            <span>Width</span>
            <span className="text-muted-foreground">{state.widthFt} ft</span>
          </div>
          <Slider
            value={state.widthFt}
            min={4}
            max={40}
            step={1}
            onValueChange={(value) => update("widthFt", value)}
          />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-sm font-medium">
          <span>Ceiling height</span>
          <span className="text-muted-foreground">
            {state.ceilingHeightFt} ft
          </span>
        </div>
        <Slider
          value={state.ceilingHeightFt}
          min={7}
          max={14}
          step={0.5}
          onValueChange={(value) => update("ceilingHeightFt", value)}
        />
      </div>

      <div>
        <Label className="mb-2 block">Current condition</Label>
        <ToggleGroup
          value={[state.currentCondition]}
          onValueChange={(values) => {
            const next = values[0];
            if (next) update("currentCondition", next as Condition);
          }}
          className="flex flex-wrap justify-start gap-2"
        >
          {CONDITION_OPTIONS.map((option) => (
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
    </div>
  );
}
