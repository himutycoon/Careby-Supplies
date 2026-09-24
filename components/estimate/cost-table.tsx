import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCad } from "@/lib/format";
import type { CostEstimate } from "@/lib/types";

/**
 * The material list. Every row is something we stock and deliver —
 * quantities come from the room's dimensions, prices from the catalogue.
 * Labour is not priced here because we do not sell it.
 */
export function CostTable({ cost }: { cost: CostEstimate }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead>What&apos;s included</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit price</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cost.lineItems.map((item, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium whitespace-nowrap">
                  {item.category}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.description}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {item.quantity} {item.unit}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatCad(item.unitCostCad)}
                </TableCell>
                <TableCell className="text-right font-medium whitespace-nowrap">
                  {formatCad(item.totalCad)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="ml-auto flex w-full max-w-xs flex-col gap-1.5 text-sm sm:max-w-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Materials subtotal</span>
          <span>{formatCad(cost.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Cut waste &amp; overage ({Math.round(cost.wastePct * 100)}%)
          </span>
          <span>{formatCad(cost.wasteAllowance)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">HST</span>
          <span>{formatCad(cost.hst)}</span>
        </div>
        <div className="mt-1.5 flex justify-between border-t border-border pt-1.5 text-base font-bold">
          <span>Estimated material cost</span>
          <span>
            {formatCad(cost.totalLow)} – {formatCad(cost.totalHigh)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Materials only. Installation labour is priced by your contractor.
        </p>
      </div>
    </div>
  );
}
