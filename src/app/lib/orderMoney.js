/** Sum line-item prices (products only — no shipping). */
export function orderItemsSubtotal(order) {
  return Array.isArray(order?.items)
    ? order.items.reduce(
        (sum, it) => sum + Number(it.price ?? 0) * Number(it.quantity ?? 0),
        0,
      )
    : Math.max(
        0,
        Number(order?.total_price ?? 0) - Number(order?.shipping_fee ?? 0),
      );
}

/** Product revenue after discount; shipping excluded. */
export function orderNetRevenue(order) {
  if (order?.status === "cancelled") return 0;
  const discount = Number(order?.discount_amount ?? 0);
  return Math.max(0, orderItemsSubtotal(order) - discount);
}

/** Raw profit on products (shipping excluded). Always a number unless cancelled. */
export function computeOrderProfit(order) {
  if (order?.status === "cancelled") return null;
  const totalCost = Number(order?.total_cost ?? 0);
  return orderNetRevenue(order) - totalCost;
}

/** Profit for dashboards — null when cost data is incomplete. */
export function orderProfit(order) {
  if (order?.status === "cancelled") return null;
  if (order?.cost_complete === false) return null;
  return computeOrderProfit(order);
}
