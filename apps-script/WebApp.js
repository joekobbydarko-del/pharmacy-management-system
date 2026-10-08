function webAppUrl_() {
  const url = PropertiesService
    .getScriptProperties()
    .getProperty(CONFIG.PROPERTIES.WEB_APP_URL);

  if (!url) {
    throw new Error(
      "Web app URL has not been configured yet."
    );
  }

  return String(url).trim();
}


function tokenSecret_() {
  const properties =
    PropertiesService.getScriptProperties();

  let secret = properties.getProperty(
    CONFIG.PROPERTIES.TOKEN_SECRET
  );

  if (!secret) {
    secret =
      Utilities.getUuid() +
      Utilities.getUuid() +
      Utilities.getUuid();

    properties.setProperty(
      CONFIG.PROPERTIES.TOKEN_SECRET,
      secret
    );
  }

  return secret;
}


function createToken_(payload) {
  return Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature(
      String(payload),
      tokenSecret_()
    )
  );
}


function verifyToken_(payload, token) {
  if (!token) {
    return false;
  }

  return (
    createToken_(payload) ===
    String(token)
  );
}


function buildPublicUrl_(action, parameters) {
  const query = [];

  query.push(
    "action=" +
      encodeURIComponent(action)
  );

  Object.keys(
    parameters || {}
  ).forEach(function (key) {
    query.push(
      encodeURIComponent(key) +
        "=" +
        encodeURIComponent(
          parameters[key]
        )
    );
  });

  return (
    webAppUrl_() +
    "?" +
    query.join("&")
  );
}


function webJson_(payload) {
  return ContentService
    .createTextOutput(
      JSON.stringify(payload)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}


function dashboardSpreadsheet_() {
  const properties =
    PropertiesService.getScriptProperties();

  const spreadsheetId = String(
    properties.getProperty(
      "SPREADSHEET_ID"
    ) ||
      properties.getProperty(
        "V2_SPREADSHEET_ID"
      ) ||
      ""
  ).trim();

  if (!spreadsheetId) {
    throw new Error(
      "SPREADSHEET_ID is not configured in Script Properties."
    );
  }

  return SpreadsheetApp.openById(
    spreadsheetId
  );
}


function doGet(e) {
  try {
    const action = String(
      e &&
      e.parameter &&
      e.parameter.action
        ? e.parameter.action
        : ""
    )
      .trim()
      .toLowerCase();

    if (!action) {
      return systemOnlinePage_();
    }

    if (
      action === "admin-dashboard"
    ) {
      return handleAdminDashboard_(e);
    }

    if (
      action === "admin-sales"
    ) {
      return handleAdminSales_(e);
    }

    if (
      action === "admin-pos-products"
    ) {
      return handleAdminPosProducts_(e);
    }

    if (
      action === "admin-pos-sales"
    ) {
      return handleAdminPosSales_(e);
    }

    if (
      action === "admin-purchases"
    ) {
      return handleAdminPurchases_(e);
    }

    if (
      action === "admin-suppliers"
    ) {
      return handleAdminSuppliers_(e);
    }

    if (
      action === "confirm-refill"
    ) {
      return handleRefillConfirmationPage_(
        e
      );
    }

    if (
      action === "payment"
    ) {
      return handlePaymentPage_(e);
    }

    if (
      action === "paystack-start"
    ) {
      return handlePaystackStart_(e);
    }

    if (
      action === "paystack-callback"
    ) {
      return handlePaystackCallback_(e);
    }

    if (
      action === "invoice"
    ) {
      return handleInvoicePage_(e);
    }

    if (
      action === "contact"
    ) {
      return handleContactPatientPage_(
        e
      );
    }

    return errorPage_(
      "Invalid Request",
      "The requested page could not be found."
    );
  } catch (error) {
    console.error(error);

    return errorPage_(
      "System Error",
      error.message ||
        "Something went wrong."
    );
  }
}


function doPost(e) {
  try {
    const action = String(
      e &&
      e.parameter &&
      e.parameter.action
        ? e.parameter.action
        : ""
    )
      .trim()
      .toLowerCase();

    if (
      action ===
      "admin-pos-checkout"
    ) {
      return handleAdminPosCheckout_(
        e
      );
    }

    if (
      action ===
      "admin-purchase-create"
    ) {
      return handleAdminPurchaseCreate_(
        e
      );
    }

    if (
      action ===
      "admin-supplier-create"
    ) {
      return handleAdminSupplierCreate_(
        e
      );
    }

    if (
      action ===
      "admin-supplier-status"
    ) {
      return handleAdminSupplierStatus_(
        e
      );
    }

    if (
      action ===
      "admin-refill-review"
    ) {
      return handleAdminRefillReview_(
        e
      );
    }

    if (
      action ===
      "admin-refill-reschedule"
    ) {
      return handleAdminRefillReschedule_(
        e
      );
    }

    if (
      action ===
      "admin-refill-patient-cancel"
    ) {
      return handleAdminRefillPatientCancel_(
        e
      );
    }

    if (
      action ===
      "admin-refill-clinical-decline"
    ) {
      return handleAdminRefillClinicalDecline_(
        e
      );
    }

    if (
      action ===
      "bank-transfer-submit"
    ) {
      return handleBankTransferSubmission_(
        e
      );
    }

    return errorPage_(
      "Invalid Request",
      "The submitted request could not be processed."
    );
  } catch (error) {
    console.error(error);

    return errorPage_(
      "Submission Error",
      error.message ||
        "The request could not be submitted."
    );
  }
}


function adminDashboardSyncKey_() {
  const value = PropertiesService
    .getScriptProperties()
    .getProperty(
      "GOOGLE_APPS_SCRIPT_SYNC_KEY"
    );

  if (!value) {
    throw new Error(
      "Dashboard sync key has not been configured."
    );
  }

  return String(value).trim();
}


function verifyAdminDashboardRequest_(e) {
  const supplied = String(
    e &&
      e.parameter &&
      e.parameter.key
      ? e.parameter.key
      : ""
  ).trim();

  if (!supplied) {
    return false;
  }

  return (
    supplied ===
    adminDashboardSyncKey_()
  );
}


function dashboardReadSheet_(
  spreadsheet,
  sheetName
) {
  const sheet =
    spreadsheet.getSheetByName(
      sheetName
    );

  if (!sheet) {
    return [];
  }

  const lastRow =
    sheet.getLastRow();

  const lastColumn =
    sheet.getLastColumn();

  if (
    lastRow < 2 ||
    lastColumn < 1
  ) {
    return [];
  }

  const values = sheet
    .getRange(
      1,
      1,
      lastRow,
      lastColumn
    )
    .getValues();

  const headers =
    values[0].map(function (value) {
      return String(
        value || ""
      ).trim();
    });

  const rows = [];

  for (
    let rowIndex = 1;
    rowIndex < values.length;
    rowIndex++
  ) {
    const sourceRow =
      values[rowIndex];

    let hasValue = false;

    for (
      let columnIndex = 0;
      columnIndex < sourceRow.length;
      columnIndex++
    ) {
      if (
        sourceRow[columnIndex] !== "" &&
        sourceRow[columnIndex] !== null
      ) {
        hasValue = true;
        break;
      }
    }

    if (!hasValue) {
      continue;
    }

    const record = {};

    headers.forEach(
      function (header, index) {
        if (!header) {
          return;
        }

        record[header] =
          sourceRow[index];
      }
    );

    rows.push(record);
  }

  return rows;
}


function dashboardNumber_(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  if (
    typeof value === "number"
  ) {
    return isFinite(value)
      ? value
      : 0;
  }

  const cleaned = String(value)
    .replace(/,/g, "")
    .replace(/GHS/gi, "")
    .replace(/GH₵/gi, "")
    .replace(
      /[^\d.-]/g,
      ""
    )
    .trim();

  if (!cleaned) {
    return 0;
  }

  const result =
    Number(cleaned);

  return isFinite(result)
    ? result
    : 0;
}


function dashboardStatus_(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}


function dashboardDateText_(value) {
  if (!value) {
    return "";
  }

  if (
    Object.prototype
      .toString
      .call(value) ===
    "[object Date]"
  ) {
    if (
      isNaN(
        value.getTime()
      )
    ) {
      return "";
    }

    return Utilities.formatDate(
      value,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd'T'HH:mm:ss"
    );
  }

  return String(value);
}


function dashboardDateNumber_(value) {
  if (!value) {
    return 0;
  }

  if (
    Object.prototype
      .toString
      .call(value) ===
    "[object Date]"
  ) {
    const time =
      value.getTime();

    return isNaN(time)
      ? 0
      : time;
  }

  const text =
    String(value).trim();

  if (!text) {
    return 0;
  }

  let match = text.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})/
  );

  if (match) {
    return new Date(
      Number(match[3]),
      Number(match[2]) - 1,
      Number(match[1])
    ).getTime();
  }

  match = text.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})/
  );

  if (match) {
    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    ).getTime();
  }

  const parsed =
    new Date(text);

  const time =
    parsed.getTime();

  return isNaN(time)
    ? 0
    : time;
}


function dashboardMonth_(value) {
  const time =
    dashboardDateNumber_(value);

  if (!time) {
    return "";
  }

  const date =
    new Date(time);

  return (
    date.getFullYear() +
    "-" +
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    )
  );
}


function parseJsonBody_(e) {
  if (
    !e ||
    !e.postData ||
    !e.postData.contents
  ) {
    return {};
  }

  try {
    return JSON.parse(
      e.postData.contents
    );
  } catch (error) {
    throw new Error(
      "Invalid JSON request body."
    );
  }
}


/* =========================================================
   PURCHASE / SUPPLIER DEFINITIONS
   ========================================================= */

function purchaseSheetDefinitions_() {
  return {
    Suppliers: [
      "Supplier_ID",
      "Supplier_Name",
      "Phone",
      "Email",
      "Location",
      "Status",
      "Created_At",
      "Contact_Person",
      "Notes",
    ],

    Purchases: [
      "Purchase_ID",
      "Purchase_Date",
      "Supplier_ID",
      "Supplier_Name",
      "Reference_Number",
      "Payment_Status",
      "Purchase_Status",
      "Subtotal",
      "Total_Amount",
      "Created_By",
    ],

    Purchase_Items: [
      "Purchase_Item_ID",
      "Purchase_ID",
      "Drug_ID",
      "Drug_Name",
      "Quantity",
      "Unit_Cost",
      "Total_Cost",
    ],
  };
}


function ensurePurchaseSheets_(
  spreadsheet
) {
  const definitions =
    purchaseSheetDefinitions_();

  Object.keys(
    definitions
  ).forEach(function (sheetName) {
    let sheet =
      spreadsheet.getSheetByName(
        sheetName
      );

    if (!sheet) {
      sheet =
        spreadsheet.insertSheet(
          sheetName
        );
    }

    const headers =
      definitions[sheetName];

    if (
      sheet.getLastRow() === 0
    ) {
      sheet
        .getRange(
          1,
          1,
          1,
          headers.length
        )
        .setValues([
          headers,
        ]);

      sheet.setFrozenRows(1);
      return;
    }

    headers.forEach(
      function (
        header,
        index
      ) {
        const cell =
          sheet.getRange(
            1,
            index + 1
          );

        const current =
          String(
            cell.getValue() ||
              ""
          ).trim();

        if (
          current !== header
        ) {
          cell.setValue(header);
        }
      }
    );

    sheet.setFrozenRows(1);
  });
}


function purchaseHeaderMap_(sheet) {
  const lastColumn =
    sheet.getLastColumn();

  if (lastColumn < 1) {
    return {};
  }

  const headers = sheet
    .getRange(
      1,
      1,
      1,
      lastColumn
    )
    .getValues()[0];

  const map = {};

  headers.forEach(
    function (header, index) {
      const key =
        String(
          header || ""
        ).trim();

      if (key) {
        map[key] =
          index + 1;
      }
    }
  );

  return map;
}


function nextSheetId_(
  rows,
  field,
  prefix,
  digits
) {
  let maximum = 0;

  rows.forEach(function (row) {
    const value =
      String(
        row[field] || ""
      ).trim();

    const match =
      value.match(/(\d+)$/);

    if (!match) {
      return;
    }

    const numeric =
      Number(match[1]);

    if (
      isFinite(numeric) &&
      numeric > maximum
    ) {
      maximum = numeric;
    }
  });

  return (
    prefix +
    String(
      maximum + 1
    ).padStart(
      digits,
      "0"
    )
  );
}


function findSupplierRow_(
  sheet,
  supplierId
) {
  const map =
    purchaseHeaderMap_(sheet);

  const idColumn =
    map.Supplier_ID;

  if (!idColumn) {
    throw new Error(
      "Suppliers sheet does not contain Supplier_ID."
    );
  }

  const lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {
    return null;
  }

  const values =
    sheet
      .getRange(
        2,
        idColumn,
        lastRow - 1,
        1
      )
      .getValues();

  for (
    let index = 0;
    index < values.length;
    index++
  ) {
    if (
      String(
        values[index][0] ||
          ""
      ).trim() ===
      String(
        supplierId || ""
      ).trim()
    ) {
      return {
        row:
          index + 2,

        map:
          map,
      };
    }
  }

  return null;
}


function getPurchaseSupplierById_(
  spreadsheet,
  supplierId
) {
  const cleanSupplierId =
    String(
      supplierId || ""
    ).trim();

  if (!cleanSupplierId) {
    throw new Error(
      "Please select a supplier."
    );
  }

  ensurePurchaseSheets_(
    spreadsheet
  );

  const suppliers =
    dashboardReadSheet_(
      spreadsheet,
      "Suppliers"
    );

  const supplier =
    suppliers.find(
      function (item) {
        return (
          String(
            item.Supplier_ID ||
              ""
          ).trim() ===
          cleanSupplierId
        );
      }
    );

  if (!supplier) {
    throw new Error(
      "Selected supplier was not found. Add the supplier from the Suppliers page first."
    );
  }

  const supplierName =
    String(
      supplier.Supplier_Name ||
        ""
    ).trim();

  if (!supplierName) {
    throw new Error(
      "Selected supplier does not have a valid supplier name."
    );
  }

  const status =
    dashboardStatus_(
      supplier.Status ||
        "Active"
    );

  if (
    status === "inactive"
  ) {
    throw new Error(
      "Selected supplier is inactive. Reactivate the supplier before recording a purchase."
    );
  }

  return {
    supplier_id:
      cleanSupplierId,

    supplier_name:
      supplierName,

    status:
      "Active",
  };
}


function normalizeAdminSupplier_(
  supplier
) {
  const supplierId =
    String(
      supplier.Supplier_ID ||
        supplier.supplier_id ||
        supplier.id ||
        ""
    ).trim();

  const status =
    String(
      supplier.Status ||
        supplier.status ||
        "Active"
    ).trim();

  return {
    id:
      supplierId,

    supplier_id:
      supplierId,

    supplier_code:
      supplierId,

    supplier_name:
      String(
        supplier.Supplier_Name ||
          supplier.supplier_name ||
          ""
      ).trim(),

    contact_person:
      String(
        supplier.Contact_Person ||
          supplier.contact_person ||
          ""
      ).trim(),

    phone:
      String(
        supplier.Phone ||
          supplier.phone ||
          ""
      ).trim(),

    email:
      String(
        supplier.Email ||
          supplier.email ||
          ""
      ).trim(),

    address:
      String(
        supplier.Location ||
          supplier.address ||
          supplier.location ||
          ""
      ).trim(),

    location:
      String(
        supplier.Location ||
          supplier.location ||
          supplier.address ||
          ""
      ).trim(),

    notes:
      String(
        supplier.Notes ||
          supplier.notes ||
          ""
      ).trim(),

    status:
      status,

    is_active:
      dashboardStatus_(status) !==
      "inactive",

    created_at:
      dashboardDateText_(
        supplier.Created_At ||
          supplier.created_at
      ),
  };
}


function buildAdminSuppliers_() {
  const spreadsheet =
    dashboardSpreadsheet_();

  ensurePurchaseSheets_(
    spreadsheet
  );

  const suppliers =
    dashboardReadSheet_(
      spreadsheet,
      "Suppliers"
    );

  const purchases =
    dashboardReadSheet_(
      spreadsheet,
      "Purchases"
    );

  const purchaseCountBySupplier =
    {};

  purchases.forEach(
    function (purchase) {
      const supplierId =
        String(
          purchase.Supplier_ID ||
            ""
        ).trim();

      if (!supplierId) {
        return;
      }

      if (
        !purchaseCountBySupplier[
          supplierId
        ]
      ) {
        purchaseCountBySupplier[
          supplierId
        ] = 0;
      }

      purchaseCountBySupplier[
        supplierId
      ] += 1;
    }
  );

  const response =
    suppliers
      .map(function (supplier) {
        const normalized =
          normalizeAdminSupplier_(
            supplier
          );

        normalized.purchase_count =
          purchaseCountBySupplier[
            normalized.supplier_id
          ] || 0;

        return normalized;
      })
      .sort(
        function (a, b) {
          return a.supplier_name
            .localeCompare(
              b.supplier_name
            );
        }
      );

  return {
    ok:
      true,

    source:
      "google-sheets",

    generated_at:
      new Date().toISOString(),

    suppliers:
      response,

    count:
      response.length,

    active_count:
      response.filter(
        function (supplier) {
          return supplier.is_active;
        }
      ).length,

    inactive_count:
      response.filter(
        function (supplier) {
          return !supplier.is_active;
        }
      ).length,
  };
}


function handleAdminSuppliers_(e) {
  try {
    if (
      !verifyAdminDashboardRequest_(
        e
      )
    ) {
      return webJson_({
        ok:
          false,

        error:
          "Unauthorized suppliers request.",
      });
    }

    return webJson_(
      buildAdminSuppliers_()
    );

  } catch (error) {
    console.error(error);

    return webJson_({
      ok:
        false,

      error:
        error.message ||
        "Unable to load suppliers.",
    });
  }
}


function createGoogleSupplier_(
  payload
) {
  payload =
    payload || {};

  const spreadsheet =
    dashboardSpreadsheet_();

  ensurePurchaseSheets_(
    spreadsheet
  );

  const supplierName =
    String(
      payload.supplier_name ||
        ""
    ).trim();

  if (!supplierName) {
    throw new Error(
      "Supplier name is required."
    );
  }

  const suppliers =
    dashboardReadSheet_(
      spreadsheet,
      "Suppliers"
    );

  const duplicate =
    suppliers.find(
      function (supplier) {
        return (
          String(
            supplier.Supplier_Name ||
              ""
          )
            .trim()
            .toLowerCase() ===
          supplierName.toLowerCase()
        );
      }
    );

  if (duplicate) {
    throw new Error(
      "Supplier already exists."
    );
  }

  const supplierId =
    nextSheetId_(
      suppliers,
      "Supplier_ID",
      "SUP",
      4
    );

  const phone =
    String(
      payload.phone || ""
    ).trim();

  const email =
    String(
      payload.email || ""
    ).trim();

  const location =
    String(
      payload.address ||
        payload.location ||
        ""
    ).trim();

  const contactPerson =
    String(
      payload.contact_person ||
        ""
    ).trim();

  const notes =
    String(
      payload.notes || ""
    ).trim();

  const now =
    new Date();

  const sheet =
    spreadsheet.getSheetByName(
      "Suppliers"
    );

  sheet.appendRow([
    supplierId,
    supplierName,
    phone,
    email,
    location,
    "Active",
    now,
    contactPerson,
    notes,
  ]);

  return {
    id:
      supplierId,

    supplier_id:
      supplierId,

    supplier_code:
      supplierId,

    supplier_name:
      supplierName,

    contact_person:
      contactPerson,

    phone:
      phone,

    email:
      email,

    address:
      location,

    location:
      location,

    notes:
      notes,

    status:
      "Active",

    is_active:
      true,

    created_at:
      now.toISOString(),
  };
}


function handleAdminSupplierCreate_(
  e
) {
  try {
    if (
      !verifyAdminDashboardRequest_(
        e
      )
    ) {
      return webJson_({
        ok:
          false,

        error:
          "Unauthorized supplier request.",
      });
    }

    const payload =
      parseJsonBody_(e);

    const supplier =
      createGoogleSupplier_(
        payload
      );

    return webJson_({
      ok:
        true,

      message:
        "Supplier created successfully.",

      supplier:
        supplier,
    });

  } catch (error) {
    console.error(error);

    return webJson_({
      ok:
        false,

      error:
        error.message ||
        "Unable to create supplier.",
    });
  }
}


function updateGoogleSupplierStatus_(
  payload
) {
  payload =
    payload || {};

  const spreadsheet =
    dashboardSpreadsheet_();

  ensurePurchaseSheets_(
    spreadsheet
  );

  const supplierId =
    String(
      payload.supplier_id ||
        payload.id ||
        ""
    ).trim();

  if (!supplierId) {
    throw new Error(
      "Supplier ID is required."
    );
  }

  const isActive =
    payload.is_active === true ||
    String(
      payload.is_active
    ).toLowerCase() ===
      "true";

  const sheet =
    spreadsheet.getSheetByName(
      "Suppliers"
    );

  const info =
    findSupplierRow_(
      sheet,
      supplierId
    );

  if (!info) {
    throw new Error(
      "Supplier not found."
    );
  }

  if (!info.map.Status) {
    throw new Error(
      "Suppliers sheet does not contain Status."
    );
  }

  const status =
    isActive
      ? "Active"
      : "Inactive";

  sheet
    .getRange(
      info.row,
      info.map.Status
    )
    .setValue(
      status
    );

  const supplierName =
    info.map.Supplier_Name
      ? String(
          sheet
            .getRange(
              info.row,
              info.map.Supplier_Name
            )
            .getValue() ||
            ""
        )
      : "";

  return {
    id:
      supplierId,

    supplier_id:
      supplierId,

    supplier_code:
      supplierId,

    supplier_name:
      supplierName,

    status:
      status,

    is_active:
      isActive,
  };
}


function handleAdminSupplierStatus_(e) {
  try {
    if (
      !verifyAdminDashboardRequest_(
        e
      )
    ) {
      return webJson_({
        ok:
          false,

        error:
          "Unauthorized supplier status request.",
      });
    }

    const payload =
      parseJsonBody_(e);

    const supplier =
      updateGoogleSupplierStatus_(
        payload
      );

    return webJson_({
      ok:
        true,

      message:
        "Supplier status updated successfully.",

      supplier:
        supplier,
    });

  } catch (error) {
    console.error(error);

    return webJson_({
      ok:
        false,

      error:
        error.message ||
        "Unable to update supplier status.",
    });
  }
}


/* =========================================================
   ADMIN REFILL ACTION HELPERS
   ========================================================= */

function adminRefillPayloadValue_(
  payload,
  snakeKey,
  camelKey
) {
  if (!payload) {
    return "";
  }

  if (
    payload[snakeKey] !==
      undefined &&
    payload[snakeKey] !==
      null
  ) {
    return payload[snakeKey];
  }

  if (
    camelKey &&
    payload[camelKey] !==
      undefined &&
    payload[camelKey] !==
      null
  ) {
    return payload[camelKey];
  }

  return "";
}


function adminRefillReviewer_(
  payload
) {
  const reviewer =
    String(
      adminRefillPayloadValue_(
        payload,
        "reviewed_by",
        "reviewedBy"
      ) ||
      adminRefillPayloadValue_(
        payload,
        "reviewer",
        "reviewer"
      ) ||
      adminRefillPayloadValue_(
        payload,
        "admin_name",
        "adminName"
      ) ||
      "Admin"
    ).trim();

  return (
    reviewer ||
    "Admin"
  );
}


/* =========================================================
   SAVE REVIEW NOTE
   ========================================================= */

function handleAdminRefillReview_(
  e
) {
  try {
    if (
      !verifyAdminDashboardRequest_(
        e
      )
    ) {
      return webJson_({
        ok:
          false,

        error:
          "Unauthorized refill review request.",
      });
    }

    const payload =
      parseJsonBody_(
        e
      );

    const refillId =
      String(
        adminRefillPayloadValue_(
          payload,
          "refill_id",
          "refillId"
        ) ||
        ""
      ).trim();

    const note =
      String(
        adminRefillPayloadValue_(
          payload,
          "note",
          "note"
        ) ||
        adminRefillPayloadValue_(
          payload,
          "review_note",
          "reviewNote"
        ) ||
        ""
      ).trim();

    const reviewedBy =
      adminRefillReviewer_(
        payload
      );

    if (!refillId) {
      throw new Error(
        "Refill ID is required."
      );
    }

    if (!note) {
      throw new Error(
        "A pharmacist review note is required."
      );
    }

    const result =
      reviewRefill_(
        refillId,
        note,
        reviewedBy
      );

    return webJson_({
      ok:
        true,

      message:
        "Refill review saved successfully.",

      refill:
        result,
    });

  } catch (error) {
    console.error(
      error
    );

    return webJson_({
      ok:
        false,

      error:
        error.message ||
        "Unable to save refill review.",
    });
  }
}


/* =========================================================
   RESCHEDULE REFILL
   ========================================================= */

function handleAdminRefillReschedule_(
  e
) {
  try {
    if (
      !verifyAdminDashboardRequest_(
        e
      )
    ) {
      return webJson_({
        ok:
          false,

        error:
          "Unauthorized refill reschedule request.",
      });
    }

    const payload =
      parseJsonBody_(
        e
      );

    const refillId =
      String(
        adminRefillPayloadValue_(
          payload,
          "refill_id",
          "refillId"
        ) ||
        ""
      ).trim();

    const newRefillDate =
      adminRefillPayloadValue_(
        payload,
        "new_refill_date",
        "newRefillDate"
      ) ||
      adminRefillPayloadValue_(
        payload,
        "next_refill_date",
        "nextRefillDate"
      );

    const note =
      String(
        adminRefillPayloadValue_(
          payload,
          "note",
          "note"
        ) ||
        adminRefillPayloadValue_(
          payload,
          "reason",
          "reason"
        ) ||
        adminRefillPayloadValue_(
          payload,
          "review_note",
          "reviewNote"
        ) ||
        ""
      ).trim();

    const reviewedBy =
      adminRefillReviewer_(
        payload
      );

    if (!refillId) {
      throw new Error(
        "Refill ID is required."
      );
    }

    if (
      newRefillDate === "" ||
      newRefillDate === null ||
      newRefillDate === undefined
    ) {
      throw new Error(
        "A new refill date is required."
      );
    }

    if (!note) {
      throw new Error(
        "A reason or pharmacist note is required when rescheduling a refill."
      );
    }

    const result =
      rescheduleRefill_(
        refillId,
        newRefillDate,
        note,
        reviewedBy
      );

    return webJson_({
      ok:
        true,

      message:
        "Refill rescheduled successfully.",

      refill:
        result,
    });

  } catch (error) {
    console.error(
      error
    );

    return webJson_({
      ok:
        false,

      error:
        error.message ||
        "Unable to reschedule refill.",
    });
  }
}


/* =========================================================
   PATIENT CANCELLATION
   ========================================================= */

function handleAdminRefillPatientCancel_(
  e
) {
  try {
    if (
      !verifyAdminDashboardRequest_(
        e
      )
    ) {
      return webJson_({
        ok:
          false,

        error:
          "Unauthorized refill cancellation request.",
      });
    }

    const payload =
      parseJsonBody_(
        e
      );

    const refillId =
      String(
        adminRefillPayloadValue_(
          payload,
          "refill_id",
          "refillId"
        ) ||
        ""
      ).trim();

    const reason =
      String(
        adminRefillPayloadValue_(
          payload,
          "reason",
          "reason"
        ) ||
        adminRefillPayloadValue_(
          payload,
          "cancellation_reason",
          "cancellationReason"
        ) ||
        ""
      ).trim();

    const reviewedBy =
      adminRefillReviewer_(
        payload
      );

    if (!refillId) {
      throw new Error(
        "Refill ID is required."
      );
    }

    if (!reason) {
      throw new Error(
        "The patient's cancellation reason is required."
      );
    }

    const result =
      cancelRefillByPatient_(
        refillId,
        reason,
        reviewedBy
      );

    return webJson_({
      ok:
        true,

      message:
        "Refill cancelled by patient successfully.",

      refill:
        result,
    });

  } catch (error) {
    console.error(
      error
    );

    return webJson_({
      ok:
        false,

      error:
        error.message ||
        "Unable to record patient cancellation.",
    });
  }
}


/* =========================================================
   CLINICAL DECLINE
   ========================================================= */

function handleAdminRefillClinicalDecline_(
  e
) {
  try {
    if (
      !verifyAdminDashboardRequest_(
        e
      )
    ) {
      return webJson_({
        ok:
          false,

        error:
          "Unauthorized clinical refill review request.",
      });
    }

    const payload =
      parseJsonBody_(
        e
      );

    const refillId =
      String(
        adminRefillPayloadValue_(
          payload,
          "refill_id",
          "refillId"
        ) ||
        ""
      ).trim();

    const reason =
      String(
        adminRefillPayloadValue_(
          payload,
          "reason",
          "reason"
        ) ||
        adminRefillPayloadValue_(
          payload,
          "clinical_reason",
          "clinicalReason"
        ) ||
        ""
      ).trim();

    const note =
      String(
        adminRefillPayloadValue_(
          payload,
          "note",
          "note"
        ) ||
        adminRefillPayloadValue_(
          payload,
          "review_note",
          "reviewNote"
        ) ||
        ""
      ).trim();

    const reviewedBy =
      adminRefillReviewer_(
        payload
      );

    if (!refillId) {
      throw new Error(
        "Refill ID is required."
      );
    }

    if (!reason) {
      throw new Error(
        "A clinical decline reason is required."
      );
    }

    const result =
      clinicallyDeclineRefill_(
        refillId,
        reason,
        note,
        reviewedBy
      );

    return webJson_({
      ok:
        true,

      message:
        "Refill clinically declined successfully.",

      refill:
        result,
    });

  } catch (error) {
    console.error(
      error
    );

    return webJson_({
      ok:
        false,

      error:
        error.message ||
        "Unable to record clinical decline.",
    });
  }
}


/* =========================================================
   PURCHASE DRUG / INVENTORY HELPERS
   ========================================================= */

function findDrugRow_(
  drugsSheet,
  drugId
) {
  const map =
    purchaseHeaderMap_(
      drugsSheet
    );

  const idColumn =
    map.Drug_ID;

  if (!idColumn) {
    throw new Error(
      "Drugs sheet does not contain Drug_ID."
    );
  }

  const lastRow =
    drugsSheet.getLastRow();

  if (lastRow < 2) {
    return null;
  }

  const values =
    drugsSheet
      .getRange(
        2,
        idColumn,
        lastRow - 1,
        1
      )
      .getValues();

  for (
    let index = 0;
    index < values.length;
    index++
  ) {
    if (
      String(
        values[index][0] ||
          ""
      ).trim() ===
      String(
        drugId || ""
      ).trim()
    ) {
      return {
        row:
          index + 2,

        map:
          map,
      };
    }
  }

  return null;
}


function findInventoryRow_(
  inventorySheet,
  drugId
) {
  const map =
    purchaseHeaderMap_(
      inventorySheet
    );

  const idColumn =
    map.Drug_ID;

  if (!idColumn) {
    throw new Error(
      "Inventory sheet does not contain Drug_ID."
    );
  }

  const lastRow =
    inventorySheet.getLastRow();

  if (lastRow < 2) {
    return null;
  }

  const values =
    inventorySheet
      .getRange(
        2,
        idColumn,
        lastRow - 1,
        1
      )
      .getValues();

  for (
    let index = 0;
    index < values.length;
    index++
  ) {
    if (
      String(
        values[index][0] ||
          ""
      ).trim() ===
      String(
        drugId || ""
      ).trim()
    ) {
      return {
        row:
          index + 2,

        map:
          map,
      };
    }
  }

  return null;
}


function calculateInventoryStatus_(
  stock,
  reorder
) {
  const stockNumber =
    dashboardNumber_(stock);

  const reorderNumber =
    dashboardNumber_(reorder);

  if (stockNumber <= 0) {
    return "Out of Stock";
  }

  if (
    stockNumber <=
    reorderNumber
  ) {
    return "Low Stock";
  }

  return "Healthy";
}


function buildAdminPurchases_() {
  const spreadsheet =
    dashboardSpreadsheet_();

  ensurePurchaseSheets_(
    spreadsheet
  );

  const drugs =
    dashboardReadSheet_(
      spreadsheet,
      "Drugs"
    );

  const inventory =
    dashboardReadSheet_(
      spreadsheet,
      "Inventory"
    );

  const suppliers =
    dashboardReadSheet_(
      spreadsheet,
      "Suppliers"
    );

  const purchases =
    dashboardReadSheet_(
      spreadsheet,
      "Purchases"
    );

  const purchaseItems =
    dashboardReadSheet_(
      spreadsheet,
      "Purchase_Items"
    );

  const inventoryByDrug =
    {};

  inventory.forEach(
    function (item) {
      const drugId =
        String(
          item.Drug_ID ||
            ""
        ).trim();

      if (drugId) {
        inventoryByDrug[
          drugId
        ] = item;
      }
    }
  );

  const drugsResponse =
    drugs
      .map(function (drug) {
        const drugId =
          String(
            drug.Drug_ID ||
              ""
          ).trim();

        const inventoryItem =
          inventoryByDrug[
            drugId
          ] || {};

        return {
          drug_id:
            drugId,

          drug_name:
            String(
              drug.Drug_Name ||
                ""
            ),

          category:
            String(
              drug.Category ||
                ""
            ),

          cost_price:
            dashboardNumber_(
              drug.Cost_Price
            ),

          current_stock:
            dashboardNumber_(
              inventoryItem.Stock_Quantity !==
                undefined
                ? inventoryItem.Stock_Quantity
                : drug.Stock_Quantity
            ),

          reorder_level:
            dashboardNumber_(
              inventoryItem.Reorder_Level !==
                undefined
                ? inventoryItem.Reorder_Level
                : drug.Reorder_Level
            ),
        };
      })
      .sort(function (a, b) {
        return a.drug_name
          .localeCompare(
            b.drug_name
          );
      });

  const supplierResponse =
    suppliers
      .map(function (supplier) {
        return normalizeAdminSupplier_(
          supplier
        );
      })
      .sort(function (a, b) {
        return a.supplier_name
          .localeCompare(
            b.supplier_name
          );
      });

  const itemCountByPurchase =
    {};

  purchaseItems.forEach(
    function (item) {
      const purchaseId =
        String(
          item.Purchase_ID ||
            ""
        ).trim();

      if (!purchaseId) {
        return;
      }

      if (
        !itemCountByPurchase[
          purchaseId
        ]
      ) {
        itemCountByPurchase[
          purchaseId
        ] = 0;
      }

      itemCountByPurchase[
        purchaseId
      ] += 1;
    }
  );

  const purchaseResponse =
    purchases
      .map(function (purchase) {
        const purchaseId =
          String(
            purchase.Purchase_ID ||
              ""
          ).trim();

        return {
          id:
            purchaseId,

          purchase_id:
            purchaseId,

          purchase_number:
            purchaseId,

          purchase_date:
            dashboardDateText_(
              purchase.Purchase_Date
            ),

          supplier_id:
            String(
              purchase.Supplier_ID ||
                ""
            ),

          supplier_name:
            String(
              purchase.Supplier_Name ||
                ""
            ),

          reference_number:
            String(
              purchase.Reference_Number ||
                ""
            ),

          payment_status:
            String(
              purchase.Payment_Status ||
                ""
            ),

          status:
            String(
              purchase.Purchase_Status ||
                ""
            ),

          subtotal:
            dashboardNumber_(
              purchase.Subtotal
            ),

          total_amount:
            dashboardNumber_(
              purchase.Total_Amount
            ),

          created_by:
            String(
              purchase.Created_By ||
                ""
            ),

          item_count:
            itemCountByPurchase[
              purchaseId
            ] || 0,

          created_at:
            dashboardDateText_(
              purchase.Purchase_Date
            ),
        };
      })
      .sort(function (a, b) {
        return (
          dashboardDateNumber_(
            b.created_at
          ) -
          dashboardDateNumber_(
            a.created_at
          )
        );
      });

  return {
    ok:
      true,

    source:
      "google-sheets",

    generated_at:
      new Date().toISOString(),

    drugs:
      drugsResponse,

    suppliers:
      supplierResponse,

    active_suppliers:
      supplierResponse.filter(
        function (supplier) {
          return supplier.is_active;
        }
      ),

    purchases:
      purchaseResponse,

    purchase_items:
      purchaseItems,

    count:
      purchaseResponse.length,
  };
}


function handleAdminPurchases_(e) {
  try {
    if (
      !verifyAdminDashboardRequest_(
        e
      )
    ) {
      return webJson_({
        ok:
          false,

        error:
          "Unauthorized purchases request.",
      });
    }

    return webJson_(
      buildAdminPurchases_()
    );

  } catch (error) {
    console.error(error);

    return webJson_({
      ok:
        false,

      error:
        error.message ||
        "Unable to load purchase data.",
    });
  }
}


function createGooglePurchase_(
  payload
) {
  payload =
    payload || {};

  const spreadsheet =
    dashboardSpreadsheet_();

  ensurePurchaseSheets_(
    spreadsheet
  );

  const supplierId =
    String(
      payload.supplier_id ||
        ""
    ).trim();

  if (!supplierId) {
    throw new Error(
      "Please select the supplier that delivered this stock."
    );
  }

  const supplier =
    getPurchaseSupplierById_(
      spreadsheet,
      supplierId
    );

  const requestedItems =
    Array.isArray(
      payload.items
    )
      ? payload.items
      : [];

  if (
    requestedItems.length === 0
  ) {
    throw new Error(
      "Purchase must contain at least one medicine."
    );
  }

  const purchases =
    dashboardReadSheet_(
      spreadsheet,
      "Purchases"
    );

  const existingItems =
    dashboardReadSheet_(
      spreadsheet,
      "Purchase_Items"
    );

  const purchaseId =
    nextSheetId_(
      purchases,
      "Purchase_ID",
      "PUR",
      6
    );

  let nextPurchaseItemNumber =
    0;

  existingItems.forEach(
    function (item) {
      const value =
        String(
          item.Purchase_Item_ID ||
            ""
        );

      const match =
        value.match(
          /(\d+)$/
        );

      if (
        match &&
        Number(match[1]) >
          nextPurchaseItemNumber
      ) {
        nextPurchaseItemNumber =
          Number(match[1]);
      }
    }
  );

  const drugsSheet =
    spreadsheet.getSheetByName(
      "Drugs"
    );

  const inventorySheet =
    spreadsheet.getSheetByName(
      "Inventory"
    );

  if (!drugsSheet) {
    throw new Error(
      "Drugs sheet was not found."
    );
  }

  if (!inventorySheet) {
    throw new Error(
      "Inventory sheet was not found."
    );
  }

  const purchaseItemsData =
    [];

  let subtotal = 0;

  requestedItems.forEach(
    function (requestedItem) {
      const drugId =
        String(
          requestedItem.drug_id ||
            ""
        ).trim();

      const quantity =
        Math.floor(
          dashboardNumber_(
            requestedItem.quantity
          )
        );

      if (!drugId) {
        throw new Error(
          "Every purchase item must contain a Drug ID."
        );
      }

      if (quantity < 1) {
        throw new Error(
          "Purchase item quantity must be at least 1."
        );
      }

      const drugRowInfo =
        findDrugRow_(
          drugsSheet,
          drugId
        );

      if (!drugRowInfo) {
        throw new Error(
          "Drug not found: " +
            drugId
        );
      }

      const drugMap =
        drugRowInfo.map;

      const drugName =
        String(
          drugsSheet
            .getRange(
              drugRowInfo.row,
              drugMap.Drug_Name
            )
            .getValue() ||
            drugId
        );

      let unitCost =
        requestedItem.unit_cost;

      if (
        unitCost === undefined ||
        unitCost === null ||
        unitCost === ""
      ) {
        unitCost =
          drugMap.Cost_Price
            ? drugsSheet
                .getRange(
                  drugRowInfo.row,
                  drugMap.Cost_Price
                )
                .getValue()
            : 0;
      }

      unitCost =
        dashboardNumber_(
          unitCost
        );

      if (unitCost < 0) {
        throw new Error(
          "Unit cost cannot be negative."
        );
      }

      const totalCost =
        Number(
          (
            unitCost *
            quantity
          ).toFixed(2)
        );

      subtotal +=
        totalCost;

      purchaseItemsData.push({
        drug_id:
          drugId,

        drug_name:
          drugName,

        quantity:
          quantity,

        unit_cost:
          unitCost,

        total_cost:
          totalCost,

        drug_row:
          drugRowInfo.row,

        drug_map:
          drugMap,
      });
    }
  );

  subtotal =
    Number(
      subtotal.toFixed(2)
    );

  const paymentStatus =
    String(
      payload.payment_status ||
        "pending"
    ).trim();

  const referenceNumber =
    String(
      payload.reference_number ||
        ""
    ).trim();

  const createdBy =
    String(
      payload.created_by ||
        "admin"
    ).trim();

  const now =
    new Date();

  const lock =
    LockService.getScriptLock();

  lock.waitLock(
    30000
  );

  try {
    const lockedSupplier =
      getPurchaseSupplierById_(
        spreadsheet,
        supplier.supplier_id
      );

    purchaseItemsData.forEach(
      function (item) {
        const inventoryRowInfo =
          findInventoryRow_(
            inventorySheet,
            item.drug_id
          );

        if (!inventoryRowInfo) {
          throw new Error(
            "Inventory item not found: " +
              item.drug_id
          );
        }

        const inventoryMap =
          inventoryRowInfo.map;

        const stockColumn =
          inventoryMap.Stock_Quantity;

        const reorderColumn =
          inventoryMap.Reorder_Level;

        const statusColumn =
          inventoryMap.Stock_Status;

        const updatedColumn =
          inventoryMap.Last_Updated;

        if (!stockColumn) {
          throw new Error(
            "Inventory sheet does not contain Stock_Quantity."
          );
        }

        const currentStock =
          dashboardNumber_(
            inventorySheet
              .getRange(
                inventoryRowInfo.row,
                stockColumn
              )
              .getValue()
          );

        const reorderLevel =
          reorderColumn
            ? dashboardNumber_(
                inventorySheet
                  .getRange(
                    inventoryRowInfo.row,
                    reorderColumn
                  )
                  .getValue()
              )
            : 0;

        const newStock =
          currentStock +
          item.quantity;

        inventorySheet
          .getRange(
            inventoryRowInfo.row,
            stockColumn
          )
          .setValue(
            newStock
          );

        if (statusColumn) {
          inventorySheet
            .getRange(
              inventoryRowInfo.row,
              statusColumn
            )
            .setValue(
              calculateInventoryStatus_(
                newStock,
                reorderLevel
              )
            );
        }

        if (updatedColumn) {
          inventorySheet
            .getRange(
              inventoryRowInfo.row,
              updatedColumn
            )
            .setValue(
              now
            );
        }

        if (
          item.drug_map
            .Stock_Quantity
        ) {
          drugsSheet
            .getRange(
              item.drug_row,
              item.drug_map
                .Stock_Quantity
            )
            .setValue(
              newStock
            );
        }

        if (
          item.drug_map.Cost_Price
        ) {
          drugsSheet
            .getRange(
              item.drug_row,
              item.drug_map
                .Cost_Price
            )
            .setValue(
              item.unit_cost
            );
        }
      }
    );

    const purchasesSheet =
      spreadsheet.getSheetByName(
        "Purchases"
      );

    purchasesSheet.appendRow([
      purchaseId,
      now,
      lockedSupplier.supplier_id,
      lockedSupplier.supplier_name,
      referenceNumber,
      paymentStatus,
      "Received",
      subtotal,
      subtotal,
      createdBy,
    ]);

    const purchaseItemsSheet =
      spreadsheet.getSheetByName(
        "Purchase_Items"
      );

    const rowsToAppend =
      [];

    purchaseItemsData.forEach(
      function (item) {
        nextPurchaseItemNumber +=
          1;

        const purchaseItemId =
          "PI" +
          String(
            nextPurchaseItemNumber
          ).padStart(
            6,
            "0"
          );

        rowsToAppend.push([
          purchaseItemId,
          purchaseId,
          item.drug_id,
          item.drug_name,
          item.quantity,
          item.unit_cost,
          item.total_cost,
        ]);
      }
    );

    if (
      rowsToAppend.length > 0
    ) {
      purchaseItemsSheet
        .getRange(
          purchaseItemsSheet
            .getLastRow() + 1,
          1,
          rowsToAppend.length,
          rowsToAppend[0].length
        )
        .setValues(
          rowsToAppend
        );
    }

    SpreadsheetApp.flush();

    return {
      message:
        "Purchase recorded successfully.",

      purchase: {
        id:
          purchaseId,

        purchase_id:
          purchaseId,

        purchase_number:
          purchaseId,

        supplier_id:
          lockedSupplier.supplier_id,

        supplier_name:
          lockedSupplier.supplier_name,

        reference_number:
          referenceNumber,

        payment_status:
          paymentStatus,

        status:
          "Received",

        subtotal:
          subtotal,

        total_amount:
          subtotal,

        created_at:
          now.toISOString(),
      },
    };

  } finally {
    lock.releaseLock();
  }
}


function handleAdminPurchaseCreate_(e) {
  try {
    if (
      !verifyAdminDashboardRequest_(
        e
      )
    ) {
      return webJson_({
        ok:
          false,

        error:
          "Unauthorized purchase request.",
      });
    }

    const payload =
      parseJsonBody_(e);

    const result =
      createGooglePurchase_(
        payload
      );

    return webJson_({
      ok:
        true,

      ...result,
    });

  } catch (error) {
    console.error(error);

    return webJson_({
      ok:
        false,

      error:
        error.message ||
        "Unable to record purchase.",
    });
  }
}


/* =========================================================
   SALES
   ========================================================= */

function buildAdminSales_() {
  const spreadsheet =
    dashboardSpreadsheet_();

  const patients =
    dashboardReadSheet_(
      spreadsheet,
      "Patients"
    );

  const drugs =
    dashboardReadSheet_(
      spreadsheet,
      "Drugs"
    );

  const orders =
    dashboardReadSheet_(
      spreadsheet,
      "Orders"
    );

  const orderItems =
    dashboardReadSheet_(
      spreadsheet,
      "Order_Items"
    );

  const payments =
    dashboardReadSheet_(
      spreadsheet,
      "Payments"
    );

  const patientsById =
    {};

  const drugsById =
    {};

  const itemsByOrder =
    {};

  const paymentsByOrder =
    {};

  patients.forEach(
    function (patient) {
      const id =
        String(
          patient.Patient_ID ||
            ""
        ).trim();

      if (id) {
        patientsById[id] =
          patient;
      }
    }
  );

  drugs.forEach(
    function (drug) {
      const id =
        String(
          drug.Drug_ID ||
            ""
        ).trim();

      if (id) {
        drugsById[id] =
          drug;
      }
    }
  );

  orderItems.forEach(
    function (item) {
      const orderId =
        String(
          item.Order_ID ||
            ""
        ).trim();

      if (!orderId) {
        return;
      }

      if (
        !itemsByOrder[
          orderId
        ]
      ) {
        itemsByOrder[
          orderId
        ] = [];
      }

      itemsByOrder[
        orderId
      ].push(
        item
      );
    }
  );

  payments.forEach(
    function (payment) {
      const orderId =
        String(
          payment.Order_ID ||
            ""
        ).trim();

      if (!orderId) {
        return;
      }

      if (
        !paymentsByOrder[
          orderId
        ]
      ) {
        paymentsByOrder[
          orderId
        ] = [];
      }

      paymentsByOrder[
        orderId
      ].push(
        payment
      );
    }
  );

  let totalSales = 0;
  let totalCost = 0;
  let totalProfit = 0;
  let totalUnits = 0;

  const productTotals =
    {};

  orderItems.forEach(
    function (item) {
      const quantity =
        dashboardNumber_(
          item.Quantity
        );

      const sales =
        dashboardNumber_(
          item.Total_Amount
        );

      const cost =
        dashboardNumber_(
          item.Cost_Total
        );

      const explicitProfit =
        dashboardNumber_(
          item.Profit
        );

      const profit =
        explicitProfit ||
        sales - cost;

      totalUnits +=
        quantity;

      totalSales +=
        sales;

      totalCost +=
        cost;

      totalProfit +=
        profit;

      const drugId =
        String(
          item.Drug_ID ||
            ""
        ).trim();

      const drug =
        drugsById[
          drugId
        ] || {};

      if (
        !productTotals[
          drugId
        ]
      ) {
        productTotals[
          drugId
        ] = {
          drug_id:
            drugId,

          drug_name:
            String(
              drug.Drug_Name ||
                drugId
            ),

          category:
            String(
              drug.Category ||
                ""
            ),

          units_sold:
            0,

          revenue:
            0,

          cost:
            0,

          profit:
            0,
        };
      }

      productTotals[
        drugId
      ].units_sold +=
        quantity;

      productTotals[
        drugId
      ].revenue +=
        sales;

      productTotals[
        drugId
      ].cost +=
        cost;

      productTotals[
        drugId
      ].profit +=
        profit;
    }
  );

  const sales =
    orders
      .map(function (order) {
        const orderId =
          String(
            order.Order_ID ||
              ""
          ).trim();

        const patientId =
          String(
            order.Patient_ID ||
              ""
          ).trim();

        const patient =
          patientsById[
            patientId
          ] || {};

        const items =
          itemsByOrder[
            orderId
          ] || [];

        const orderPayments =
          paymentsByOrder[
            orderId
          ] || [];

        let totalAmount = 0;
        let totalCostAmount = 0;
        let totalProfitAmount = 0;
        let quantity = 0;

        items.forEach(
          function (item) {
            quantity +=
              dashboardNumber_(
                item.Quantity
              );

            totalAmount +=
              dashboardNumber_(
                item.Total_Amount
              );

            totalCostAmount +=
              dashboardNumber_(
                item.Cost_Total
              );

            totalProfitAmount +=
              dashboardNumber_(
                item.Profit
              );
          }
        );

        let amountPaid = 0;

        orderPayments.forEach(
          function (payment) {
            amountPaid +=
              dashboardNumber_(
                payment.Amount_Paid
              );
          }
        );

        const latestPayment =
          orderPayments
            .slice()
            .sort(function (a, b) {
              return (
                dashboardDateNumber_(
                  b.Payment_Date
                ) -
                dashboardDateNumber_(
                  a.Payment_Date
                )
              );
            })[0] || {};

        return {
          sale_number:
            orderId,

          order_id:
            orderId,

          patient_id:
            patientId,

          customer_name:
            String(
              patient.Full_Name ||
                patientId
            ),

          patient_name:
            String(
              patient.Full_Name ||
                patientId
            ),

          payment_method:
            String(
              latestPayment.Payment_Method ||
                ""
            ),

          payment_status:
            String(
              latestPayment.Payment_Status ||
                order.Payment_Status ||
                ""
            ),

          status:
            String(
              order.Order_Status ||
                ""
            ),

          order_status:
            String(
              order.Order_Status ||
                ""
            ),

          total_amount:
            totalAmount,

          cost_total:
            totalCostAmount,

          profit:
            totalProfitAmount,

          amount_paid:
            amountPaid,

          change_amount:
            Math.max(
              0,
              amountPaid -
                totalAmount
            ),

          quantity:
            quantity,

          item_count:
            items.length,

          items_count:
            items.length,

          created_at:
            dashboardDateText_(
              order.Order_Date
            ),

          date:
            dashboardDateText_(
              order.Order_Date
            ),
        };
      })
      .sort(function (a, b) {
        return (
          dashboardDateNumber_(
            b.created_at
          ) -
          dashboardDateNumber_(
            a.created_at
          )
        );
      });

  const topProducts =
    Object.keys(
      productTotals
    )
      .map(function (key) {
        return productTotals[
          key
        ];
      })
      .sort(function (a, b) {
        return (
          b.units_sold -
          a.units_sold
        );
      });

  return {
    ok:
      true,

    source:
      "google-sheets",

    generated_at:
      new Date().toISOString(),

    overview: {
      total_sales:
        totalSales,

      total_revenue:
        totalSales,

      total_cost:
        totalCost,

      gross_profit:
        totalProfit,

      total_profit:
        totalProfit,

      total_units:
        totalUnits,

      total_transactions:
        sales.length,
    },

    sales:
      sales,

    transactions:
      sales,

    products:
      topProducts,

    top_products:
      topProducts,

    count:
      sales.length,
  };
}


function handleAdminSales_(e) {
  try {
    if (
      !verifyAdminDashboardRequest_(
        e
      )
    ) {
      return webJson_({
        ok:
          false,

        error:
          "Unauthorized sales request.",
      });
    }

    return webJson_(
      buildAdminSales_()
    );

  } catch (error) {
    console.error(error);

    return webJson_({
      ok:
        false,

      error:
        error.message ||
        "Unable to load sales data.",
    });
  }
}


/* =========================================================
   ADMIN DASHBOARD
   ========================================================= */

function buildAdminDashboard_() {
  const spreadsheet =
    dashboardSpreadsheet_();

  const patients =
    dashboardReadSheet_(
      spreadsheet,
      "Patients"
    );

  const drugs =
    dashboardReadSheet_(
      spreadsheet,
      "Drugs"
    );

  const orders =
    dashboardReadSheet_(
      spreadsheet,
      "Orders"
    );

  const orderItems =
    dashboardReadSheet_(
      spreadsheet,
      "Order_Items"
    );

  const payments =
    dashboardReadSheet_(
      spreadsheet,
      "Payments"
    );

  const inventory =
    dashboardReadSheet_(
      spreadsheet,
      "Inventory"
    );

  const refills =
    dashboardReadSheet_(
      spreadsheet,
      "Refills"
    );

  const invoices =
    dashboardReadSheet_(
      spreadsheet,
      "Invoices_Receipts"
    );

  const auditLog =
    dashboardReadSheet_(
      spreadsheet,
      "Audit_Log"
    );

  const patientsById =
    {};

  const drugsById =
    {};

  const ordersById =
    {};

  const itemsByOrder =
    {};

  patients.forEach(
    function (patient) {
      const id =
        String(
          patient.Patient_ID ||
            ""
        ).trim();

      if (id) {
        patientsById[id] =
          patient;
      }
    }
  );

  drugs.forEach(
    function (drug) {
      const id =
        String(
          drug.Drug_ID ||
            ""
        ).trim();

      if (id) {
        drugsById[id] =
          drug;
      }
    }
  );

  orders.forEach(
    function (order) {
      const id =
        String(
          order.Order_ID ||
            ""
        ).trim();

      if (id) {
        ordersById[id] =
          order;
      }
    }
  );

  orderItems.forEach(
    function (item) {
      const orderId =
        String(
          item.Order_ID ||
            ""
        ).trim();

      if (!orderId) {
        return;
      }

      if (
        !itemsByOrder[
          orderId
        ]
      ) {
        itemsByOrder[
          orderId
        ] = [];
      }

      itemsByOrder[
        orderId
      ].push(
        item
      );
    }
  );

  let totalSales = 0;
  let totalCost = 0;
  let totalProfit = 0;
  let unitsSold = 0;

  const medicineTotals =
    {};

  const monthlyTotals =
    {};

  orderItems.forEach(
    function (item) {
      const quantity =
        dashboardNumber_(
          item.Quantity
        );

      const sales =
        dashboardNumber_(
          item.Total_Amount
        );

      const cost =
        dashboardNumber_(
          item.Cost_Total
        );

      const profit =
        dashboardNumber_(
          item.Profit
        ) ||
        sales - cost;

      totalSales +=
        sales;

      totalCost +=
        cost;

      totalProfit +=
        profit;

      unitsSold +=
        quantity;

      const drugId =
        String(
          item.Drug_ID ||
            ""
        ).trim();

      const drug =
        drugsById[
          drugId
        ] || {};

      if (
        !medicineTotals[
          drugId
        ]
      ) {
        medicineTotals[
          drugId
        ] = {
          drug_id:
            drugId,

          drug_name:
            String(
              drug.Drug_Name ||
                drugId
            ),

          category:
            String(
              drug.Category ||
                ""
            ),

          quantity_sold:
            0,

          sales:
            0,

          profit:
            0,
        };
      }

      medicineTotals[
        drugId
      ].quantity_sold +=
        quantity;

      medicineTotals[
        drugId
      ].sales +=
        sales;

      medicineTotals[
        drugId
      ].profit +=
        profit;

      const order =
        ordersById[
          String(
            item.Order_ID ||
              ""
          ).trim()
        ];

      if (order) {
        const month =
          dashboardMonth_(
            order.Order_Date
          );

        if (month) {
          if (
            !monthlyTotals[
              month
            ]
          ) {
            monthlyTotals[
              month
            ] = {
              month:
                month,

              sales:
                0,

              profit:
                0,

              units:
                0,
            };
          }

          monthlyTotals[
            month
          ].sales +=
            sales;

          monthlyTotals[
            month
          ].profit +=
            profit;

          monthlyTotals[
            month
          ].units +=
            quantity;
        }
      }
    }
  );

  let paidOrders = 0;
  let pendingOrders = 0;
  let completedOrders = 0;

  orders.forEach(
    function (order) {
      const paymentStatus =
        dashboardStatus_(
          order.Payment_Status
        );

      const orderStatus =
        dashboardStatus_(
          order.Order_Status
        );

      if (
        paymentStatus ===
        "paid"
      ) {
        paidOrders +=
          1;
      }

      if (
        orderStatus ===
        "completed"
      ) {
        completedOrders +=
          1;
      }

      if (
        paymentStatus !==
          "paid" ||
        orderStatus !==
          "completed"
      ) {
        pendingOrders +=
          1;
      }
    }
  );


  /* =======================================================
     REFILL SUMMARY
     ======================================================= */

  const refillSummary = {
    total:
      refills.length,

    due_soon:
      0,

    due_today:
      0,

    overdue:
      0,

    missed_expired:
      0,

    rescheduled:
      0,

    cancelled_by_patient:
      0,

    clinically_declined:
      0,

    confirmed:
      0,

    pending_confirmation:
      0,
  };


  refills.forEach(
    function (refill) {
      const reminder =
        dashboardStatus_(
          refill.Reminder_Status
        );

      const confirmation =
        dashboardStatus_(
          refill.Confirmation_Status
        );

      const patientResponse =
        dashboardStatus_(
          refill.Patient_Response
        );

      const resolution =
        dashboardStatus_(
          refill.Resolution_Status
        );

      const generatedOrderId =
        String(
          refill.Generated_Order_ID ||
            ""
        ).trim();


      const isConfirmed =
        confirmation ===
          "confirmed" ||
        patientResponse ===
          "confirmed" ||
        Boolean(
          generatedOrderId
        );


      const isCancelled =
        resolution ===
          "cancelled by patient" ||
        patientResponse ===
          "cancelled by patient" ||
        patientResponse ===
          "patient cancelled";


      const isClinicallyDeclined =
        resolution ===
          "clinically declined" ||
        resolution ===
          "declined on clinical review";


      const isRescheduled =
        resolution ===
          "rescheduled";


      if (
        reminder ===
        "due soon"
      ) {
        refillSummary.due_soon +=
          1;
      }


      if (
        reminder ===
        "due today"
      ) {
        refillSummary.due_today +=
          1;
      }


      if (
        reminder ===
        "overdue"
      ) {
        refillSummary.overdue +=
          1;
      }


      if (
        reminder ===
        "missed / expired"
      ) {
        refillSummary
          .missed_expired +=
          1;
      }


      if (
        isRescheduled
      ) {
        refillSummary
          .rescheduled +=
          1;
      }


      if (
        isCancelled
      ) {
        refillSummary
          .cancelled_by_patient +=
          1;
      }


      if (
        isClinicallyDeclined
      ) {
        refillSummary
          .clinically_declined +=
          1;
      }


      if (
        isConfirmed
      ) {
        refillSummary.confirmed +=
          1;
      } else if (
        !isCancelled &&
        !isClinicallyDeclined
      ) {
        refillSummary
          .pending_confirmation +=
          1;
      }
    }
  );


  /* =======================================================
     INVENTORY SUMMARY
     ======================================================= */

  const inventorySummary = {
    total_items:
      inventory.length,

    total_units:
      0,

    healthy:
      0,

    low_stock:
      0,

    out_of_stock:
      0,
  };

  const lowStockItems =
    [];

  inventory.forEach(
    function (item) {
      const stock =
        dashboardNumber_(
          item.Stock_Quantity
        );

      const reorder =
        dashboardNumber_(
          item.Reorder_Level
        );

      inventorySummary.total_units +=
        stock;

      if (stock <= 0) {
        inventorySummary.out_of_stock +=
          1;

      } else if (
        stock <= reorder
      ) {
        inventorySummary.low_stock +=
          1;

      } else {
        inventorySummary.healthy +=
          1;
      }

      if (
        stock <= reorder
      ) {
        lowStockItems.push({
          inventory_id:
            String(
              item.Inventory_ID ||
                ""
            ),

          drug_id:
            String(
              item.Drug_ID ||
                ""
            ),

          drug_name:
            String(
              item.Drug_Name ||
                ""
            ),

          stock_quantity:
            stock,

          reorder_level:
            reorder,

          stock_status:
            String(
              item.Stock_Status ||
                ""
            ),
        });
      }
    }
  );


  /* =======================================================
     PAYMENT SUMMARY
     ======================================================= */

  const paymentSummary = {
    total:
      payments.length,

    paid:
      0,

    pending:
      0,

    confirmed:
      0,

    total_paid:
      0,
  };

  payments.forEach(
    function (payment) {
      const status =
        dashboardStatus_(
          payment.Payment_Status
        );

      if (
        status === "paid"
      ) {
        paymentSummary.paid +=
          1;

        paymentSummary.total_paid +=
          dashboardNumber_(
            payment.Amount_Paid
          );

      } else {
        paymentSummary.pending +=
          1;
      }

      const confirmed =
        dashboardStatus_(
          payment.Payment_Confirmed
        );

      if (
        confirmed === "true" ||
        confirmed === "yes"
      ) {
        paymentSummary.confirmed +=
          1;
      }
    }
  );


  /* =======================================================
     RECENT ORDERS
     ======================================================= */

  const recentOrders =
    orders
      .slice()
      .sort(function (a, b) {
        return (
          dashboardDateNumber_(
            b.Order_Date
          ) -
          dashboardDateNumber_(
            a.Order_Date
          )
        );
      })
      .slice(
        0,
        10
      )
      .map(function (order) {
        const orderId =
          String(
            order.Order_ID ||
              ""
          ).trim();

        const patientId =
          String(
            order.Patient_ID ||
              ""
          ).trim();

        const patient =
          patientsById[
            patientId
          ] || {};

        const items =
          itemsByOrder[
            orderId
          ] || [];

        let quantity = 0;
        let totalAmount = 0;
        let profit = 0;

        const medicineNames =
          [];

        items.forEach(
          function (item) {
            quantity +=
              dashboardNumber_(
                item.Quantity
              );

            totalAmount +=
              dashboardNumber_(
                item.Total_Amount
              );

            profit +=
              dashboardNumber_(
                item.Profit
              );

            const drug =
              drugsById[
                String(
                  item.Drug_ID ||
                    ""
                ).trim()
              ] || {};

            if (
              drug.Drug_Name
            ) {
              medicineNames.push(
                drug.Drug_Name
              );
            }
          }
        );

        return {
          order_id:
            orderId,

          order_date:
            dashboardDateText_(
              order.Order_Date
            ),

          patient_id:
            patientId,

          patient_name:
            String(
              patient.Full_Name ||
                patientId
            ),

          customer_type:
            String(
              order.Customer_Type ||
                ""
            ),

          payment_status:
            String(
              order.Payment_Status ||
                ""
            ),

          order_status:
            String(
              order.Order_Status ||
                ""
            ),

          quantity:
            quantity,

          total_amount:
            totalAmount,

          profit:
            profit,

          medicine_name:
            medicineNames.join(
              ", "
            ),
        };
      });


  const topMedicines =
    Object.keys(
      medicineTotals
    )
      .map(function (key) {
        return medicineTotals[
          key
        ];
      })
      .sort(function (a, b) {
        return (
          b.sales -
          a.sales
        );
      })
      .slice(
        0,
        10
      );


  const salesTrend =
    Object.keys(
      monthlyTotals
    )
      .sort()
      .map(function (month) {
        return monthlyTotals[
          month
        ];
      });


  return {
    ok:
      true,

    source:
      "google-sheets",

    generated_at:
      new Date().toISOString(),

    metrics: {
      total_patients:
        patients.length,

      total_orders:
        orders.length,

      paid_orders:
        paidOrders,

      pending_orders:
        pendingOrders,

      completed_orders:
        completedOrders,

      pending_refills:
        refillSummary
          .pending_confirmation,

      inventory_items:
        inventorySummary
          .total_items,

      inventory_units:
        inventorySummary
          .total_units,

      low_stock_items:
        inventorySummary
          .low_stock +
        inventorySummary
          .out_of_stock,

      total_sales:
        totalSales,

      total_cost:
        totalCost,

      total_profit:
        totalProfit,

      units_sold:
        unitsSold,

      total_payments:
        paymentSummary.total,

      paid_payments:
        paymentSummary.paid,

      pending_payments:
        paymentSummary.pending,
    },

    recent_orders:
      recentOrders,

    top_medicines:
      topMedicines,

    sales_trend:
      salesTrend,

    refill_summary:
      refillSummary,

    payment_summary:
      paymentSummary,

    inventory_summary:
      inventorySummary,

    low_stock_items:
      lowStockItems,

    invoice_summary: {
      total:
        invoices.length,
    },

    recent_activity:
      auditLog,

    patients:
      patients,

    drugs:
      drugs,

    orders:
      orders,

    order_items:
      orderItems,

    payments:
      payments,

    inventory:
      inventory,

    refills:
      refills,

    availability: {
      patients:
        true,

      orders:
        true,

      refills:
        true,

      sales:
        true,

      profit:
        true,

      payments:
        true,

      inventory:
        true,

      invoices:
        true,

      purchases:
        true,

      suppliers:
        true,

      appointments:
        false,

      prescriptions:
        false,
    },
  };
}


function handleAdminDashboard_(e) {
  try {
    if (
      !verifyAdminDashboardRequest_(
        e
      )
    ) {
      return webJson_({
        ok:
          false,

        error:
          "Unauthorized dashboard request.",
      });
    }

    return webJson_(
      buildAdminDashboard_()
    );

  } catch (error) {
    console.error(error);

    return webJson_({
      ok:
        false,

      error:
        error.message ||
        "Unable to load dashboard data.",
    });
  }
}


/* =========================================================
   PUBLIC REFILL CONFIRMATION
   ========================================================= */

function handleRefillConfirmationPage_(e) {
  const refillId =
    String(
      e?.parameter?.refillId ||
        ""
    ).trim();

  const token =
    String(
      e?.parameter?.token ||
        ""
    ).trim();

  if (
    !refillId ||
    !token
  ) {
    return errorPage_(
      "Invalid Refill Link",
      "This refill confirmation link is incomplete."
    );
  }

  try {
    const result =
      processRefillConfirmation_(
        refillId,
        token
      );

    return refillConfirmedPage_(
      result
    );

  } catch (error) {
    return errorPage_(
      "Unable to Confirm Refill",
      error.message
    );
  }
}


/* =========================================================
   PAYMENT PAGE
   ========================================================= */

function handlePaymentPage_(e) {
  const orderId =
    String(
      e?.parameter?.orderId ||
        ""
    ).trim();

  const token =
    String(
      e?.parameter?.token ||
        ""
    ).trim();

  if (
    !orderId ||
    !token
  ) {
    return errorPage_(
      "Invalid Payment Link",
      "This payment link is incomplete."
    );
  }

  if (
    !verifyToken_(
      "PAYMENT:" +
        orderId,
      token
    )
  ) {
    return errorPage_(
      "Invalid Payment Link",
      "This payment link is not valid."
    );
  }

  try {
    const context =
      getPaymentContext_(
        orderId
      );

    const settings =
      loadPaymentSettings_();

    return paymentCentrePage_(
      context,
      settings
    );

  } catch (error) {
    return errorPage_(
      "Payment Centre Error",
      error.message
    );
  }
}


function handlePaystackStart_(e) {
  const orderId =
    String(
      e?.parameter?.orderId ||
        ""
    ).trim();

  const token =
    String(
      e?.parameter?.token ||
        ""
    ).trim();

  if (
    !verifyToken_(
      "PAYMENT:" +
        orderId,
      token
    )
  ) {
    return errorPage_(
      "Invalid Payment Request",
      "This payment request is not valid."
    );
  }

  const result =
    initializePaystackMobileMoney_(
      orderId
    );

  return redirectToProviderPage_(
    result.checkoutUrl
  );
}


function handlePaystackCallback_(e) {
  const paymentId =
    String(
      e?.parameter?.paymentId ||
        ""
    ).trim();

  const token =
    String(
      e?.parameter?.token ||
        ""
    ).trim();

  const returnedReference =
    String(
      e?.parameter?.reference ||
        e?.parameter?.trxref ||
        ""
    ).trim();

  const payment =
    findRecord_(
      "Payments",
      "Payment_ID",
      paymentId
    );

  if (!payment) {
    return errorPage_(
      "Payment Not Found",
      "The payment record could not be found."
    );
  }

  const expectedPayload =
    "PAYSTACK_CALLBACK:" +
    paymentId +
    ":" +
    String(
      payment.Transaction_Reference ||
        ""
    ).trim();

  if (
    !verifyToken_(
      expectedPayload,
      token
    )
  ) {
    return errorPage_(
      "Invalid Payment Callback",
      "The callback could not be verified."
    );
  }

  try {
    const result =
      verifyPaystackPayment_(
        paymentId,
        returnedReference
      );

    return paymentVerifiedPage_(
      result
    );

  } catch (error) {
    return paymentVerificationFailedPage_(
      error.message
    );
  }
}


function handleInvoicePage_(e) {
  const invoiceId =
    String(
      e?.parameter?.invoiceId ||
        ""
    ).trim();

  const token =
    String(
      e?.parameter?.token ||
        ""
    ).trim();

  if (
    !verifyToken_(
      "INVOICE:" +
        invoiceId,
      token
    )
  ) {
    return errorPage_(
      "Invalid Invoice Link",
      "This invoice link is not valid."
    );
  }

  try {
    const invoice =
      getInvoice_(
        invoiceId
      );

    const orderId =
      String(
        invoice.Order_ID ||
          ""
      ).trim();

    const context =
      getOrderContext_(
        orderId
      );

    const paymentToken =
      createToken_(
        "PAYMENT:" +
          orderId
      );

    return invoicePage_({
      invoiceId:
        invoice.Invoice_ID,

      orderId:
        orderId,

      invoiceDate:
        invoice.Invoice_Date,

      amount:
        Number(
          invoice.Invoice_Amount ||
            0
        ),

      invoiceStatus:
        String(
          invoice.Invoice_Status ||
            ""
        ),

      patientId:
        context.patient.Patient_ID,

      patientName:
        context.patient.Full_Name,

      customerType:
        context.order.Customer_Type,

      items:
        context.items,

      paymentLink:
        buildPublicUrl_(
          "payment",
          {
            orderId:
              orderId,

            token:
              paymentToken,
          }
        ),
    });

  } catch (error) {
    return errorPage_(
      "Invoice Error",
      error.message
    );
  }
}


function handleContactPatientPage_(e) {
  const patientId =
    String(
      e?.parameter?.patientId ||
        ""
    ).trim();

  const token =
    String(
      e?.parameter?.token ||
        ""
    ).trim();

  if (
    !verifyToken_(
      "CONTACT:" +
        patientId,
      token
    )
  ) {
    return errorPage_(
      "Invalid Contact Link",
      "This patient contact link is not valid."
    );
  }

  const patient =
    findRecord_(
      "Patients",
      "Patient_ID",
      patientId
    );

  if (!patient) {
    return errorPage_(
      "Patient Not Found",
      "Patient was not found."
    );
  }

  return contactPatientPage_({
    patientId:
      patient.Patient_ID,

    patientName:
      patient.Full_Name,

    phone:
      patient.Phone,

    preferredContact:
      patient.Preferred_Contact,
  });
}


function handleBankTransferSubmission_(e) {
  const orderId =
    String(
      e?.parameter?.orderId ||
        ""
    ).trim();

  const token =
    String(
      e?.parameter?.token ||
        ""
    ).trim();

  const transferReference =
    String(
      e?.parameter
        ?.transferReference ||
        ""
    ).trim();

  if (
    !verifyToken_(
      "PAYMENT:" +
        orderId,
      token
    )
  ) {
    return errorPage_(
      "Invalid Bank Transfer",
      "This bank transfer request is not valid."
    );
  }

  const context =
    getPaymentContext_(
      orderId
    );

  const payment =
    createPendingPayment_(
      orderId,
      "Bank Transfer",
      "GCB"
    );

  updateProviderStatus_(
    payment.paymentId,
    transferReference,
    "Submitted"
  );

  return bankTransferSubmittedPage_({
    paymentId:
      payment.paymentId,

    orderId:
      orderId,

    patientName:
      context.patientName,

    amount:
      context.amount,

    transferReference:
      transferReference,
  });
}


function redirectToProviderPage_(url) {
  const safeUrl =
    String(url || "")
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      );

  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <base target="_top">

      <meta
        name="viewport"
        content="width=device-width, initial-scale=1"
      >

      <meta
        http-equiv="refresh"
        content="0;url=${safeUrl}"
      >

      <title>
        Secure Payment
      </title>
    </head>

    <body
      style="
        font-family:Arial,sans-serif;
        text-align:center;
        padding:40px;
      "
    >
      <p>
        Opening secure checkout...
      </p>

      <a href="${safeUrl}">
        Continue
      </a>
    </body>
  </html>
  `;

  return HtmlService
    .createHtmlOutput(
      html
    )
    .setTitle(
      "Secure Payment"
    );
}