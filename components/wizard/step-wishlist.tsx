import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { formatCad } from "@/lib/format";
import { WISHLIST_OPTIONS } from "@/data/mock";
import type { WizardStepProps } from "@/components/wizard/wizard-types";

export function StepWishlist({ state, update }: WizardStepProps) {
  function toggleWishlistItem(item: string, checked: boolean) {
    update(
      "wishlist",
      checked
        ? [...state.wishlist, item]
        : state.wishlist.filter((entry) => entry !== item),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Wish-list and budget</h2>
        <p className="text-sm text-muted-foreground">
          Pick anything that applies, then set the budget you have in mind.
        </p>
      </div>

      <div>
        <Label className="mb-2 block">Wish-list</Label>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {WISHLIST_OPTIONS.map((item) => (
            <label
              key={item}
              className="flex items-center gap-2 text-sm font-medium"
            >
              <Checkbox
                checked={state.wishlist.includes(item)}
                onCheckedChange={(checked) =>
                  toggleWishlistItem(item, checked === true)
                }
              />
              {item}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="wizard-notes">Anything else we should know?</Label>
        <Textarea
          id="wizard-notes"
          placeholder="e.g. There's a soft spot in the floor near the tub."
          rows={3}
          value={state.notes}
          onChange={(e) => update("notes", e.target.value)}
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-sm font-medium">
          <span>Budget</span>
          <span className="text-muted-foreground">
            {formatCad(state.budgetCad)}
          </span>
        </div>
        <Slider
          value={state.budgetCad}
          min={2000}
          max={100000}
          step={500}
          onValueChange={(value) => update("budgetCad", value)}
        />
      </div>
    </div>
  );
}
