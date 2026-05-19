import { createClient } from "@supabase/supabase-js";
import { getProductStockMap } from "../../../../sanity/lib/products";
import {
  buildInventoryAlerts,
  LOW_STOCK_THRESHOLD,
} from "../../../lib/inventoryAlerts";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function isAuthorizedAdmin(req) {
  const adminPass = process.env.ADMIN_PASS;
  if (!adminPass) return false;
  const provided = req.headers.get("x-admin-pass");
  return provided === adminPass;
}

function colorNameOf(raw) {
  if (!raw) return "";
  if (typeof raw === "string") return raw.trim();
  return (raw.name || "").toString().trim();
}

export async function GET(req) {
  try {
    if (!isAuthorizedAdmin(req)) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Pull stock map (Sanity) and orders (Supabase) in parallel — the API
    // call is admin-only so we can afford the heavier query here.
    const [stockMap, ordersRes] = await Promise.all([
      getProductStockMap(),
      supabase
        .from("orders")
        .select("status, items, total_price, created_at"),
    ]);

    if (ordersRes.error) {
      console.error(
        "[products/analytics] orders fetch failed:",
        ordersRes.error
      );
      return Response.json(
        { success: false, error: ordersRes.error.message },
        { status: 500 }
      );
    }

    // Aggregate sales per (productId → color → size).
    // We exclude cancelled orders since those units never actually shipped.
    const salesByProduct = new Map();
    let totalUnitsSoldAll = 0;
    let totalRevenueAll = 0;
    const colorTotals = new Map(); // color name → units (across ALL products)
    const sizeTotals = new Map(); // size → units (across ALL products)

    for (const order of ordersRes.data || []) {
      if (order?.status === "cancelled") continue;
      const items = Array.isArray(order?.items) ? order.items : [];
      for (const it of items) {
        const id = String(it?.id || "");
        if (!id) continue;
        const qty = Math.max(0, Math.floor(Number(it?.quantity) || 0));
        if (qty === 0) continue;
        const price = Number(it?.price) || 0;
        const colorName = colorNameOf(it?.color) || "—";
        const size = (it?.size || "").toString().trim() || "—";

        let entry = salesByProduct.get(id);
        if (!entry) {
          entry = {
            id,
            name: it?.name || id,
            image: it?.image || null,
            unitsSold: 0,
            revenue: 0,
            colors: new Map(), // colorName → { units, sizes: Map<size, units> }
          };
          salesByProduct.set(id, entry);
        }
        entry.unitsSold += qty;
        entry.revenue += price * qty;
        // Keep the latest non-empty image we've seen for this product.
        if (!entry.image && it?.image) entry.image = it.image;

        let colorBucket = entry.colors.get(colorName);
        if (!colorBucket) {
          colorBucket = { units: 0, sizes: new Map() };
          entry.colors.set(colorName, colorBucket);
        }
        colorBucket.units += qty;
        colorBucket.sizes.set(
          size,
          (colorBucket.sizes.get(size) || 0) + qty
        );

        totalUnitsSoldAll += qty;
        totalRevenueAll += price * qty;
        colorTotals.set(colorName, (colorTotals.get(colorName) || 0) + qty);
        sizeTotals.set(size, (sizeTotals.get(size) || 0) + qty);
      }
    }

    // Merge stock + sales into the final product list. Products that have a
    // stock entry but no sales still appear (so the admin can see what's in
    // inventory). Products with sales but no Sanity match also appear (deleted
    // products) so the admin doesn't lose history.
    const productMap = new Map();

    if (stockMap) {
      for (const [id, info] of Object.entries(stockMap)) {
        productMap.set(String(id), {
          id,
          name: info.name,
          tracked: info.tracked,
          image: info.image || null,
          totalStock: info.totalStock,
          totalInitial: info.totalInitial,
          byColor: info.byColor,
          unitsSold: 0,
          revenue: 0,
          salesByColor: [],
        });
      }
    }

    for (const [id, sales] of salesByProduct.entries()) {
      let target = productMap.get(id);
      if (!target) {
        target = {
          id,
          name: sales.name,
          tracked: false,
          totalStock: 0,
          totalInitial: 0,
          byColor: [],
          unitsSold: 0,
          revenue: 0,
          salesByColor: [],
        };
        productMap.set(id, target);
      }
      target.unitsSold = sales.unitsSold;
      target.revenue = sales.revenue;
      target.image = target.image || sales.image;
      target.salesByColor = Array.from(sales.colors.entries()).map(
        ([colorName, bucket]) => ({
          name: colorName,
          units: bucket.units,
          sizes: Array.from(bucket.sizes.entries())
            .map(([s, u]) => ({ size: s, units: u }))
            .sort((a, b) => b.units - a.units),
        })
      );
      target.salesByColor.sort((a, b) => b.units - a.units);
    }

    const products = Array.from(productMap.values()).sort(
      (a, b) => b.unitsSold - a.unitsSold
    );

    const colorTotalsArr = Array.from(colorTotals.entries())
      .map(([name, units]) => ({ name, units }))
      .sort((a, b) => b.units - a.units);

    const sizeTotalsArr = Array.from(sizeTotals.entries())
      .map(([size, units]) => ({ size, units }))
      .sort((a, b) => b.units - a.units);

    const trackedProducts = products.filter((p) => p.tracked);
    const totalStock = trackedProducts.reduce(
      (sum, p) => sum + (p.totalStock || 0),
      0
    );
    const totalInitial = trackedProducts.reduce(
      (sum, p) => sum + (p.totalInitial || 0),
      0
    );

    const inventory = buildInventoryAlerts(stockMap);

    return Response.json({
      success: true,
      products,
      summary: {
        totalUnitsSold: totalUnitsSoldAll,
        totalRevenue: totalRevenueAll,
        uniqueProducts: products.filter((p) => p.unitsSold > 0).length,
        trackedProducts: inventory.summary.trackedProducts,
        untrackedProducts: inventory.summary.untrackedProducts,
        totalStock,
        totalInitial,
        lowStock: inventory.summary.lowStock,
        outOfStock: inventory.summary.outOfStock,
        oversold: inventory.summary.oversold,
        lowStockThreshold: LOW_STOCK_THRESHOLD,
        colorsWithoutStock: inventory.summary.colorsWithoutStock,
        missingSizes: inventory.summary.missingSizes,
        variantOut: inventory.summary.variantOut,
        variantLow: inventory.summary.variantLow,
        variantOversold: inventory.summary.variantOversold,
        catalogIssues: inventory.summary.catalogIssues,
      },
      alerts: inventory.alerts,
      stockAlerts: inventory.stockAlerts,
      catalogAlerts: inventory.catalogAlerts,
      colorTotals: colorTotalsArr,
      sizeTotals: sizeTotalsArr,
      stockUnavailable: stockMap === null,
    });
  } catch (err) {
    console.error("[products/analytics] unexpected:", err);
    return Response.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
