import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { RENOVATION_TYPE_OPTIONS, SCOPE_LEVEL_OPTIONS } from "@/data/mock";
import type { RoomType, ScopeLevel } from "@/lib/types";
import type { WizardStepProps } from "@/components/wizard/wizard-types";

export function StepRoom({ state, update }: WizardStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">What are you renovating?</h2>
        <p className="text-sm text-muted-foreground">
          Pick the room and give us a quick sense of the project.
        </p>
      </div>

      <div>
        <Label className="mb-2 block">Room type</Label>
        <ToggleGroup
          value={[state.roomType]}
          onValueChange={(values) => {
            const next = values[0];
            if (next) update("roomType", next as RoomType);
          }}
          className="flex flex-wrap justify-start gap-2"
        >
          {RENOVATION_TYPE_OPTIONS.map((option) => (
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
        <Label className="mb-2 block">Scope of work</Label>
        <ToggleGroup
          value={[state.scopeLevel]}
          onValueChange={(values) => {
            const next = values[0];
            if (next) update("scopeLevel", next as ScopeLevel);
          }}
          className="flex flex-wrap justify-start gap-2"
        >
          {SCOPE_LEVEL_OPTIONS.map((option) => (
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="project-summary">Tell us about the project</Label>
        <Textarea
          id="project-summary"
          placeholder="e.g. Full bathroom remodel — outdated fixtures, want a walk-in shower."
          rows={4}
          value={state.projectSummary}
          onChange={(e) => update("projectSummary", e.target.value)}
        />
      </div>
    </div>
  );
}
