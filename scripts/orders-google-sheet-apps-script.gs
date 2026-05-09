/**
 * انسخ هذا الملف بالكامل إلى: الملف → Google Sheets الجدول الذي تريد المزامنة عليه
 * ثم Extensions → Apps Script → لصق الكود → Deploy → New deployment → Web app
 *   Execute as: Me
 *   Who has access: Anyone (أو Anyone with Google account حسب حاجتك)
 * خذ رابط /exec وضعه في Vercel: ORDERS_WEBHOOK_URL أو GOOGLE_SHEETS_WEBHOOK_URL
 *
 * في Project Settings → Script properties أضف:
 *   WEBHOOK_SECRET = نفس قيمة SUPABASE_DB_WEBHOOK_SECRET في السيرفر (اختياري لكن مُستحسن)
 *
 * الصفحة الأولى يجب أن تحتوي صف عنوان في السطر 1 (انظر ORDER_HEADERS أدناه).
 */

var SHEET_NAME = "Orders";

/** يطابق ترتيب الأعمدة في الصف 1 — غيّر الترتيب هنا إذا غيّرت الجدول */
var ORDER_HEADERS = [
  "order_id",
  "status",
  "customer_name",
  "phone",
  "email",
  "address",
  "governorate",
  "payment_method",
  "shipping_fee",
  "total_price",
  "total_cost",
  "profit",
  "discount_code",
  "discount_amount",
  "items_json",
  "created_at",
  "updated_at",
];

function doPost(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    if (!e.postData || !e.postData.contents) {
      output.setContent(JSON.stringify({ success: false, error: "No POST body" }));
      return output;
    }

    var body = JSON.parse(e.postData.contents);
    var props = PropertiesService.getScriptProperties();
    var expected = props.getProperty("WEBHOOK_SECRET");
    if (expected) {
      var got = body.webhook_secret;
      if (got !== expected) {
        output.setContent(JSON.stringify({ success: false, error: "Invalid webhook_secret" }));
        return output;
      }
    }

    var type = (body.type || "").toString().toUpperCase();
    var table = body.table;
    if (table && table !== "orders") {
      output.setContent(JSON.stringify({ success: true, ignored: true }));
      return output;
    }

    var record = body.record;
    var oldRecord = body.old_record;
    var rowData = type === "DELETE" ? oldRecord : record;
    if (!rowData) {
      output.setContent(JSON.stringify({ success: false, error: "Missing record" }));
      return output;
    }

    var sheet = getOrdersSheet_();
    ensureHeaderRow_(sheet);

    var orderKey = rowData.order_id || rowData.id;
    if (!orderKey) {
      output.setContent(JSON.stringify({ success: false, error: "Missing order_id" }));
      return output;
    }

    if (type === "DELETE") {
      deleteRowByOrderId_(sheet, orderKey);
    } else if (type === "INSERT") {
      if (findRowByOrderId_(sheet, orderKey)) {
        updateRow_(sheet, orderKey, rowData);
      } else {
        appendRow_(sheet, rowData);
        setStatusColor_(sheet, sheet.getLastRow(), rowData.status);
      }
    } else {
      // UPDATE أو غير معروف — عالج كتحديث أو إدراج
      if (findRowByOrderId_(sheet, orderKey)) {
        updateRow_(sheet, orderKey, rowData);
      } else {
        appendRow_(sheet, rowData);
        setStatusColor_(sheet, sheet.getLastRow(), rowData.status);
      }
    }

    output.setContent(JSON.stringify({ success: true }));
    return output;
  } catch (err) {
    output.setContent(
      JSON.stringify({
        success: false,
        error: err && err.message ? err.message : String(err),
      })
    );
    return output;
  }
}

/** للتحقق يدويًا من المتصفح: نشر نفس الـ Web App كـ GET */
function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, hint: "Use POST with JSON body from your server." })
  ).setMimeType(ContentService.MimeType.JSON);
}

function getOrdersSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  return sh;
}

/**
 * صف واحد × N أعمدة (توقيع getRange: صف، عمود، عدد_صفوف، عدد_أعمدة).
 * لا تستخدم getRange(r,1,r,N) — الوسيط الثالث يُفسَّر كـ numRows فيغطي عدة صفوف ويلخبط الشيت.
 */
function rangeOneDataRow_(sheet, row, numCols) {
  return sheet.getRange(row, 1, 1, numCols);
}

function ensureHeaderRow_(sheet) {
  var range = rangeOneDataRow_(sheet, 1, ORDER_HEADERS.length);
  var existing = range.getValues()[0];
  var needsHeader = false;
  for (var i = 0; i < ORDER_HEADERS.length; i++) {
    if (!existing[i]) {
      needsHeader = true;
      break;
    }
  }
  if (needsHeader) {
    rangeOneDataRow_(sheet, 1, ORDER_HEADERS.length).setValues([ORDER_HEADERS]);
  }
}

function findRowByOrderId_(sheet, orderId) {
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  // من الصف 2 إلى last — عدد الصفوف = last - 1
  var colValues = sheet.getRange(2, 1, last - 1, 1).getValues();
  var target = String(orderId);
  for (var i = 0; i < colValues.length; i++) {
    if (String(colValues[i][0]) === target) {
      return i + 2;
    }
  }
  return 0;
}

function deleteRowByOrderId_(sheet, orderId) {
  var r = findRowByOrderId_(sheet, orderId);
  if (r) sheet.deleteRow(r);
}

function rowObjectToLine_(obj) {
  var items = obj.items;
  var itemsJson = "";
  try {
    itemsJson = items ? JSON.stringify(items) : "";
  } catch (x) {
    itemsJson = String(items);
  }
  var line = [];
  for (var h = 0; h < ORDER_HEADERS.length; h++) {
    var key = ORDER_HEADERS[h];
    if (key === "items_json") {
      line.push(itemsJson);
    } else {
      var v = obj[key];
      if (v === undefined || v === null) line.push("");
      else if (v instanceof Date) line.push(v);
      else line.push(v);
    }
  }
  return line;
}

function appendRow_(sheet, obj) {
  sheet.appendRow(rowObjectToLine_(obj));
}

function updateRow_(sheet, orderId, obj) {
  var r = findRowByOrderId_(sheet, orderId);
  if (!r) {
    appendRow_(sheet, obj);
    r = sheet.getLastRow();
  } else {
    rangeOneDataRow_(sheet, r, ORDER_HEADERS.length).setValues([rowObjectToLine_(obj)]);
  }
  setStatusColor_(sheet, r, obj.status);
}

function setStatusColor_(sheet, rowIndex, status) {
  if (!rowIndex || rowIndex < 2) return;
  var colors = {
    pending: "#FFE599",
    confirmed: "#9FC5E8",
    shipped: "#B4A7D6",
    delivered: "#B6D7A8",
    cancelled: "#EA9999",
  };
  var key = status ? String(status).toLowerCase() : "";
  var bg = colors[key] || "#ffffff";
  // عمود status = العمود 2
  sheet.getRange(rowIndex, 2).setBackground(bg);
}
