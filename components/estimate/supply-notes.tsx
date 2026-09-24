import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PackageCheck, UserRound } from "lucide-react";
import type { SupplyNote } from "@/lib/types";

/**
 * What arrives on the truck, and what the customer arranges themselves.
 * CareBy sells material, not labour, and this list is where the quote
 * says so plainly instead of leaving it to be assumed.
 */
export function SupplyNotes({ notes }: { notes: SupplyNote[] }) {
  return (
    <div className="flex flex-col gap-3">
      {notes.map((note) => (
        <Card key={note.id} className="flex-row items-start gap-3 p-4">
          {note.included ? (
            <PackageCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          ) : (
            <UserRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-medium">{note.label}</h4>
              <Badge variant={note.included ? "default" : "secondary"}>
                {note.included ? "We supply" : "You arrange"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{note.owner}</p>
            <p className="mt-1 text-xs text-muted-foreground">{note.note}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
