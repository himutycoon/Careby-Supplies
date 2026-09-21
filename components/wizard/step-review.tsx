import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DisclaimerBox } from "@/components/shared/disclaimer-box";
import { formatCad } from "@/lib/format";
import {
  PROPERTY_TYPE_OPTIONS,
  ROOM_TYPE_OPTIONS,
  SCOPE_LEVEL_OPTIONS,
} from "@/data/mock";
import type { WizardStepProps } from "@/components/wizard/wizard-types";

export function StepReview({ state, update }: WizardStepProps) {
  const roomLabel =
    ROOM_TYPE_OPTIONS.find((o) => o.value === state.roomType)?.label ??
    state.roomType;
  const scopeLabel =
    SCOPE_LEVEL_OPTIONS.find((o) => o.value === state.scopeLevel)?.label ??
    state.scopeLevel;
  const propertyLabel =
    PROPERTY_TYPE_OPTIONS.find((o) => o.value === state.propertyType)
      ?.label ?? state.propertyType;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Contact details</h2>
        <p className="text-sm text-muted-foreground">
          How we&apos;ll reach you about your plan, within 48 hours.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="wizard-name">Full name</Label>
          <Input
            id="wizard-name"
            value={state.contactName}
            onChange={(e) => update("contactName", e.target.value)}
            placeholder="Jordan Smith"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="wizard-email">Email</Label>
          <Input
            id="wizard-email"
            type="email"
            value={state.contactEmail}
            onChange={(e) => update("contactEmail", e.target.value)}
            placeholder="you@email.com"
            required
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="wizard-phone">Phone (optional)</Label>
          <Input
            id="wizard-phone"
            type="tel"
            value={state.contactPhone}
            onChange={(e) => update("contactPhone", e.target.value)}
            placeholder="(905) 555-0100"
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/40 p-4">
        <h3 className="mb-3 text-sm font-semibold">Review your submission</h3>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Property</dt>
            <dd className="font-medium">
              {propertyLabel} · {state.isOwner ? "Owner" : "Not owner"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Room</dt>
            <dd className="font-medium">{roomLabel}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Scope</dt>
            <dd className="font-medium">{scopeLabel}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Dimensions</dt>
            <dd className="font-medium">
              {state.lengthFt} × {state.widthFt} ft, {state.ceilingHeightFt} ft
              ceiling
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Condition</dt>
            <dd className="font-medium capitalize">
              {state.currentCondition}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Budget</dt>
            <dd className="font-medium">{formatCad(state.budgetCad)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Photos</dt>
            <dd className="font-medium">{state.photos.length} uploaded</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Wish-list</dt>
            <dd className="font-medium">
              {state.wishlist.length > 0
                ? `${state.wishlist.length} ${state.wishlist.length === 1 ? "item" : "items"} selected`
                : "None selected"}
            </dd>
          </div>
        </dl>
        {state.wishlist.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {state.wishlist.map((item) => (
              <Badge key={item} variant="secondary">
                {item}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>

      {!state.isOwner ? (
        <DisclaimerBox>
          You&apos;ve indicated you&apos;re not the property owner.
          Renovations typically require the property owner&apos;s written
          consent — make sure you have permission before proceeding.
        </DisclaimerBox>
      ) : null}
    </div>
  );
}
