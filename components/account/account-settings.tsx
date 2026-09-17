"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/shared/toast";
import { PanelSkeleton } from "@/components/shared/skeleton";
import {
  EMPTY_CONTRACTOR_PROFILE,
  EMPTY_HOMEOWNER_PROFILE,
  PROVINCES,
  getContractorProfile,
  getHomeownerProfile,
  getMyProfile,
  saveContractorProfile,
  saveHomeownerProfile,
  updateMyProfile,
  type ContractorProfile,
  type HomeownerProfile,
} from "@/services/profile";
import type { UserRole } from "@/lib/types";

const VERIFICATION_COPY: Record<
  ContractorProfile["verificationStatus"],
  { label: string; description: string }
> = {
  pending: {
    label: "Pending review",
    description:
      "A CareBy admin reviews new business details before trade pricing is confirmed.",
  },
  verified: {
    label: "Verified",
    description: "Your business is verified for trade pricing.",
  },
  rejected: {
    label: "Needs attention",
    description:
      "We couldn't verify these details. Update them and we'll take another look.",
  },
  suspended: {
    label: "Suspended",
    description: "Contact support to restore your trade account.",
  },
};

/** Shared section shell so every card on the page lines up. */
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <h2 className="text-xl">{title}</h2>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">{description}</p>
      {children}
    </section>
  );
}

/** Two-up on tablet and wider, stacked on phones. */
function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

export function AccountSettings({ role }: { role: UserRole }) {
  const { toast } = useToast();

  const [loading, setLoading] = React.useState(true);
  const [email, setEmail] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [savingProfile, setSavingProfile] = React.useState(false);

  const [contractor, setContractor] = React.useState<ContractorProfile>(
    EMPTY_CONTRACTOR_PROFILE,
  );
  const [homeowner, setHomeowner] = React.useState<HomeownerProfile>(
    EMPTY_HOMEOWNER_PROFILE,
  );
  const [savingRole, setSavingRole] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      const profile = await getMyProfile();
      if (!cancelled && profile) {
        setEmail(profile.email);
        setFullName(profile.fullName);
        setPhone(profile.phone);
      }

      if (role === "contractor") {
        const existing = await getContractorProfile();
        if (!cancelled && existing) setContractor(existing);
      } else if (role === "homeowner") {
        const existing = await getHomeownerProfile();
        if (!cancelled && existing) setHomeowner(existing);
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [role]);

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProfile(true);
    const result = await updateMyProfile({ fullName, phone });
    setSavingProfile(false);
    toast(result.ok ? "Details saved" : result.error, result.ok ? "success" : "error");
  }

  async function handleContractorSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setSavingRole(true);
    const result = await saveContractorProfile({
      companyName: contractor.companyName,
      businessDescription: contractor.businessDescription,
      licenseNumber: contractor.licenseNumber,
      address: contractor.address,
      city: contractor.city,
      province: contractor.province,
      postalCode: contractor.postalCode,
      website: contractor.website,
    });
    setSavingRole(false);
    toast(
      result.ok ? "Business details saved" : result.error,
      result.ok ? "success" : "error",
    );
  }

  async function handleHomeownerSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setSavingRole(true);
    const result = await saveHomeownerProfile(homeowner);
    setSavingRole(false);
    toast(
      result.ok ? "Address saved" : result.error,
      result.ok ? "success" : "error",
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PanelSkeleton />
        <PanelSkeleton />
      </div>
    );
  }

  const verification = VERIFICATION_COPY[contractor.verificationStatus];

  return (
    <div className="flex flex-col gap-6">
      <Section
        title="Your details"
        description="Used on orders, quotes and anything we send you."
      >
        <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
          <FieldRow>
            <div className="flex flex-col gap-2">
              <Label htmlFor="account-name">Full name</Label>
              <Input
                id="account-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="account-phone">Phone</Label>
              <Input
                id="account-phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                placeholder="(416) 555-0134"
              />
            </div>
          </FieldRow>

          <div className="flex flex-col gap-2">
            <Label htmlFor="account-email">Email</Label>
            <Input id="account-email" value={email} readOnly disabled />
            <p className="text-xs text-muted-foreground">
              Email is tied to your login and can&apos;t be changed here.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Account type</span>
            <Badge variant="secondary" className="capitalize">
              {role}
            </Badge>
          </div>

          <Button
            type="submit"
            size="lg"
            className="press w-full sm:w-auto sm:self-start"
            disabled={savingProfile}
          >
            {savingProfile ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Save details"
            )}
          </Button>
        </form>
      </Section>

      {role === "contractor" ? (
        <Section
          title="Business details"
          description="What we verify before switching your account to trade pricing."
        >
          <div className="mb-5 flex flex-col gap-1.5 rounded-lg border border-border bg-muted/40 p-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Verification</span>
              <Badge
                variant={
                  contractor.verificationStatus === "verified"
                    ? "default"
                    : "secondary"
                }
              >
                {verification.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {verification.description}
            </p>
          </div>

          <form onSubmit={handleContractorSubmit} className="flex flex-col gap-4">
            <FieldRow>
              <div className="flex flex-col gap-2">
                <Label htmlFor="company-name">Company name</Label>
                <Input
                  id="company-name"
                  value={contractor.companyName}
                  onChange={(e) =>
                    setContractor((c) => ({ ...c, companyName: e.target.value }))
                  }
                  autoComplete="organization"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="license-number">Licence number</Label>
                <Input
                  id="license-number"
                  value={contractor.licenseNumber}
                  onChange={(e) =>
                    setContractor((c) => ({
                      ...c,
                      licenseNumber: e.target.value,
                    }))
                  }
                  placeholder="Optional"
                />
              </div>
            </FieldRow>

            <div className="flex flex-col gap-2">
              <Label htmlFor="business-description">What you do</Label>
              <Textarea
                id="business-description"
                value={contractor.businessDescription}
                onChange={(e) =>
                  setContractor((c) => ({
                    ...c,
                    businessDescription: e.target.value,
                  }))
                }
                rows={3}
                placeholder="Trades you cover, typical project size, service area…"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="business-address">Street address</Label>
              <Input
                id="business-address"
                value={contractor.address}
                onChange={(e) =>
                  setContractor((c) => ({ ...c, address: e.target.value }))
                }
                autoComplete="street-address"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="business-city">City</Label>
                <Input
                  id="business-city"
                  value={contractor.city}
                  onChange={(e) =>
                    setContractor((c) => ({ ...c, city: e.target.value }))
                  }
                  autoComplete="address-level2"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="business-province">Province</Label>
                <select
                  id="business-province"
                  value={contractor.province}
                  onChange={(e) =>
                    setContractor((c) => ({ ...c, province: e.target.value }))
                  }
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {PROVINCES.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="business-postal">Postal code</Label>
                <Input
                  id="business-postal"
                  value={contractor.postalCode}
                  onChange={(e) =>
                    setContractor((c) => ({ ...c, postalCode: e.target.value }))
                  }
                  autoComplete="postal-code"
                  placeholder="M5V 2T6"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="business-website">Website</Label>
              <Input
                id="business-website"
                type="url"
                inputMode="url"
                value={contractor.website}
                onChange={(e) =>
                  setContractor((c) => ({ ...c, website: e.target.value }))
                }
                placeholder="https://"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="press w-full sm:w-auto sm:self-start"
              disabled={savingRole}
            >
              {savingRole ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Save business details"
              )}
            </Button>
          </form>
        </Section>
      ) : null}

      {role === "homeowner" ? (
        <Section
          title="Property address"
          description="Where we deliver materials and scope site visits."
        >
          <form onSubmit={handleHomeownerSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="home-address">Street address</Label>
              <Input
                id="home-address"
                value={homeowner.address}
                onChange={(e) =>
                  setHomeowner((h) => ({ ...h, address: e.target.value }))
                }
                autoComplete="street-address"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="home-city">City</Label>
                <Input
                  id="home-city"
                  value={homeowner.city}
                  onChange={(e) =>
                    setHomeowner((h) => ({ ...h, city: e.target.value }))
                  }
                  autoComplete="address-level2"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="home-province">Province</Label>
                <select
                  id="home-province"
                  value={homeowner.province}
                  onChange={(e) =>
                    setHomeowner((h) => ({ ...h, province: e.target.value }))
                  }
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {PROVINCES.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="home-postal">Postal code</Label>
                <Input
                  id="home-postal"
                  value={homeowner.postalCode}
                  onChange={(e) =>
                    setHomeowner((h) => ({ ...h, postalCode: e.target.value }))
                  }
                  autoComplete="postal-code"
                  placeholder="M5V 2T6"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="press w-full sm:w-auto sm:self-start"
              disabled={savingRole}
            >
              {savingRole ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Save address"
              )}
            </Button>
          </form>
        </Section>
      ) : null}
    </div>
  );
}
