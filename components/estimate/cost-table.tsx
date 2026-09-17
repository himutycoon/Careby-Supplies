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

export function CostTable({ cost }: { cost: CostEstimate }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trade</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit cost</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cost.lineItems.map((item, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium whitespace-nowrap">
                  {item.trade}
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
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCad(cost.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Contingency ({Math.round(cost.contingencyPct * 100)}%)
          </span>
          <span>{formatCad(cost.contingency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Permit fees</span>
          <span>{formatCad(cost.permitFees)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">HST</span>
          <span>{formatCad(cost.hst)}</span>
        </div>
        <div className="mt-1.5 flex justify-between border-t border-border pt-1.5 text-base font-bold">
          <span>Estimated range</span>
          <span>
            {formatCad(cost.totalLow)} – {formatCad(cost.totalHigh)}
          </span>
        </div>
      </div>
    </div>
  );
}
