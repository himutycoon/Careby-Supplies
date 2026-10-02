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
import { ScopeChecklist } from "@/components/wizard-kit/scope-checklist";
import { ScopeMaterials } from "@/components/wizard-kit/scope-materials";
import { ReviewStep } from "@/components/wizard-kit/review-step";
import { useToast } from "@/components/shared/toast";
import { useCart } from "@/components/shop/cart-provider";
import { createProject } from "@/services/projects";
import { createServiceRequest } from "@/services/service-requests";
import { PACKAGE_TIERS, PROJECT_FLOWS } from "@/data/project-flows";
import {
  projectScope,
  stagesFor,
  type ScopeStage,
} from "@/data/project-scopes";
import { formatCad } from "@/lib/format";

/*
 * The checklist steps only exist for jobs the client has written a
 * scope for. A plumbing repair has no "tick every part you need" --
 * there are no parts, there is one broken thing -- so those jobs keep
 * the single suggested-materials step they have always had.
 */
const STEPS = ["Type", "Details", "Package", "Materials", "Review"];
const SCOPED_STEPS = [
  "Type",
  "Details",
  "Package",
  "What you need",
  "Materials",
  "Review",
];

/**
 * Contractor subtype -> the project scope of the same job.
 *
 * Almost all of them share an id with the homeowner's checklist on
 * purpose. "whole-house" is the one that does not, and because of that
 * a Full House order was the only renovation getting a generic aisle
 * list instead of the client's own 20-stage list.
 */
const SCOPE_ALIASES: Record<string, string> = { "whole-house": "full-home" };

function scopeFor(subtype: string | null) {
  if (!subtype) return undefined;
  return projectScope(SCOPE_ALIASES[subtype] ?? subtype);
}

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
  "tile",
  "plumbing",
  "electrical",
  "doors-windows",
  "roofing",
  "hardware",
  "paint",
  "tools",
  "drywall",
  "insulation",
  "adhesives",
  "concrete",
  "metal-framing",
  // Eight aisles the catalogue has had for a while and this list did
  // not, so "every category" quietly excluded 286 products — among
  // them every vanity, every appliance and the whole HVAC department.
  "cabinetry",
  "countertops",
  "appliances",
  "hvac",
  "smart-home",
  "outdoor",
  "window-coverings",
  "bath",
];

/*
 * Aisles a job type buys from.
 *
 * Where the job matches one of the project scopes the homeowner
 * checklist is built from, the aisles are taken from that scope's own
 * stages rather than written again here — two hand-kept lists of the
 * same thing drift, and the client asked for this side to match.
 */
function scopeCategories(projectId: string): string[] | undefined {
  const project = scopeFor(projectId);
  if (!project) return undefined;
  const all = [
    ...project.stages,
    ...(project.variants ?? []).flatMap((v) => v.stages),
  ].flatMap((stage) => stage.categories);
  return [...new Set(all)];
}

const SUBTYPE_CATEGORIES: Record<string, string[]> = {
  // Repairs stay tight — you are fixing one thing.
  plumbing: ["plumbing", "hardware"],
  electrical: ["electrical", "hardware"],
  roofing: ["roofing", "lumber"],
  flooring: ["flooring", "tile", "adhesives"],
  drywall: ["drywall", "metal-framing", "adhesives", "paint"],
  hvac: ["hvac", "electrical"],

  // Renovations span trades.
  kitchen: ["plumbing", "electrical", "tile", "flooring", "paint", "hardware"],
  bathroom: ["plumbing", "bath", "tile", "flooring", "paint", "hardware"],
  basement: [
    "lumber",
    "metal-framing",
    "drywall",
    "insulation",
    "electrical",
    "flooring",
    "paint",
    "hardware",
  ],
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

/** The scope's aisles when the job is one of them, else the map above. */
function categoriesFor(subtype: string): string[] {
  return scopeCategories(subtype) ?? SUBTYPE_CATEGORIES[subtype] ?? ALL_CATEGORIES;
}


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
  /*
   * Which parts of the job they need materials for, and which variant
   * of it — the same two answers the homeowner's checklist asks, kept
   * here so the contractor can be sent down the same two screens.
   */
  const [picked, setPicked] = React.useState<Set<string>>(new Set());
  const [variantId, setVariantId] = React.useState("");

  const flow = PROJECT_FLOWS.find((f) => f.id === flowId) ?? null;
  const selectedTier = PACKAGE_TIERS.find((t) => t.id === tier);
  const subtypeLabel =
    flow?.subtypes.find((s) => s.id === subtype)?.label ?? "";

  /*
   * The client's own stage list for this job, when there is one. This
   * is the same data the homeowner's material checklist is built from
   * -- not a contractor copy of it -- so a Kitchen means the same
   * twenty-odd stages on both sides of the product.
   */
  const scope = scopeFor(subtype);
  const stages: ScopeStage[] = scope ? stagesFor(scope, variantId) : [];
  const chosen = stages.filter((stage) => picked.has(stage.id));
  const steps = scope ? SCOPED_STEPS : STEPS;
  const current = steps[step];
  const needsVariant = Boolean(scope?.variants?.length) && !variantId;

  function chooseSubtype(id: string) {
    setSubtype(id);
    // A different job is a different stage list; ticks cannot carry over.
    setPicked(new Set());
    setVariantId("");
  }

  function chooseVariant(id: string) {
    setVariantId(id);
    // A variant's own stages change with it, so a tick against
    // "Laminate boards" must not survive a switch to carpet.
    const variantStages = new Set(
      (scope?.variants ?? []).flatMap((v) => v.stages.map((s) => s.id)),
    );
    setPicked((prev) => new Set([...prev].filter((id) => !variantStages.has(id))));
  }

  function toggleStage(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Project-type selection sits before the stepper.
  if (!flow) {
    return (
      <div className="flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-3xl">What are you buying material for?</h1>
          <p className="mt-2 text-muted-foreground">
            Pick the job and we&apos;ll open the aisles it needs, at your
            trade pricing.
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
    (current === "Type" && Boolean(subtype) && !needsVariant) ||
    (current === "Details" && projectName.trim() !== "") ||
    // Nothing ticked means nothing to shop for on the next screen.
    (current === "What you need" ? picked.size > 0 : false) ||
    current === "Package" ||
    current === "Materials" ||
    current === "Review";

  async function handleNext() {
    if (step < steps.length - 1) {
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
      /*
       * The ticked stages go onto the project itself, so whoever picks
       * this order up knows what the job covers rather than only what
       * ended up in the cart. Folded into the description because that
       * is a column that already exists -- a dedicated one would mean a
       * migration for something a line of text says perfectly well.
       */
      notes: [
        notes.trim(),
        chosen.length > 0
          ? `Scope: ${chosen.map((stage) => stage.label).join(" · ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
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
      steps={steps}
      current={step}
      canContinue={canContinue}
      submitting={submitting}
      nextLabel={
        step === steps.length - 1 ? "Create project & checkout" : "Continue"
      }
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
      {current === "Type" ? (
        <WizardStep title={flow.subtypeLabel}>
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {flow.subtypes.map((option) => (
                <OptionCard
                  key={option.id}
                  label={option.label}
                  icon={option.icon}
                  selected={subtype === option.id}
                  onSelect={() => chooseSubtype(option.id)}
                />
              ))}
            </div>

            {/* Some jobs come in more than one form, and the form
                changes the stage list — a laminate floor and a carpet
                are not bought the same way. Asked here because the
                checklist two steps later depends on the answer. */}
            {scope?.variants?.length ? (
              <div className="flex flex-col gap-2.5">
                <Label>{scope.variantLabel}</Label>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {scope.variants.map((variant) => (
                    <OptionCard
                      key={variant.id}
                      label={variant.label}
                      selected={variantId === variant.id}
                      onSelect={() => chooseVariant(variant.id)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </WizardStep>
      ) : null}

      {current === "Details" ? (
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

      {current === "Package" ? (
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

      {current === "What you need" && scope ? (
        <WizardStep
          title={`What does this ${scope.name.toLowerCase()} need?`}
          helper="The same checklist your customer sees. Tick the parts you're buying for."
        >
          <ScopeChecklist
            stages={stages}
            picked={picked}
            onToggle={toggleStage}
            onSelectAll={() => setPicked(new Set(stages.map((s) => s.id)))}
            onClear={() => setPicked(new Set())}
          />
        </WizardStep>
      ) : null}

      {current === "Materials" ? (
        <WizardStep
          title="Suggested materials"
          helper="Add what you need — quantities stay editable in the cart."
        >
          {scope ? (
            <ScopeMaterials
              projectId={scope.id}
              stages={chosen}
              showContractorPrice
              helper="What we stock for each part you ticked, at your trade price."
            />
          ) : (
            /* No scope for this job, so there is no checklist to work
               through — a plumbing repair gets the aisles, as before. */
            <ProductSelector
              categoryIds={subtype ? categoriesFor(subtype) : null}
              showContractorPrice
            />
          )}
        </WizardStep>
      ) : null}

      {current === "Review" ? (
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
              // Only where there was a checklist to tick.
              ...(scope
                ? [
                    {
                      label: "Parts of the job",
                      value:
                        chosen.length > 0
                          ? chosen.map((stage) => stage.label).join(" · ")
                          : "—",
                    },
                  ]
                : []),
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
