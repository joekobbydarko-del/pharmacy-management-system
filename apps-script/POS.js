/**
 * ============================================================
 * DR. EVANS PHARMACY
 * ADMIN POS ENGINE
 * ============================================================
 *
 * REMOTE PHARMACY RULES
 * ------------------------------------------------------------
 * - Every sale belongs to a real registered patient.
 * - Walk-in customers are NOT supported.
 * - A patient may buy multiple medicines in one order.
 * - One Order_ID can contain many Order_Items.
 * - Selling prices come from Google Sheets, never the frontend.
 * - Monthly patients use Monthly_Price.
 * - Other patients use One_Time_Price.
 * - Stock is checked again while the script lock is held.
 * - Completed POS sales update:
 *      Orders
 *      Order_Items
 *      Payments
 *      Invoices_Receipts
 *      Inventory
 *      Drugs.Stock_Quantity
 *
 * Existing Admin Sales and Dashboard will therefore see
 * the same transaction automatically.
 * ============================================================
 */


/**
 * ============================================================
 * SMALL POS HELPERS
 * ============================================================
 */

function posText_(value) {
  return String(
    value === undefined ||
    value === null
      ? ""
      : value
  ).trim();
}


function posMoney_(value) {
  const number =
    dashboardNumber_(
      value
    );

  if (
    !isFinite(number)
  ) {
    return 0;
  }

  return Number(
    number.toFixed(2)
  );
}


function posInteger_(value) {
  const number =
    Math.floor(
      dashboardNumber_(
        value
      )
    );

  return isFinite(number)
    ? number
    : 0;
}


function posPaymentMethod_(value) {
  const text =
    posText_(value)
      .toLowerCase();

  if (
    text === "cash"
  ) {
    return "Cash";
  }

  if (
    text === "mobile money" ||
    text === "mobile_money" ||
    text === "momo"
  ) {
    return "Mobile Money";
  }

  if (
    text === "bank transfer" ||
    text === "bank_transfer"
  ) {
    return "Bank Transfer";
  }

  if (
    text === "card"
  ) {
    return "Card";
  }

  if (!text) {
    return "Cash";
  }

  return text
    .split(/[\s_-]+/)
    .map(function (part) {
      if (!part) {
        return "";
      }

      return (
        part.charAt(0).toUpperCase() +
        part.slice(1)
      );
    })
    .join(" ");
}


/**
 * ============================================================
 * NEXT NUMERIC ID
 * ============================================================
 */

function posNextId_(
  rows,
  field,
  prefix,
  digits,
  offset
) {
  let maximum = 0;

  (rows || []).forEach(
    function (row) {
      const value =
        posText_(
          row[field]
        );

      const match =
        value.match(
          /(\d+)$/
        );

      if (!match) {
        return;
      }

      const number =
        Number(
          match[1]
        );

      if (
        isFinite(number) &&
        number > maximum
      ) {
        maximum = number;
      }
    }
  );

  const increment =
    Number(offset || 1);

  return (
    prefix +
    String(
      maximum + increment
    ).padStart(
      digits,
      "0"
    )
  );
}


/**
 * ============================================================
 * FIND ROW BY FIELD
 * ============================================================
 */

function posFindRowByField_(
  sheet,
  field,
  value
) {
  const map =
    purchaseHeaderMap_(
      sheet
    );

  const column =
    map[field];

  if (!column) {
    throw new Error(
      sheet.getName() +
      " sheet does not contain " +
      field +
      "."
    );
  }

  const lastRow =
    sheet.getLastRow();

  if (
    lastRow < 2
  ) {
    return null;
  }

  const values =
    sheet
      .getRange(
        2,
        column,
        lastRow - 1,
        1
      )
      .getValues();

  const target =
    posText_(
      value
    );

  for (
    let index = 0;
    index < values.length;
    index++
  ) {
    if (
      posText_(
        values[index][0]
      ) === target
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


/**
 * ============================================================
 * SAFE DELETE FOR CHECKOUT ROLLBACK
 * ============================================================
 */

function posDeleteRecord_(
  sheetName,
  idField,
  idValue
) {
  const spreadsheet =
    dashboardSpreadsheet_();

  const sheet =
    spreadsheet.getSheetByName(
      sheetName
    );

  if (!sheet) {
    return false;
  }

  const info =
    posFindRowByField_(
      sheet,
      idField,
      idValue
    );

  if (!info) {
    return false;
  }

  sheet.deleteRow(
    info.row
  );

  return true;
}


/**
 * ============================================================
 * REGISTERED PATIENT
 * ============================================================
 */

function posPatient_(
  patientId
) {
  const cleanPatientId =
    posText_(
      patientId
    );

  if (!cleanPatientId) {
    throw new Error(
      "Please select a patient."
    );
  }

  const patient =
    findRecord_(
      "Patients",
      "Patient_ID",
      cleanPatientId
    );

  if (!patient) {
    throw new Error(
      "Selected patient was not found."
    );
  }

  const patientName =
    posText_(
      patient.Full_Name
    );

  if (!patientName) {
    throw new Error(
      "Selected patient does not have a valid name."
    );
  }

  return patient;
}


/**
 * ============================================================
 * AUTHORITATIVE PATIENT PRICE
 * ============================================================
 */

function posPatientPrice_(
  patient,
  drug
) {
  const customerType =
    posText_(
      patient.Customer_Type
    );

  let price = 0;

  if (
    customerType.toLowerCase() ===
    "monthly"
  ) {
    price =
      posMoney_(
        drug.Monthly_Price
      );
  } else {
    price =
      posMoney_(
        drug.One_Time_Price
      );
  }

  if (
    price <= 0
  ) {
    throw new Error(
      "A valid selling price was not found for " +
      posText_(
        drug.Drug_Name ||
        drug.Drug_ID
      ) +
      "."
    );
  }

  return price;
}


/**
 * ============================================================
 * BUILD POS PRODUCTS
 * ============================================================
 */

function buildAdminPosProducts_() {
  const spreadsheet =
    dashboardSpreadsheet_();

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

  const inventoryByDrug =
    {};

  inventory.forEach(
    function (item) {
      const drugId =
        posText_(
          item.Drug_ID
        );

      if (drugId) {
        inventoryByDrug[
          drugId
        ] = item;
      }
    }
  );

  const products =
    drugs
      .map(function (drug) {
        const drugId =
          posText_(
            drug.Drug_ID
          );

        const inventoryItem =
          inventoryByDrug[
            drugId
          ] || {};

        const stock =
          posInteger_(
            inventoryItem
              .Stock_Quantity !==
              undefined

              ? inventoryItem
                  .Stock_Quantity

              : drug
                  .Stock_Quantity
          );

        const reorderLevel =
          posInteger_(
            inventoryItem
              .Reorder_Level !==
              undefined

              ? inventoryItem
                  .Reorder_Level

              : drug
                  .Reorder_Level
          );

        const oneTimePrice =
          posMoney_(
            drug.One_Time_Price
          );

        const monthlyPrice =
          posMoney_(
            drug.Monthly_Price
          );

        return {
          drug_id:
            drugId,

          drug_name:
            posText_(
              drug.Drug_Name
            ),

          category:
            posText_(
              drug.Category
            ),

          cost_price:
            posMoney_(
              drug.Cost_Price
            ),

          /**
           * Backward compatibility with the
           * current AdminPOSPage.jsx.
           */
          price:
            oneTimePrice,

          one_time_price:
            oneTimePrice,

          monthly_price:
            monthlyPrice,

          stock_quantity:
            stock,

          reorder_level:
            reorderLevel,

          status:
            calculateInventoryStatus_(
              stock,
              reorderLevel
            ),
        };
      })
      .filter(
        function (product) {
          return Boolean(
            product.drug_id
          );
        }
      )
      .sort(
        function (a, b) {
          return a.drug_name
            .localeCompare(
              b.drug_name
            );
        }
      );

  return {
    ok:
      true,

    source:
      "google-sheets",

    generated_at:
      new Date()
        .toISOString(),

    products:
      products,

    count:
      products.length,
  };
}


/**
 * ============================================================
 * POS PRODUCTS ENDPOINT
 * ============================================================
 */

function handleAdminPosProducts_(
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
          "Unauthorized POS products request.",
      });
    }

    return webJson_(
      buildAdminPosProducts_()
    );
  } catch (error) {
    console.error(
      error
    );

    return webJson_({
      ok:
        false,

      error:
        error.message ||
        "Unable to load POS products.",
    });
  }
}


/**
 * ============================================================
 * BUILD POS SALES
 * ============================================================
 *
 * POS uses the SAME Orders / Order_Items / Payments
 * records as the Admin Sales page.
 * ============================================================
 */

function buildAdminPosSales_() {
  const salesData =
    buildAdminSales_();

  const sales =
    (
      salesData.sales ||
      salesData.transactions ||
      []
    )
      .slice()
      .sort(
        function (a, b) {
          return (
            dashboardDateNumber_(
              b.created_at ||
              b.date
            ) -
            dashboardDateNumber_(
              a.created_at ||
              a.date
            )
          );
        }
      )
      .slice(
        0,
        100
      );

  return {
    ok:
      true,

    source:
      "google-sheets",

    generated_at:
      new Date()
        .toISOString(),

    sales:
      sales,

    count:
      sales.length,
  };
}


/**
 * ============================================================
 * POS SALES ENDPOINT
 * ============================================================
 */

function handleAdminPosSales_(
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
          "Unauthorized POS sales request.",
      });
    }

    return webJson_(
      buildAdminPosSales_()
    );
  } catch (error) {
    console.error(
      error
    );

    return webJson_({
      ok:
        false,

      error:
        error.message ||
        "Unable to load POS sales.",
    });
  }
}


/**
 * ============================================================
 * NORMALIZE CHECKOUT ITEMS
 * ============================================================
 *
 * If the same medicine somehow appears twice in the payload,
 * combine it into one Order_Items row.
 * ============================================================
 */

function normalizePosItems_(
  items
) {
  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    throw new Error(
      "Cart is empty."
    );
  }

  const quantities =
    {};

  items.forEach(
    function (item) {
      const drugId =
        posText_(
          item &&
          item.drug_id
        );

      const quantity =
        posInteger_(
          item &&
          item.quantity
        );

      if (!drugId) {
        throw new Error(
          "Every POS item must contain a Drug ID."
        );
      }

      if (
        quantity < 1
      ) {
        throw new Error(
          "Medicine quantity must be at least 1."
        );
      }

      if (
        !quantities[
          drugId
        ]
      ) {
        quantities[
          drugId
        ] = 0;
      }

      quantities[
        drugId
      ] += quantity;
    }
  );

  return Object
    .keys(
      quantities
    )
    .map(
      function (drugId) {
        return {
          drug_id:
            drugId,

          quantity:
            quantities[
              drugId
            ],
        };
      }
    );
}


/**
 * ============================================================
 * CORE POS CHECKOUT
 * ============================================================
 */

function createAdminPosSale_(
  payload
) {
  payload =
    payload || {};

  const patientId =
    posText_(
      payload.patient_id
    );

  if (!patientId) {
    throw new Error(
      "Please select a registered patient."
    );
  }

  const requestedItems =
    normalizePosItems_(
      payload.items
    );

  const paymentMethod =
    posPaymentMethod_(
      payload.payment_method
    );

  const amountTendered =
    posMoney_(
      payload.amount_paid
    );

  if (
    amountTendered < 0
  ) {
    throw new Error(
      "Amount paid cannot be negative."
    );
  }

  const spreadsheet =
    dashboardSpreadsheet_();

  const inventorySheet =
    spreadsheet.getSheetByName(
      "Inventory"
    );

  const drugsSheet =
    spreadsheet.getSheetByName(
      "Drugs"
    );

  if (!inventorySheet) {
    throw new Error(
      "Inventory sheet was not found."
    );
  }

  if (!drugsSheet) {
    throw new Error(
      "Drugs sheet was not found."
    );
  }

  const lock =
    LockService.getScriptLock();

  lock.waitLock(
    30000
  );

  const createdRecords =
    [];

  const originalInventory =
    [];

  let orderId = "";
  let invoiceId = "";
  let paymentId = "";

  let patient = null;
  let customerType = "";
  let patientName = "";

  let totalAmount = 0;
  let subtotal = 0;
  let changeAmount = 0;

  const saleItems =
    [];

  try {
    /**
     * ----------------------------------------------------------
     * PATIENT IS CHECKED WHILE LOCK IS HELD
     * ----------------------------------------------------------
     */

    patient =
      posPatient_(
        patientId
      );

    patientName =
      posText_(
        patient.Full_Name
      );

    customerType =
      posText_(
        patient.Customer_Type
      );

    /**
     * ----------------------------------------------------------
     * LOAD CURRENT ID SOURCES
     * ----------------------------------------------------------
     */

    const orders =
      dashboardReadSheet_(
        spreadsheet,
        "Orders"
      );

    const existingOrderItems =
      dashboardReadSheet_(
        spreadsheet,
        "Order_Items"
      );

    const payments =
      dashboardReadSheet_(
        spreadsheet,
        "Payments"
      );

    const invoices =
      dashboardReadSheet_(
        spreadsheet,
        "Invoices_Receipts"
      );

    orderId =
      posNextId_(
        orders,
        "Order_ID",
        "O",
        3,
        1
      );

    paymentId =
      posNextId_(
        payments,
        "Payment_ID",
        "PAY",
        3,
        1
      );

    invoiceId =
      posNextId_(
        invoices,
        "Invoice_ID",
        "INV",
        3,
        1
      );

    /**
     * ----------------------------------------------------------
     * VALIDATE EVERY MEDICINE BEFORE WRITING ANY SALE RECORDS
     * ----------------------------------------------------------
     */

    requestedItems.forEach(
      function (
        requestedItem,
        itemIndex
      ) {
        const drugId =
          requestedItem
            .drug_id;

        const quantity =
          requestedItem
            .quantity;

        const drug =
          findRecord_(
            "Drugs",
            "Drug_ID",
            drugId
          );

        if (!drug) {
          throw new Error(
            "Drug not found: " +
            drugId
          );
        }

        const drugName =
          posText_(
            drug.Drug_Name ||
            drugId
          );

        const inventoryInfo =
          findInventoryRow_(
            inventorySheet,
            drugId
          );

        if (!inventoryInfo) {
          throw new Error(
            "Inventory item not found for " +
            drugName +
            "."
          );
        }

        const inventoryMap =
          inventoryInfo.map;

        if (
          !inventoryMap
            .Stock_Quantity
        ) {
          throw new Error(
            "Inventory sheet does not contain Stock_Quantity."
          );
        }

        const stockQuantity =
          posInteger_(
            inventorySheet
              .getRange(
                inventoryInfo.row,
                inventoryMap
                  .Stock_Quantity
              )
              .getValue()
          );

        if (
          stockQuantity <
          quantity
        ) {
          throw new Error(
            "Not enough stock for " +
            drugName +
            ". Available: " +
            stockQuantity +
            "."
          );
        }

        const reorderLevel =
          inventoryMap
            .Reorder_Level

            ? posInteger_(
                inventorySheet
                  .getRange(
                    inventoryInfo.row,
                    inventoryMap
                      .Reorder_Level
                  )
                  .getValue()
              )

            : 0;

        const unitPrice =
          posPatientPrice_(
            patient,
            drug
          );

        const lineTotal =
          posMoney_(
            unitPrice *
            quantity
          );

        const costPrice =
          posMoney_(
            drug.Cost_Price
          );

        const costTotal =
          posMoney_(
            costPrice *
            quantity
          );

        const profit =
          posMoney_(
            lineTotal -
            costTotal
          );

        const newStock =
          stockQuantity -
          quantity;

        const orderItemId =
          posNextId_(
            existingOrderItems,
            "Order_Item_ID",
            "OI",
            3,
            itemIndex + 1
          );

        /**
         * Find matching Drugs row so its stock mirror
         * can stay synchronized with Inventory.
         */
        const drugRowInfo =
          findDrugRow_(
            drugsSheet,
            drugId
          );

        if (!drugRowInfo) {
          throw new Error(
            "Drug row could not be found for " +
            drugName +
            "."
          );
        }

        saleItems.push({
          order_item_id:
            orderItemId,

          drug_id:
            drugId,

          drug_name:
            drugName,

          quantity:
            quantity,

          unit_price:
            unitPrice,

          total_amount:
            lineTotal,

          cost_price:
            costPrice,

          cost_total:
            costTotal,

          profit:
            profit,

          stock_before:
            stockQuantity,

          stock_after:
            newStock,

          reorder_level:
            reorderLevel,

          inventory_row:
            inventoryInfo.row,

          inventory_map:
            inventoryMap,

          drug_row:
            drugRowInfo.row,

          drug_map:
            drugRowInfo.map,
        });

        subtotal +=
          lineTotal;
      }
    );

    subtotal =
      posMoney_(
        subtotal
      );

    totalAmount =
      subtotal;

    if (
      totalAmount <= 0
    ) {
      throw new Error(
        "POS total must be greater than zero."
      );
    }

    if (
      amountTendered <
      totalAmount
    ) {
      throw new Error(
        "Amount paid is less than the order total."
      );
    }

    changeAmount =
      posMoney_(
        amountTendered -
        totalAmount
      );

    const now =
      new Date();

    /**
     * ----------------------------------------------------------
     * SAVE OLD STOCK VALUES FOR EMERGENCY ROLLBACK
     * ----------------------------------------------------------
     */

    saleItems.forEach(
      function (item) {
        const inventoryStock =
          inventorySheet
            .getRange(
              item.inventory_row,
              item.inventory_map
                .Stock_Quantity
            )
            .getValue();

        let inventoryStatus = "";

        if (
          item.inventory_map
            .Stock_Status
        ) {
          inventoryStatus =
            inventorySheet
              .getRange(
                item.inventory_row,
                item.inventory_map
                  .Stock_Status
              )
              .getValue();
        }

        let inventoryUpdated = "";

        if (
          item.inventory_map
            .Last_Updated
        ) {
          inventoryUpdated =
            inventorySheet
              .getRange(
                item.inventory_row,
                item.inventory_map
                  .Last_Updated
              )
              .getValue();
        }

        let drugStock = "";

        if (
          item.drug_map
            .Stock_Quantity
        ) {
          drugStock =
            drugsSheet
              .getRange(
                item.drug_row,
                item.drug_map
                  .Stock_Quantity
              )
              .getValue();
        }

        originalInventory.push({
          inventory_row:
            item.inventory_row,

          inventory_map:
            item.inventory_map,

          inventory_stock:
            inventoryStock,

          inventory_status:
            inventoryStatus,

          inventory_updated:
            inventoryUpdated,

          drug_row:
            item.drug_row,

          drug_map:
            item.drug_map,

          drug_stock:
            drugStock,
        });
      }
    );

    /**
     * ----------------------------------------------------------
     * ORDER
     * ----------------------------------------------------------
     */

    appendRecord_(
      "Orders",
      {
        Order_ID:
          orderId,

        Order_Date:
          now,

        Patient_ID:
          patient.Patient_ID,

        Customer_Type:
          customerType,

        Payment_Status:
          CONFIG.STATUS.PAID,

        Order_Status:
          CONFIG.STATUS.COMPLETED,
      }
    );

    createdRecords.push({
      sheet:
        "Orders",

      field:
        "Order_ID",

      id:
        orderId,
    });

    /**
     * ----------------------------------------------------------
     * ORDER ITEMS
     * ----------------------------------------------------------
     */

    saleItems.forEach(
      function (item) {
        appendRecord_(
          "Order_Items",
          {
            Order_Item_ID:
              item.order_item_id,

            Order_ID:
              orderId,

            Drug_ID:
              item.drug_id,

            Quantity:
              item.quantity,

            Unit_Price:
              item.unit_price,

            Total_Amount:
              item.total_amount,

            Cost_Total:
              item.cost_total,

            Profit:
              item.profit,
          }
        );

        createdRecords.push({
          sheet:
            "Order_Items",

          field:
            "Order_Item_ID",

          id:
            item.order_item_id,
        });
      }
    );

    /**
     * ----------------------------------------------------------
     * INVOICE
     * ----------------------------------------------------------
     *
     * The invoice is already Paid because the POS transaction
     * represents a completed pharmacy sale.
     */

    const invoiceToken =
      createToken_(
        "INVOICE:" +
        invoiceId
      );

    const invoiceLink =
      buildPublicUrl_(
        "invoice",
        {
          invoiceId:
            invoiceId,

          token:
            invoiceToken,
        }
      );

    appendRecord_(
      "Invoices_Receipts",
      {
        Invoice_ID:
          invoiceId,

        Order_ID:
          orderId,

        Invoice_Date:
          now,

        Invoice_Amount:
          totalAmount,

        Invoice_Status:
          CONFIG.STATUS.PAID,

        Receipt_ID:
          "",

        Receipt_Date:
          "",

        Receipt_Status:
          "",

        Invoice_Link:
          invoiceLink,

        Receipt_PDF_Link:
          "",
      }
    );

    createdRecords.push({
      sheet:
        "Invoices_Receipts",

      field:
        "Invoice_ID",

      id:
        invoiceId,
    });

    /**
     * ----------------------------------------------------------
     * PAYMENT
     * ----------------------------------------------------------
     *
     * Payments.Amount_Paid stores the amount settled against
     * the invoice, not cash handed over before change.
     *
     * Example:
     * total = 95
     * patient/admin enters 100
     *
     * Payments.Amount_Paid = 95
     * checkout response change_amount = 5
     */

    const transactionReference =
      "POS-" +
      orderId +
      "-" +
      paymentId +
      "-" +
      now.getTime();

    appendRecord_(
      "Payments",
      {
        Payment_ID:
          paymentId,

        Order_ID:
          orderId,

        Patient_ID:
          patient.Patient_ID,

        Payment_Date:
          now,

        Amount_Paid:
          totalAmount,

        Payment_Method:
          paymentMethod,

        Network_Provider:
          "Admin POS",

        Transaction_Reference:
          transactionReference,

        Provider_Reference:
          transactionReference,

        Provider_Status:
          "Confirmed",

        Payment_Confirmed:
          true,

        Confirmed_By:
          "Admin POS",

        Confirmation_Date:
          now,

        Payment_Status:
          CONFIG.STATUS.PAID,
      }
    );

    createdRecords.push({
      sheet:
        "Payments",

      field:
        "Payment_ID",

      id:
        paymentId,
    });

    /**
     * ----------------------------------------------------------
     * DECREASE INVENTORY FOR EVERY MEDICINE
     * ----------------------------------------------------------
     */

    saleItems.forEach(
      function (item) {
        const inventoryMap =
          item.inventory_map;

        inventorySheet
          .getRange(
            item.inventory_row,
            inventoryMap
              .Stock_Quantity
          )
          .setValue(
            item.stock_after
          );

        if (
          inventoryMap
            .Stock_Status
        ) {
          inventorySheet
            .getRange(
              item.inventory_row,
              inventoryMap
                .Stock_Status
            )
            .setValue(
              calculateInventoryStatus_(
                item.stock_after,
                item.reorder_level
              )
            );
        }

        if (
          inventoryMap
            .Last_Updated
        ) {
          inventorySheet
            .getRange(
              item.inventory_row,
              inventoryMap
                .Last_Updated
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
              item.stock_after
            );
        }
      }
    );

    SpreadsheetApp.flush();

    /**
     * Audit failure should never reverse a valid sale.
     */
    try {
      logAudit_({
        userType:
          "Admin",

        userId:
          "ADMIN_POS",

        action:
          "POS SALE COMPLETED",

        recordType:
          "Order",

        recordId:
          orderId,

        details:
          "POS sale completed for patient " +
          patient.Patient_ID +
          " with " +
          saleItems.length +
          " medicine line(s).",
      });
    } catch (auditError) {
      console.error(
        auditError
      );
    }

  } catch (error) {
    /**
     * ----------------------------------------------------------
     * BEST-EFFORT ROLLBACK
     * ----------------------------------------------------------
     */

    try {
      for (
        let index =
          originalInventory.length - 1;
        index >= 0;
        index--
      ) {
        const old =
          originalInventory[
            index
          ];

        if (
          old.inventory_map
            .Stock_Quantity
        ) {
          inventorySheet
            .getRange(
              old.inventory_row,
              old.inventory_map
                .Stock_Quantity
            )
            .setValue(
              old.inventory_stock
            );
        }

        if (
          old.inventory_map
            .Stock_Status
        ) {
          inventorySheet
            .getRange(
              old.inventory_row,
              old.inventory_map
                .Stock_Status
            )
            .setValue(
              old.inventory_status
            );
        }

        if (
          old.inventory_map
            .Last_Updated
        ) {
          inventorySheet
            .getRange(
              old.inventory_row,
              old.inventory_map
                .Last_Updated
            )
            .setValue(
              old.inventory_updated
            );
        }

        if (
          old.drug_map
            .Stock_Quantity
        ) {
          drugsSheet
            .getRange(
              old.drug_row,
              old.drug_map
                .Stock_Quantity
            )
            .setValue(
              old.drug_stock
            );
        }
      }

      for (
        let index =
          createdRecords.length - 1;
        index >= 0;
        index--
      ) {
        const record =
          createdRecords[
            index
          ];

        try {
          posDeleteRecord_(
            record.sheet,
            record.field,
            record.id
          );
        } catch (
          deleteError
        ) {
          console.error(
            deleteError
          );
        }
      }

      SpreadsheetApp.flush();

    } catch (
      rollbackError
    ) {
      console.error(
        "POS rollback failed:",
        rollbackError
      );
    }

    throw error;

  } finally {
    lock.releaseLock();
  }

  /**
   * ==========================================================
   * RECEIPT
   * ==========================================================
   *
   * Core sale is already committed.
   * Receipt generation/email is best-effort and must not
   * destroy a valid sale if Drive or Mail temporarily fails.
   * ==========================================================
   */

  let receipt = null;
  let receiptError = "";

  try {
    receipt =
      generateReceiptForOrder_(
        orderId,
        false
      );
  } catch (error) {
    receiptError =
      error.message ||
      "Receipt generation failed.";

    console.error(
      receiptError
    );
  }

  return {
    message:
      "POS sale completed successfully.",

    sale: {
      id:
        orderId,

      sale_number:
        orderId,

      order_id:
        orderId,

      patient_id:
        patient.Patient_ID,

      customer_name:
        patientName,

      patient_name:
        patientName,

      customer_type:
        customerType,

      payment_id:
        paymentId,

      invoice_id:
        invoiceId,

      payment_method:
        paymentMethod,

      subtotal:
        subtotal,

      total_amount:
        totalAmount,

      amount_paid:
        amountTendered,

      settled_amount:
        totalAmount,

      change_amount:
        changeAmount,

      payment_status:
        CONFIG.STATUS.PAID,

      status:
        CONFIG.STATUS.COMPLETED,

      order_status:
        CONFIG.STATUS.COMPLETED,

      created_at:
        new Date()
          .toISOString(),

      item_count:
        saleItems.length,

      items:
        saleItems.map(
          function (item) {
            return {
              order_item_id:
                item.order_item_id,

              drug_id:
                item.drug_id,

              drug_name:
                item.drug_name,

              quantity:
                item.quantity,

              unit_price:
                item.unit_price,

              total_price:
                item.total_amount,

              total_amount:
                item.total_amount,

              cost_total:
                item.cost_total,

              profit:
                item.profit,

              stock_before:
                item.stock_before,

              stock_after:
                item.stock_after,
            };
          }
        ),

      receipt_id:
        receipt &&
        receipt.receiptId
          ? receipt.receiptId
          : "",

      receipt_pdf_link:
        receipt &&
        receipt.pdfLink
          ? receipt.pdfLink
          : "",

      receipt_generated:
        Boolean(
          receipt
        ),

      receipt_error:
        receiptError,
    },
  };
}


/**
 * ============================================================
 * POS CHECKOUT ENDPOINT
 * ============================================================
 */

function handleAdminPosCheckout_(
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
          "Unauthorized POS checkout request.",
      });
    }

    const payload =
      parseJsonBody_(
        e
      );

    const result =
      createAdminPosSale_(
        payload
      );

    return webJson_({
      ok:
        true,

      source:
        "google-sheets",

      ...result,
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
        "Unable to complete POS checkout.",
    });
  }
}


/**
 * ============================================================
 * SAFE POS ENGINE TEST
 * ============================================================
 *
 * READ ONLY.
 *
 * This does NOT create an order, payment, invoice,
 * or change stock.
 * ============================================================
 */

function testAdminPosProducts() {
  const result =
    buildAdminPosProducts_();

  Logger.log(
    JSON.stringify(
      {
        count:
          result.count,

        firstProduct:
          result.products.length
            ? result.products[0]
            : null,
      },
      null,
      2
    )
  );

  return result;
}