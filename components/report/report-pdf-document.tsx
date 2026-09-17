import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Report } from "@/lib/types";

/*
 * The PDF cannot read CSS variables, so the brand colours are repeated
 * here as hex. These are the navy and tint from app/globals.css
 * (--primary and a wash of it) — update both together.
 */
const NAVY = "#1B3A73";
const INK = "#16213A";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    color: INK,
    fontFamily: "Helvetica",
  },
  brand: {
    fontSize: 14,
    fontWeight: 700,
    color: NAVY,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    color: MUTED,
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 6,
    borderBottom: `1px solid ${BORDER}`,
    paddingBottom: 4,
  },
  verdictBox: {
    padding: 10,
    borderRadius: 4,
    backgroundColor: "#EAEFF8",
    marginBottom: 16,
  },
  verdictText: {
    fontSize: 12,
    fontWeight: 700,
    color: NAVY,
  },
  verdictSubtext: {
    fontSize: 10,
    color: MUTED,
    marginTop: 2,
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 6,
  },
  table: {
    display: "flex",
    flexDirection: "column",
    border: `1px solid ${BORDER}`,
    borderRadius: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: `1px solid ${BORDER}`,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableRowLast: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottom: `1px solid ${BORDER}`,
  },
  colTrade: { width: "25%", fontSize: 9 },
  colDesc: { width: "40%", fontSize: 9, color: MUTED },
  colQty: { width: "15%", fontSize: 9, textAlign: "right" },
  colTotal: { width: "20%", fontSize: 9, textAlign: "right", fontWeight: 700 },
  headerCell: { fontSize: 9, fontWeight: 700, color: MUTED },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalsLabel: { fontSize: 10, color: MUTED },
  totalsValue: { fontSize: 10, fontWeight: 700 },
  permitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottom: `1px solid ${BORDER}`,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: MUTED,
    borderTop: `1px solid ${BORDER}`,
    paddingTop: 8,
  },
});

function formatCad(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(amount);
}

const VERDICT_LABEL: Record<Report["estimate"]["verdict"], string> = {
  "within-budget": "Within budget",
  tight: "Tight against budget",
  "over-budget": "Over budget",
};

export function ReportPdfDocument({ report }: { report: Report }) {
  const { estimate, deliveredPlan, narrative } = report;
  const cost = deliveredPlan.adminAdjustedCost ?? estimate.cost;

  return (
    <Document
      title={`CareBy Canada — Renovation Report`}
      author="CareBy Canada"
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>CareBy Canada</Text>
        <Text style={styles.title}>Your Renovation Report</Text>
        <Text style={styles.subtitle}>
          {estimate.vision.roomType} · {estimate.scopeLevel.replace("-", " ")}{" "}
          · Generated {new Date(deliveredPlan.deliveredAt).toLocaleDateString("en-CA")}
        </Text>

        <View style={styles.verdictBox}>
          <Text style={styles.verdictText}>
            {VERDICT_LABEL[estimate.verdict]}
          </Text>
          <Text style={styles.verdictSubtext}>
            {formatCad(cost.totalLow)} – {formatCad(cost.totalHigh)} vs. your{" "}
            {formatCad(estimate.budgetCad)} budget
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.paragraph}>{narrative.summary}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Condition overview</Text>
          <Text style={styles.paragraph}>{narrative.conditionOverview}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Concept &amp; layout</Text>
          <Text style={styles.paragraph}>{narrative.scopeRationale}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cost breakdown</Text>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.colTrade, styles.headerCell]}>Trade</Text>
              <Text style={[styles.colDesc, styles.headerCell]}>
                Description
              </Text>
              <Text style={[styles.colQty, styles.headerCell]}>Qty</Text>
              <Text style={[styles.colTotal, styles.headerCell]}>Total</Text>
            </View>
            {cost.lineItems.map((item, index) => (
              <View
                key={`${item.trade}-${index}`}
                style={
                  index === cost.lineItems.length - 1
                    ? styles.tableRowLast
                    : styles.tableRow
                }
              >
                <Text style={styles.colTrade}>{item.trade}</Text>
                <Text style={styles.colDesc}>{item.description}</Text>
                <Text style={styles.colQty}>
                  {item.quantity} {item.unit}
                </Text>
                <Text style={styles.colTotal}>
                  {formatCad(item.totalCad)}
                </Text>
              </View>
            ))}
          </View>

          <View style={{ marginTop: 8 }}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>
                {formatCad(cost.subtotal)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                Contingency ({Math.round(cost.contingencyPct * 100)}%)
              </Text>
              <Text style={styles.totalsValue}>
                {formatCad(cost.contingency)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Permit fees</Text>
              <Text style={styles.totalsValue}>
                {formatCad(cost.permitFees)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>HST (13%)</Text>
              <Text style={styles.totalsValue}>{formatCad(cost.hst)}</Text>
            </View>
            <View style={[styles.totalsRow, { marginTop: 4 }]}>
              <Text style={[styles.totalsLabel, { fontWeight: 700 }]}>
                Estimated range
              </Text>
              <Text style={styles.totalsValue}>
                {formatCad(cost.totalLow)} – {formatCad(cost.totalHigh)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permit checklist</Text>
          {estimate.permits.length === 0 ? (
            <Text style={styles.paragraph}>
              No permits required for this scope of work.
            </Text>
          ) : (
            estimate.permits.map((permit) => (
              <View key={permit.id} style={styles.permitRow}>
                <Text style={{ fontSize: 9 }}>
                  {permit.label} — {permit.authority}
                </Text>
                <Text style={{ fontSize: 9, fontWeight: 700 }}>
                  {permit.required ? "Required" : "If applicable"}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Designer notes</Text>
          <Text style={styles.paragraph}>{deliveredPlan.planNotes}</Text>
          <Text style={[styles.paragraph, { color: MUTED, fontSize: 9 }]}>
            — {deliveredPlan.deliveredBy}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget guidance &amp; next steps</Text>
          <Text style={styles.paragraph}>{narrative.budgetGuidance}</Text>
          <Text style={styles.paragraph}>{narrative.nextSteps}</Text>
        </View>

        <Text style={styles.footer}>
          This report is indicative planning guidance only. It is not a
          permit submission, a building code determination, or a
          construction contract. Confirm final scope, pricing, and code
          compliance with a licensed contractor and your local building
          authority before any work begins. Instant AI estimate; full plan
          designed by hand by a CareBy Canada designer.
        </Text>
      </Page>
    </Document>
  );
}
