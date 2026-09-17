export interface ReviewRow {
  label: string;
  value: string;
}

/** Consistent summary table for the review step of any wizard. */
export function ReviewStep({
  rows,
  note,
  children,
}: {
  rows: ReviewRow[];
  note?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      <dl className="divide-y divide-border rounded-xl border border-border">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex justify-between gap-4 px-4 py-3 text-sm"
          >
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="text-right font-medium">{row.value || "—"}</dd>
          </div>
        ))}
      </dl>

      {note ? (
        <p className="text-sm text-muted-foreground">{note}</p>
      ) : null}

      {children}
    </div>
  );
}
