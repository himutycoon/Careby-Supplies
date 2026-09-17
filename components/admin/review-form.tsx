"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AfterImageUpload } from "@/components/admin/after-image-upload";
import { MarkDeliveredButton } from "@/components/admin/mark-delivered-button";
import { deliverPlan } from "@/lib/actions/admin-deliver-plan";

export function ReviewForm({
  submissionId,
  alreadyDelivered,
}: {
  submissionId: string;
  alreadyDelivered: boolean;
}) {
  const [planNotes, setPlanNotes] = React.useState("");
  const [layoutDescription, setLayoutDescription] = React.useState("");
  const [afterImages, setAfterImages] = React.useState<File[]>([]);

  async function handleDeliver() {
    const formData = new FormData();
    formData.set("planNotes", planNotes);
    formData.set("layoutDescription", layoutDescription);
    afterImages.forEach((file) => formData.append("afterImages", file));
    return deliverPlan(submissionId, formData);
  }

  return (
    <Card className="gap-5 p-5">
      <div>
        <h2 className="text-lg font-semibold">Deliver plan</h2>
        <p className="text-sm text-muted-foreground">
          Upload the concept image and write the plan details the homeowner
          will receive.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>After-image (concept design)</Label>
        <AfterImageUpload onFilesChange={setAfterImages} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="layout-description">Layout description</Label>
        <Textarea
          id="layout-description"
          rows={3}
          placeholder="Describe the new layout and any relocations..."
          value={layoutDescription}
          onChange={(e) => setLayoutDescription(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="plan-notes">Plan notes</Label>
        <Textarea
          id="plan-notes"
          rows={3}
          placeholder="Notes for the homeowner about material choices, scope decisions, etc."
          value={planNotes}
          onChange={(e) => setPlanNotes(e.target.value)}
        />
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <MarkDeliveredButton
          alreadyDelivered={alreadyDelivered}
          onDeliver={handleDeliver}
        />
      </div>
    </Card>
  );
}
