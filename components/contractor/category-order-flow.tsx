"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OptionCard } from "@/components/wizard-kit/option-card";
import { WizardFrame, WizardStep } from "@/components/wizard-kit/wizard-frame";
import { PackageSelector } from "@/components/wizard-kit/package-selector";
import { ProductSelector } from "@/components/wizard-kit/product-selector";
import { ReviewStep } from "@/components/wizard-kit/review-step";
import { useToast } from "@/components/shared/toast";
import { useCart } from "@/components/shop/cart-provider";
import { createProject } from "@/services/projects";
import { createServiceRequest } from "@/services/service-requests";
import { PACKAGE_TIERS, PROJECT_FLOWS } from "@/data/project-flows";
import { formatCad } from "@/lib/format";

const STEPS = ["Type", "Details", "Package", "Materials", "Review"];

/**
 * Catalog categories worth suggesting for a project subtype.
 *
 * Lists, not single values: a kitchen renovation was mapped to "plumbing"
 * alone, so the only materials a contractor was offered for a kitchen were
 * a bathroom faucet and a length of PVC pipe. Real jobs span aisles.
 *
 * "other" is deliberately every category rather than absent — a missing
 * key meant the New Construction "Other" subtype suggested nothing at all.
 */
const ALL_CATEGORIES = [
  "lumber",
  "flooring",
  "plumbing",
  "electrical",
  "doors-windows",
  "roofing",
  "hardware",
  "paint",
  "tools",
];

const SUBTYPE_CATEGORIES: Record<string, string[]> = {
  // Repairs stay tight — you are fixing one thing.
  plumbing: ["plumbing", "hardware"],
  electrical: ["electrical", "hardware"],
  roofing: ["roofing", "lumber"],
  flooring: ["flooring", "hardware"],
  drywall: ["hardware", "paint"],
  hvac: ["hardware", "electrical"],

  // Renovations span trades.
  kitchen: ["plumbing", "electrical", "flooring", "paint", "hardware"],
  bathroom: ["plumbing", "flooring", "paint", "hardware"],
  basement: ["lumber", "electrical", "flooring", "paint", "hardware"],
  bedroom: ["flooring", "paint", "electrical", "doors-windows"],
  "whole-house": ALL_CATEGORIES,
  addition: ["lumber", "roofing", "doors-windows", "electrical", "hardware"],
  deck: ["lumber", "hardware", "tools"],

  // New construction is broad by definition.
  "single-family": ALL_CATEGORIES,
  "multi-family": ALL_CATEGORIES,
  commercial: ALL_CATEGORIES,
  other: ALL_CATEGORIES,
};

export function CategoryOrderFlow() {
  const router = useRouter();
  const { toast } = useToast();
  const { lines, setProject } = useCart();

  const [flowId, setFlowId] = React.useState<string | null>(null);
  const [step, setStep] = React.useState(0);
  const [subtype, setSubtype] = React.useState<string | null>(null);
  const [projectName, setProjectName] = React.useState("");
  const [location, setLocation] = React.useState("Mississauga, ON");
  const [notes, setNotes] = React.useState("");
  const [tier, setTier] = React.useState("none");
  const [submitting, setSubmitting] = React.useState(false);

  const flow = PROJECT_FLOWS.find((f) => f.id === flowId) ?? null;
  const selectedTier = PACKAGE_TIERS.find((t) => t.id === tier);
  const subtypeLabel =
    flow?.subtypes.find((s) => s.id === subtype)?.label ?? "";

  // Project-type selection sits before the stepper.
  if (!flow) {
    return (
      <div className="flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-3xl">
            What type of project are you working on?
          </h1>
          <p className="mt-2 text-muted-foreground">
            We&apos;ll tailor the materials and options to suit.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {PROJECT_FLOWS.map((option) => (
            <OptionCard
              key={option.id}
              label={option.title}
              description={option.tagline}
              icon={option.icon}
              size="large"
              selected={false}
              onSelect={() => setFlowId(option.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  // Narrowing doesn't survive into the async closure below, so bind it.
  const activeFlow = flow;

  const canContinue =
    (step === 0 && Boolean(subtype)) ||
    (step === 1 && projectName.trim() !== "") ||
    step >= 2;

  async function handleNext() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    // Final step — create the project, then send them to checkout.
    setSubmitting(true);
    const result = await createProject({
      name: projectName,
      // Flow ids are hyphenated for URLs; the database uses underscores.
      type:
        activeFlow.id === "new-construction"
          ? "new_construction"
          : activeFlow.id,
      subtype: subtypeLabel,
      location,
      notes,
      supportPackage:
        selectedTier && selectedTier.id !== "none"
          ? { name: selectedTier.name, priceCad: selectedTier.priceCad }
          : undefined,
    });

    if (!result.ok) {
      setSubmitting(false);
      toast(result.error, "error");
      return;
    }

    const project = result.data;

    // The whole point of this flow is that the materials belong to the
    // job it just created. Assigning them here is what makes them show up
    // under "Linked orders" on the project — previously the order was
    // created against nothing and the project stayed permanently empty.
    for (const line of lines) {
      if (!line.projectId) setProject(line.productId, project.id);
    }

    // A support tier is work for the team, not a product: checkout only
    // handles catalog lines, and no payment processor is connected. Raise
    // it as a request so it reaches the admin queue and the contractor can
    // see it under their own requests.
    if (selectedTier && selectedTier.id !== "none") {
      const requested = await createServiceRequest({
        serviceType: "support_package",
        category: selectedTier.name,
        subcategory: subtypeLabel,
        projectId: project.id,
        details: {
          tier: selectedTier.id,
          priceCad: selectedTier.priceCad,
          projectType: activeFlow.title,
        },
        notes,
      });

      if (!requested.ok) {
        // The project and its materials are safe; only the add-on failed.
        toast(
          `Project created, but we couldn't log the ${selectedTier.name} package. Mention it at checkout.`,
          "error",
        );
      }
    }

    setSubmitting(false);
    toast(`Project ${project.name} created`);
    router.push("/checkout");
  }

  return (
    <WizardFrame
      steps={STEPS}
      current={step}
      canContinue={canContinue}
      submitting={submitting}
      nextLabel={step === STEPS.length - 1 ? "Create project & checkout" : "Continue"}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onNext={handleNext}
      header={
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">{flow.title}</p>
            <h1 className="text-2xl">{flow.tagline}</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFlowId(null);
              setStep(0);
              setSubtype(null);
            }}
          >
            Change type
          </Button>
        </div>
      }
    >
      {step === 0 ? (
        <WizardStep title={flow.subtypeLabel}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {flow.subtypes.map((option) => (
              <OptionCard
                key={option.id}
                label={option.label}
                icon={option.icon}
                selected={subtype === option.id}
                onSelect={() => setSubtype(option.id)}
              />
            ))}
          </div>
        </WizardStep>
      ) : null}

      {step === 1 ? (
        <WizardStep
          title="Project details"
          helper="Name the job so materials and orders can be grouped against it."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="co-project-name">Project name</Label>
              <Input
                id="co-project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder={`${subtypeLabel} — 12 Maple St`}
                required
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="co-location">Location</Label>
              <Input
                id="co-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="co-notes">Notes</Label>
              <Textarea
                id="co-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Scope, access constraints, timing…"
              />
            </div>
          </div>
        </WizardStep>
      ) : null}

      {step === 2 ? (
        <WizardStep
          title="Optional packages"
          helper="Add support beyond materials — or skip it entirely."
        >
          <PackageSelector
            tiers={PACKAGE_TIERS}
            value={tier}
            onChange={setTier}
          />
        </WizardStep>
      ) : null}

      {step === 3 ? (
        <WizardStep
          title="Suggested materials"
          helper="Add what you need — quantities stay editable in the cart."
        >
          <ProductSelector
            categoryIds={subtype ? SUBTYPE_CATEGORIES[subtype] : null}
            showContractorPrice
          />
        </WizardStep>
      ) : null}

      {step === 4 ? (
        <WizardStep title="Review your project">
          <ReviewStep
            rows={[
              { label: "Project type", value: flow.title },
              {
                label: flow.subtypeLabel.replace("Select ", ""),
                value: subtypeLabel,
              },
              { label: "Project name", value: projectName },
              { label: "Location", value: location },
              {
                label: "Package",
                value: selectedTier
                  ? `${selectedTier.name}${
                      selectedTier.priceCad
                        ? ` · ${formatCad(selectedTier.priceCad)}`
                        : ""
                    }`
                  : "—",
              },
            ]}
            note={
              selectedTier && selectedTier.id !== "none"
                ? `Materials in your cart will be assigned to this project at checkout. The ${selectedTier.name} package isn't charged here — an advisor confirms scope and price with you first.`
                : "Materials in your cart will be assigned to this project at checkout."
            }
          >
            <Button
              variant="outline"
              className="w-fit"
              render={
                <Link href="/cart">
                  Review cart first <ArrowRight className="size-4" />
                </Link>
              }
            />
          </ReviewStep>
        </WizardStep>
      ) : null}
    </WizardFrame>
  );
}
