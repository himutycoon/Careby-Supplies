"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCad, formatDate } from "@/lib/format";
import { PROPERTY_TYPE_OPTIONS, ROOM_TYPE_OPTIONS } from "@/data/mock";
import type { Submission, SubmissionStatus } from "@/lib/types";

const FILTERS: { value: SubmissionStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "in-review", label: "In Review" },
  { value: "delivered", label: "Delivered" },
];

export function QueueTable({ submissions }: { submissions: Submission[] }) {
  const [filter, setFilter] = React.useState<SubmissionStatus | "all">("all");

  const filtered =
    filter === "all"
      ? submissions
      : submissions.filter((s) => s.status === filter);

  return (
    <div className="flex flex-col gap-4">
      <ToggleGroup
        value={[filter]}
        onValueChange={(values) => {
          const next = values[0];
          if (next) setFilter(next as SubmissionStatus | "all");
        }}
        className="flex flex-wrap justify-start gap-2"
      >
        {FILTERS.map((option) => (
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

      <div className="overflow-x-auto rounded-lg border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((submission) => {
              const roomLabel =
                ROOM_TYPE_OPTIONS.find(
                  (o) => o.value === submission.input.roomType,
                )?.label ?? submission.input.roomType;
              const propertyLabel =
                PROPERTY_TYPE_OPTIONS.find(
                  (o) => o.value === submission.input.propertyType,
                )?.label ?? submission.input.propertyType;
              return (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {roomLabel} ·{" "}
                    <span className="font-normal text-muted-foreground">
                      {submission.input.scopeLevel.replace("-", " ")}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {propertyLabel}
                    {submission.input.isOwner === false ? " · Not owner" : ""}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={submission.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatCad(submission.input.budgetCad)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(submission.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      render={
                        <Link href={`/admin/${submission.id}`}>
                          Review <ArrowRight className="size-3.5" />
                        </Link>
                      }
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  No submissions with this status.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
