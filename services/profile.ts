import { createClient } from "@/lib/supabase/client";
import { fail, ok, toUserMessage, type ServiceResult } from "@/services/client";
import type { UserRole } from "@/lib/types";

/**
 * Account + role-specific profile data.
 *
 * Until this existed nothing ever inserted a contractor_profiles row, so
 * the admin verification queue was permanently empty. Writes go through
 * the anon client and rely on the RLS policies from migration 05 (a user
 * may only touch their own row).
 */

export interface AccountProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
}

export interface ContractorProfile {
  companyName: string;
  businessDescription: string;
  licenseNumber: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  website: string;
  /** Set by admins only — read-only here. */
  verificationStatus: "pending" | "verified" | "rejected" | "suspended";
}

export interface HomeownerProfile {
  address: string;
  city: string;
  province: string;
  postalCode: string;
}

export const EMPTY_CONTRACTOR_PROFILE: ContractorProfile = {
  companyName: "",
  businessDescription: "",
  licenseNumber: "",
  address: "",
  city: "",
  province: "ON",
  postalCode: "",
  website: "",
  verificationStatus: "pending",
};

export const EMPTY_HOMEOWNER_PROFILE: HomeownerProfile = {
  address: "",
  city: "",
  province: "ON",
  postalCode: "",
};

export const PROVINCES = [
  "AB",
  "BC",
  "MB",
  "NB",
  "NL",
  "NS",
  "NT",
  "NU",
  "ON",
  "PE",
  "QC",
  "SK",
  "YT",
] as const;

export async function getMyProfile(): Promise<AccountProfile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id as string,
    // profiles.email can lag behind auth for pre-migration rows.
    email: (data.email as string) || (user.email ?? ""),
    fullName: (data.full_name as string) ?? "",
    phone: (data.phone as string) ?? "",
    role: (data.role as UserRole) ?? "homeowner",
  };
}

export async function updateMyProfile(input: {
  fullName: string;
  phone: string;
}): Promise<ServiceResult<true>> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Please log in again.");

  if (!input.fullName.trim()) return fail("Enter your name.");

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName.trim(),
      phone: input.phone.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("[updateMyProfile]", error);
    return fail(toUserMessage(error, "We couldn't save your details."));
  }
  return ok(true);
}

export async function getContractorProfile(): Promise<ContractorProfile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("contractor_profiles")
    .select(
      "company_name, business_description, license_number, address, city, province, postal_code, website, verification_status",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  // No row yet is the normal first-visit case, not an error.
  if (error || !data) return null;

  return {
    companyName: (data.company_name as string) ?? "",
    businessDescription: (data.business_description as string) ?? "",
    licenseNumber: (data.license_number as string) ?? "",
    address: (data.address as string) ?? "",
    city: (data.city as string) ?? "",
    province: (data.province as string) ?? "ON",
    postalCode: (data.postal_code as string) ?? "",
    website: (data.website as string) ?? "",
    verificationStatus:
      (data.verification_status as ContractorProfile["verificationStatus"]) ??
      "pending",
  };
}

export async function saveContractorProfile(
  input: Omit<ContractorProfile, "verificationStatus">,
): Promise<ServiceResult<true>> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Please log in again.");

  if (!input.companyName.trim()) return fail("Enter your company name.");

  // verification_status is deliberately absent: only an admin may change
  // it, and sending it here would let a contractor self-verify.
  const { error } = await supabase.from("contractor_profiles").upsert(
    {
      user_id: user.id,
      company_name: input.companyName.trim(),
      business_description: input.businessDescription.trim(),
      license_number: input.licenseNumber.trim(),
      address: input.address.trim(),
      city: input.city.trim(),
      province: input.province,
      postal_code: input.postalCode.trim(),
      website: input.website.trim(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("[saveContractorProfile]", error);
    return fail(toUserMessage(error, "We couldn't save your business details."));
  }
  return ok(true);
}

export async function getHomeownerProfile(): Promise<HomeownerProfile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("homeowner_profiles")
    .select("address, city, province, postal_code")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    address: (data.address as string) ?? "",
    city: (data.city as string) ?? "",
    province: (data.province as string) ?? "ON",
    postalCode: (data.postal_code as string) ?? "",
  };
}

export async function saveHomeownerProfile(
  input: HomeownerProfile,
): Promise<ServiceResult<true>> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Please log in again.");

  const { error } = await supabase.from("homeowner_profiles").upsert(
    {
      user_id: user.id,
      address: input.address.trim(),
      city: input.city.trim(),
      province: input.province,
      postal_code: input.postalCode.trim(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("[saveHomeownerProfile]", error);
    return fail(toUserMessage(error, "We couldn't save your address."));
  }
  return ok(true);
}

/**
 * The viewer's role, for presentation only.
 *
 * Used to decide whether to show trade or retail prices. It is never
 * authorization: the catalog price that ends up on an order is set by the
 * `enforce_order_item_price` trigger from the buyer's role in the
 * database, so lying about this changes what you see, never what you pay.
 *
 * Returns null when signed out, which reads as retail.
 */
export async function getMyRole(): Promise<UserRole | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return (data.role as UserRole) ?? "homeowner";
}
