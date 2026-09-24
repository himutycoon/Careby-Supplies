"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { VerdictBanner } from "@/components/shared/verdict-banner";
import { formatCad } from "@/lib/format";
import { calculatePlaceholderEstimate } from "@/lib/placeholder-estimate";
import { RENOVATION_TYPE_OPTIONS, SCOPE_LEVEL_OPTIONS } from "@/data/mock";
import type { RoomType, ScopeLevel } from "@/lib/types";

const VERDICT_SUBTEXT: Record<
  ReturnType<typeof calculatePlaceholderEstimate>["verdict"],
  string
> = {
  "within-budget": "Your budget covers the materials with room to spare.",
  tight: "The materials fit, but leave little room for a grade upgrade.",
  "over-budget": "The materials alone run above your budget at this grade.",
};

export function EstimateWidget() {
  const [roomType, setRoomType] = React.useState<RoomType>("bathroom");
  const [lengthFt, setLengthFt] = React.useState(9);
  const [widthFt, setWidthFt] = React.useState(7);
  const [ceilingHeightFt, setCeilingHeightFt] = React.useState(8);
  const [scopeLevel, setScopeLevel] = React.useState<ScopeLevel>("moderate");
  const [budgetCad, setBudgetCad] = React.useState(15000);

  const estimate = React.useMemo(
    () =>
      calculatePlaceholderEstimate({
        roomType,
        lengthFt,
        widthFt,
        scopeLevel,
        budgetCad,
      }),
    [roomType, lengthFt, widthFt, scopeLevel, budgetCad],
  );

  const budgetUsedPct = Math.min(
    100,
    Math.round((estimate.totalHigh / budgetCad) * 100),
  );

  return (
    <section id="estimate" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2>Try it yourself</h2>
        <p className="mt-2 text-muted-foreground">
          Move the sliders below to see how scope and budget interact.
          Upload your real photos for an estimate built from your actual
          room.
        </p>
      </div>

      <Card className="grid gap-8 p-6 lg:grid-cols-2 lg:p-8">
        {/* Inputs */}
        <div className="flex flex-col gap-6">
          <div>
            <p className="mb-2 text-sm font-medium">Room type</p>
            <ToggleGroup
              value={[roomType]}
              onValueChange={(values) => {
                const next = values[0];
                if (next) setRoomType(next as RoomType);
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

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm font-medium">
                <span>Length</span>
                <span className="text-muted-foreground">{lengthFt} ft</span>
              </div>
              <Slider
                value={lengthFt}
                min={4}
                max={30}
                step={1}
                onValueChange={(value) => setLengthFt(value)}
              />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm font-medium">
                <span>Width</span>
                <span className="text-muted-foreground">{widthFt} ft</span>
              </div>
              <Slider
                value={widthFt}
                min={4}
                max={30}
                step={1}
                onValueChange={(value) => setWidthFt(value)}
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-sm font-medium">
              <span>Ceiling height</span>
              <span className="text-muted-foreground">
                {ceilingHeightFt} ft
              </span>
            </div>
            <Slider
              value={ceilingHeightFt}
              min={7}
              max={12}
              step={0.5}
              onValueChange={(value) => setCeilingHeightFt(value)}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Scope level</p>
            <ToggleGroup
              value={[scopeLevel]}
              onValueChange={(values) => {
                const next = values[0];
                if (next) setScopeLevel(next as ScopeLevel);
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
            <p className="mt-2 text-xs text-muted-foreground">
              {
                SCOPE_LEVEL_OPTIONS.find((o) => o.value === scopeLevel)
                  ?.description
              }
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-sm font-medium">
              <span>Budget</span>
              <span className="text-muted-foreground">
                {formatCad(budgetCad)}
              </span>
            </div>
            <Slider
              value={budgetCad}
              min={2000}
              max={100000}
              step={500}
              onValueChange={(value) => setBudgetCad(value)}
            />
          </div>
        </div>

        {/* Output */}
        <div className="flex flex-col gap-5 rounded-lg bg-muted/40 p-5">
          <VerdictBanner
            verdict={estimate.verdict}
            subtext={VERDICT_SUBTEXT[estimate.verdict]}
          />

          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold">
                {formatCad(estimate.totalLow)} –{" "}
                {formatCad(estimate.totalHigh)}
              </p>
            </div>
            <p className="mb-2 text-xs text-muted-foreground">
              Materials delivered, vs. your {formatCad(budgetCad)} budget
            </p>
            <Progress value={budgetUsedPct} />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Where the money goes</p>
            <div className="flex flex-wrap gap-2">
              {estimate.workItems.map((item) => (
                <Badge key={item.category} variant="secondary">
                  {item.category} · {formatCad(item.amountCad)}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium">
              <ShieldCheck className="size-3.5 text-primary" />
              {estimate.materialLineCount} material
              {estimate.materialLineCount === 1 ? " line" : " lines"} priced
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium">
              <Users className="size-3.5 text-primary" />
              {estimate.similarProjectsCount} similar projects
            </span>
          </div>

          <Button
            size="lg"
            className="mt-1 w-full sm:w-fit"
            render={
              <Link href="/new">
                Upload photos for your real estimate
                <ArrowRight className="size-4" />
              </Link>
            }
          />

          <p className="text-xs text-muted-foreground">
            Materials only — your contractor prices their own labour.
            Upload photos and we work from the real room.
          </p>
        </div>
      </Card>
    </section>
  );
}
