import { createClient } from "@/lib/supabase/client";
import { fail, ok, toUserMessage, type ServiceResult } from "@/services/client";
import { calculateOrderTotals } from "@/lib/rules/order-totals";
import type { CartLine, Order, OrderStatus } from "@/lib/types";

export { calculateOrderTotals };
export type { OrderTotals } from "@/lib/rules/order-totals";

interface OrderRow {
  id: string;
  reference: string;
  user_id: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  delivery_method: string;
  contact: Order["contact"] | null;
  created_at: string;
  order_items?: OrderItemRow[];
}

interface OrderItemRow {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  project_id: string | null;
  products?: { name: string; brand: string; unit: string } | null;
}

function mapOrder(row: OrderRow): Order {
  return {
    id: row.reference,
    dbId: row.id,
    createdAt: row.created_at,
    status: row.status,
    subtotal: Number(row.subtotal),
    delivery: Number(row.shipping),
    tax: Number(row.tax),
    total: Number(row.total),
    deliveryMethod: row.delivery_method,
    contact: row.contact ?? {
      name: "",
      email: "",
      address: "",
      city: "",
      postalCode: "",
    },
    lines: (row.order_items ?? []).map((item) => ({
      productId: item.product_id,
      name: item.products?.name ?? item.product_id,
      brand: item.products?.brand ?? "",
      unit: item.products?.unit ?? "each",
      unitPriceCad: Number(item.unit_price),
      quantity: item.quantity,
      projectId: item.project_id ?? undefined,
    })),
  };
}

const ORDER_SELECT = `
  id, reference, user_id, status, subtotal, tax, shipping, total,
  delivery_method, contact, created_at,
  order_items ( product_id, quantity, unit_price, total_price, project_id,
                products ( name, brand, unit ) )
`;

export interface CreateOrderInput {
  lines: CartLine[];
  deliveryMethod: string;
  contact: Order["contact"];
  projectId?: string;
}

function generateReference(): string {
  return `ORD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

/**
 * Creates the order, then its items. Item prices and order totals are
 * recomputed by database triggers from the catalog — the client's idea
 * of price is never trusted (spec §12).
 */
export async function createOrder(
  input: CreateOrderInput,
): Promise<ServiceResult<Order>> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Please log in to place an order.");

  if (input.lines.length === 0) return fail("Your cart is empty.");
  if (input.lines.some((l) => l.quantity <= 0 || !Number.isFinite(l.quantity))) {
    return fail("Quantities must be greater than zero.");
  }
  if (!input.contact.name.trim() || !input.contact.email.trim()) {
    return fail("Contact name and email are required.");
  }

  const { data: created, error: orderError } = await supabase
    .from("orders")
    .insert({
      reference: generateReference(),
      user_id: user.id,
      project_id: input.projectId ?? null,
      order_type: "materials",
      delivery_method: input.deliveryMethod,
      contact: input.contact,
    })
    .select("id, reference")
    .single();

  if (orderError || !created) {
    console.error("[createOrder]", orderError);
    return fail(toUserMessage(orderError, "We couldn't create your order."));
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    input.lines.map((line) => ({
      order_id: created.id,
      product_id: line.productId,
      quantity: line.quantity,
      project_id: line.projectId ?? null,
    })),
  );

  if (itemsError) {
    console.error("[createOrder:items]", itemsError);
    // Roll back the empty order so no orphan remains.
    await supabase.from("orders").delete().eq("id", created.id);
    return fail(
      toUserMessage(itemsError, "We couldn't add those items to your order."),
    );
  }

  const order = await getOrderByReference(created.reference);
  if (!order) return fail("Order created, but we couldn't load it back.");
  return ok(order);
}

export async function getOrders(): Promise<Order[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as unknown as OrderRow[]).map(mapOrder);
}

export async function getOrderByReference(
  reference: string,
): Promise<Order | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("reference", reference)
    .maybeSingle();

  if (error || !data) return null;
  return mapOrder(data as unknown as OrderRow);
}

// Order status changes go through updateRecordStatus() in services/admin.ts,
// which every admin list screen shares. A second order-specific version
// only created two places for the same rule to drift.
