// BANDOLERA — Google Apps Script (products + paid orders)
var ORDER_TOKEN = "bdlr-secret-99";   // must be the SAME word you put in the Worker
var PRODUCT_TAB = "bandolera-sheet-v2";    // the tab that holds your products
var ORDERS_TAB  = "Orders";                // created automatically on the first order

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// The website reads products from here (products tab only)
function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(PRODUCT_TAB) || ss.getSheets()[0];
  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(function (h) { return String(h).trim().toLowerCase(); });
  var rows = values.slice(1).map(function (row) {
    var obj = {};
    headers.forEach(function (h, i) { obj[h] = row[i]; });
    return obj;
  });
  return json_(rows);
}

// The payment Worker saves each PAID order here
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (!ORDER_TOKEN || data.token !== ORDER_TOKEN) return json_({ ok: false, error: "bad token" });

    if (data.action === "add_product") return addProduct_(data.product);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(ORDERS_TAB) || createOrdersSheet_(ss);

    var existing = sheet.getDataRange().getValues();
    for (var i = 1; i < existing.length; i++) {
      if (String(existing[i][2]) === String(data.payment_id)) return json_({ ok: true, duplicate: true });
    }

    sheet.appendRow([
      new Date(), data.order_id, data.payment_id, data.amount, "NEW",
      data.name, data.phone, data.email, data.address, data.city, data.state, data.pincode, data.items
    ]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function createOrdersSheet_(ss) {
  var sheet = ss.insertSheet(ORDERS_TAB);
  sheet.appendRow(["time", "order_id", "payment_id", "amount_inr", "status", "name", "phone", "email", "address", "city", "state", "pincode", "items"]);
  sheet.getRange(1, 1, 1, 13).setFontWeight("bold");
  sheet.setFrozenRows(1);
  sheet.getRange("G:G").setNumberFormat("@");
  sheet.getRange("L:L").setNumberFormat("@");
  return sheet;
}

// Admin page: add a new product as a new row (columns are matched by header name)
function addProduct_(p) {
  if (!p || !p.name) return json_({ ok: false, error: "missing product" });
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(PRODUCT_TAB) || ss.getSheets()[0];
    var values = sheet.getDataRange().getValues();
    var headers = values[0].map(function (h) { return String(h).trim().toLowerCase(); });

    var idCol = headers.indexOf("id");
    var maxId = 0;
    if (idCol >= 0) {
      for (var i = 1; i < values.length; i++) {
        var n = Number(values[i][idCol]);
        if (n > maxId) maxId = n;
      }
    }
    var id = maxId + 1;

    var record = {
      id: id, name: p.name, category: p.category, style: p.style || "",
      price: p.price, mrp: p.mrp, details: p.details || "",
      images: (p.images || []).join("|"), badge: p.badge || "",
      active: true, bestseller: !!p.bestseller, offer_label: p.offer_label || "", promo_codes: ""
    };
    var row = headers.map(function (h) { return record.hasOwnProperty(h) ? record[h] : ""; });
    sheet.appendRow(row);
    return json_({ ok: true, id: id });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
