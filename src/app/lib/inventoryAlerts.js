/** Keep in sync with admin analytics + ProductRow badges. */
export const LOW_STOCK_THRESHOLD = 3;

const DEFAULT_SIZES = ["S", "M", "L"];

/** oversold (<0) | out (0) | low (1..threshold) | ok */
export function getStockLevel(stock) {
  const n = Number(stock) || 0;
  if (n < 0) return "oversold";
  if (n === 0) return "out";
  if (n <= LOW_STOCK_THRESHOLD) return "low";
  return "ok";
}

function productSizesList(info) {
  return Array.isArray(info?.sizes) && info.sizes.length
    ? info.sizes.filter(Boolean)
    : DEFAULT_SIZES;
}

/**
 * Build stock + catalog alerts from Sanity stock map (getProductStockMap).
 * @param {Record<string, object>|null} stockMap
 */
export function buildInventoryAlerts(stockMap) {
  const stockAlerts = [];
  const catalogAlerts = [];
  const productAlerts = new Map();

  let trackedProducts = 0;
  let untrackedProducts = 0;
  let outOfStock = 0;
  let oversold = 0;
  let lowStock = 0;
  let colorsWithoutStock = 0;
  let missingSizes = 0;
  let variantOut = 0;
  let variantLow = 0;
  let variantOversold = 0;

  const entries = stockMap ? Object.entries(stockMap) : [];

  for (const [id, info] of entries) {
    const name = info?.name || id;
    const expectedSizes = productSizesList(info);

    if (!info?.tracked) {
      untrackedProducts += 1;
      catalogAlerts.push({
        type: "untracked",
        severity: "warning",
        productId: id,
        productName: name,
        message: `${name}: stock not configured (add Stock by Size per color in Sanity)`,
      });
      continue;
    }

    trackedProducts += 1;
    const totalStock = Number(info.totalStock) || 0;

    if (totalStock < 0) oversold += 1;
    else if (totalStock === 0) outOfStock += 1;
    else if (totalStock <= LOW_STOCK_THRESHOLD) lowStock += 1;

    for (const color of info.byColor || []) {
      const colorName = color?.name || "Default";
      const colorSizes = Array.isArray(color.sizes) ? color.sizes : [];

      if (colorSizes.length === 0) {
        colorsWithoutStock += 1;
        catalogAlerts.push({
          type: "color_no_stock",
          severity: "error",
          productId: id,
          productName: name,
          colorName,
          message: `${name} · ${colorName}: no stock rows configured`,
        });
        continue;
      }

      const configured = new Set(colorSizes.map((s) => s.size));
      for (const size of expectedSizes) {
        if (!configured.has(size)) {
          missingSizes += 1;
          catalogAlerts.push({
            type: "missing_size",
            severity: "error",
            productId: id,
            productName: name,
            colorName,
            size,
            message: `${name} · ${colorName}: missing size ${size}`,
          });
        }
      }

      for (const row of colorSizes) {
        const stock = Number(row.stock) || 0;
        let severity = null;
        if (stock < 0) {
          severity = "oversold";
          variantOversold += 1;
        } else if (stock === 0) {
          severity = "out";
          variantOut += 1;
        } else if (stock <= LOW_STOCK_THRESHOLD) {
          severity = "low";
          variantLow += 1;
        }

        if (!severity) continue;

        stockAlerts.push({
          type: "variant",
          severity,
          productId: id,
          productName: name,
          colorName,
          size: row.size,
          stock,
          message:
            severity === "oversold"
              ? `${name} · ${colorName} ${row.size}: oversold (${stock})`
              : severity === "out"
                ? `${name} · ${colorName} ${row.size}: out of stock`
                : `${name} · ${colorName} ${row.size}: low (${stock} left)`,
        });
      }
    }

    // Product-level rollup for legacy banner (worst severity per product).
    let productSeverity = null;
    if (totalStock < 0) productSeverity = "oversold";
    else if (totalStock === 0) productSeverity = "out";
    else if (totalStock <= LOW_STOCK_THRESHOLD) productSeverity = "low";

    if (productSeverity) {
      productAlerts.set(id, {
        id,
        name,
        image: info.image || null,
        totalStock,
        totalInitial: info.totalInitial || 0,
        severity: productSeverity,
      });
    }
  }

  const alerts = Array.from(productAlerts.values()).sort(
    (a, b) => a.totalStock - b.totalStock,
  );

  return {
    alerts,
    stockAlerts,
    catalogAlerts,
    summary: {
      trackedProducts,
      untrackedProducts,
      outOfStock,
      oversold,
      lowStock,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      colorsWithoutStock,
      missingSizes,
      variantOut,
      variantLow,
      variantOversold,
      catalogIssues: catalogAlerts.length,
      totalStockAlerts: stockAlerts.length + alerts.length,
    },
  };
}

function stockIssueCount({ summary = {}, stockAlerts = [], alerts = [] }) {
  if (stockAlerts.length > 0) return stockAlerts.length;
  const variantIssues =
    (summary.variantOut || 0) +
    (summary.variantLow || 0) +
    (summary.variantOversold || 0);
  if (variantIssues > 0) return variantIssues;
  const productLevel =
    (summary.outOfStock || 0) +
    (summary.oversold || 0) +
    (summary.lowStock || 0);
  if (productLevel > 0) return productLevel;
  return alerts.length;
}

export function countInventoryNotifications(payload = {}) {
  const {
    summary = {},
    catalogAlerts = [],
    stockAlerts = [],
    alerts = [],
  } = payload;
  const catalogCount = catalogAlerts.length;
  const stockCount = stockIssueCount({ summary, stockAlerts, alerts });

  const urgentFromVariants =
    stockAlerts.length > 0
      ? stockAlerts.filter(
          (a) => a.severity === "oversold" || a.severity === "out",
        ).length
      : (summary.variantOversold || 0) + (summary.variantOut || 0);

  const urgentCount =
    urgentFromVariants +
    (summary.outOfStock || 0) +
    (summary.oversold || 0) +
    catalogAlerts.filter((a) => a.severity === "error").length;

  return {
    total: catalogCount + stockCount,
    urgent: urgentCount,
    catalog: catalogCount,
    stock: stockCount,
    lowOnly:
      ((summary.lowStock || 0) + (summary.variantLow || 0) > 0) &&
      urgentCount === 0 &&
      catalogCount === 0,
  };
}
