/** Newsletter drop email HTML (automatic + manual sends). */

export function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Inbox subject line
 */
export function buildDropSubject(productName, opts = {}) {
  const safe = String(productName ?? "ZOYA")
    .replace(/[\r\n\u0000]+/g, " ")
    .trim()
    .slice(0, 100);
  if (opts.manual) return `PRIORITY ACCESS: ${safe} ⚡`;
  return `JUST DROPPED: ${safe} ⚡`;
}

/**
 * Main Template
 */
function buildDropHtml(product, productUrl, copy) {
  const price = Number(product?.price ?? 0);
  const priceText = escapeHtml(
    Number.isFinite(price) ? price.toLocaleString("en-EG") : "0"
  );
  const urgency = copy.urgencyLine || "STRICTLY LIMITED QUANTITIES. ONCE IT'S GONE, IT'S GONE.";
  const preheaderText = escapeHtml(copy.preheader || "New Drop from ZOYA inside.");

  return `
  <div style="margin:0;padding:0;background:#000000;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:transparent;width:0;height:0;mso-hide:all;">
      ${preheaderText}
    </div>
    
    <div style="max-width:600px;margin:0 auto;background:#000000;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#ffffff;">
      
      <!-- HERO SECTION -->
      ${product?.image ? `
        <div style="position:relative; width:100%;">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" 
               style="width:100%; display:block; height:auto; max-height:800px; object-fit:cover;" />
          
          <!-- OVERLAY GRADIENT -->
          <div style="position:absolute; top:0; left:0; right:0; bottom:0; background:linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 40%);"></div>
          
          <!-- FLOATING BADGE & TITLE -->
          <div style="position:absolute; bottom:40px; left:20px; right:20px; text-align:left;">
            <div style="display:inline-block; padding:6px 12px; background:#ffffff; color:#000; font-size:10px; font-weight:900; letter-spacing:3px; text-transform:uppercase; margin-bottom:15px;">
              ${escapeHtml(copy.badge)}
            </div>
            <h1 style="margin:0; font-size:56px; line-height:0.9; font-weight:900; letter-spacing:-3px; text-transform:uppercase; font-style: italic;">
              ${escapeHtml(product.name)}
            </h1>
          </div>
        </div>
      ` : ""}

      <!-- PRODUCT INFO -->
      <div style="padding:40px 25px; border-left: 1px solid #222; border-right: 1px solid #222;">
        
        <p style="margin:0 0 25px; color:#ffffff; font-size:18px; line-height:1.4; font-weight: 300; letter-spacing: -0.5px; text-transform: uppercase;">
          ${escapeHtml(copy.lead)}
        </p>

        <div style="margin-bottom:30px; border-bottom: 1px solid #222; padding-bottom:30px;">
           <span style="font-size:42px; font-weight:900; letter-spacing:-2px;">${priceText}</span>
           <span style="font-size:14px; color:#666; font-weight:600; vertical-align: super; margin-left:5px;">EGP</span>
        </div>

        <!-- CALL TO ACTION -->
        <a href="${escapeHtml(productUrl)}" style="display:block; background:#ffffff; color:#000000; text-decoration:none; padding:22px; text-align:center; font-size:16px; font-weight:900; letter-spacing:4px; text-transform:uppercase;">
          GET IT NOW &rarr;
        </a>

        <!-- URGENCY BOX -->
        <div style="margin-top:40px; padding:20px; border:1px solid #ff2d8d; text-align:center;">
          <p style="margin:0; color:#ff2d8d; font-size:12px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase;">
            ${escapeHtml(urgency)}
          </p>
        </div>
      </div>

      <!-- FOOTER -->
      <div style="padding:60px 25px; text-align:center; background:#000;">
        <div style="font-size:28px; font-weight:900; letter-spacing:8px; margin-bottom:20px; color:#fff;">ZOYA</div>
        <div style="width:40px; height:2px; background:#ff2d8d; margin: 0 auto 30px;"></div>
        
        <p style="color:#444; font-size:11px; line-height:1.6; letter-spacing: 0.5px;">
          STREETWEAR ENERGY. PREMIUM IDENTITY.<br/>
          You're receiving this because you're part of the inner circle.<br/><br/>
          &copy; ${new Date().getFullYear()} ZOYA. GLOBAL OPS.
        </p>
        
        <div style="margin-top:20px;">
          <a href="https://instagram.com/zoya" style="color:#888; text-decoration:none; font-size:10px; font-weight:bold; letter-spacing:2px; text-transform:uppercase;">INSTAGRAM</a>
        </div>
      </div>
    </div>
  </div>
  `;
}

/** Automatic scheduled-style copy */
export function buildAutomaticDropHtml(product, productUrl) {
  return buildDropHtml(product, productUrl, {
    badge: "NEW ARRIVAL",
    lead: "The wait is over. Uncompromising style, engineered for the streets. Elevate your rotation.",
    preheader: "DROP ALERT: The new standard is here. Shop ZOYA.",
  });
}

/** Manual send variant */
export function buildManualDropHtml(product, productUrl) {
  return buildDropHtml(product, productUrl, {
    badge: "EXCLUSIVE ACCESS",
    lead: "We saved the best for the inner circle. Curated selections for those who know the difference.",
    preheader: "You have priority access to the latest ZOYA drop.",
    urgencyLine: "LOW STOCK DETECTED. ONCE THESE SIZES ARE GONE, THEY ARE GONE FOR GOOD.",
  });
}