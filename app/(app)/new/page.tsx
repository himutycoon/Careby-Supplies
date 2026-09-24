import type { Metadata } from "next";
import { WizardShell } from "@/components/wizard/wizard-shell";

export const metadata: Metadata = { title: "New Estimate — CareBy Supplies" };

export default function NewEstimatePage() {
  return <WizardShell />;
}
