/**
 * DR. EVANS PHARMACY
 * SAFE DEMO RESET
 *
 * PURPOSE:
 * Return the demo system to its clean starting state
 * after development/testing.
 *
 * PRESERVES:
 * - Patients
 * - Drugs
 * - Payment_Settings
 * - Inventory structure
 * - Seed Orders O001 - O227
 * - Seed Order_Items linked to O001 - O227
 * - Seed Payments linked to O001 - O227
 * - Seed Invoices linked to O001 - O227
 *
 * REMOVES:
 * - Test orders created after O227
 * - Their order items
 * - Their payments
 * - Their invoice/receipt records
 * - SMS test logs
 * - Voice/call test logs
 * - Audit test logs
 *
 * RESETS:
 * - Refill reminder tracking
 * - Refill confirmation fields
 * - Generated order links
 */


const DEMO_RESET_CONFIG = {

  LAST_SEED_ORDER_NUMBER: 227,

  TRANSACTION_SHEETS: {
    ORDERS: "Orders",
    ORDER_ITEMS: "Order_Items",
    PAYMENTS: "Payments",
    INVOICES: "Invoices_Receipts"
  },

  LOG_SHEETS: [
    "SMS_Log",
    "Call_Log",
    "Audit_Log"
  ],

  REFILLS_SHEET:
    "Refills"

};


/********************************************************
 * GET ORDER NUMBER
 *
 * O241 -> 241
 ********************************************************/

function demoResetOrderNumber_(
  orderId
) {

  const value =
    String(
      orderId || ""
    ).trim();


  const match =
    value.match(
      /^O(\d+)$/i
    );


  if (!match) {

    return null;
  }


  return Number(
    match[1]
  );
}


/********************************************************
 * CHECK WHETHER ORDER IS A TEST ORDER
 ********************************************************/

function demoResetIsTestOrder_(
  orderId
) {

  const number =
    demoResetOrderNumber_(
      orderId
    );


  return (
    number !== null &&
    number >
      DEMO_RESET_CONFIG
        .LAST_SEED_ORDER_NUMBER
  );
}


/********************************************************
 * READ HEADERS
 ********************************************************/

function demoResetHeaders_(
  sheet
) {

  const lastColumn =
    sheet.getLastColumn();


  if (
    lastColumn < 1
  ) {

    return {};
  }


  const values =
    sheet
      .getRange(
        1,
        1,
        1,
        lastColumn
      )
      .getValues()[0];


  const map = {};


  values.forEach(
    (
      header,
      index
    ) => {

      const clean =
        String(
          header || ""
        ).trim();


      if (clean) {

        map[clean] =
          index + 1;
      }

    }
  );


  return map;
}


/********************************************************
 * GET TEST ORDER IDS
 ********************************************************/

function demoResetGetTestOrderIds_() {

  const sheet =
    sheet_(
      DEMO_RESET_CONFIG
        .TRANSACTION_SHEETS
        .ORDERS
    );


  const headers =
    demoResetHeaders_(
      sheet
    );


  if (
    !headers.Order_ID
  ) {

    throw new Error(
      "Orders sheet does not contain Order_ID."
    );
  }


  const lastRow =
    sheet.getLastRow();


  if (
    lastRow < 2
  ) {

    return [];
  }


  const values =
    sheet
      .getRange(
        2,
        headers.Order_ID,
        lastRow - 1,
        1
      )
      .getValues()
      .flat();


  return values
    .map(
      value =>
        String(
          value || ""
        ).trim()
    )
    .filter(
      value =>
        demoResetIsTestOrder_(
          value
        )
    );
}


/********************************************************
 * COUNT MATCHING ORDER ROWS
 ********************************************************/

function demoResetCountRowsForOrders_(
  sheetName,
  orderIds
) {

  const sheet =
    sheet_(
      sheetName
    );


  const headers =
    demoResetHeaders_(
      sheet
    );


  if (
    !headers.Order_ID
  ) {

    return 0;
  }


  const lastRow =
    sheet.getLastRow();


  if (
    lastRow < 2
  ) {

    return 0;
  }


  const idSet =
    new Set(
      orderIds
    );


  const values =
    sheet
      .getRange(
        2,
        headers.Order_ID,
        lastRow - 1,
        1
      )
      .getValues()
      .flat();


  return values.filter(
    value =>
      idSet.has(
        String(
          value || ""
        ).trim()
      )
  ).length;
}


/********************************************************
 * SAFE PREVIEW
 *
 * DOES NOT DELETE ANYTHING
 ********************************************************/

function previewDemoReset() {

  const orderIds =
    demoResetGetTestOrderIds_();


  const result = {

    seedOrdersPreserved:
      "O001 - O" +
      String(
        DEMO_RESET_CONFIG
          .LAST_SEED_ORDER_NUMBER
      ).padStart(
        3,
        "0"
      ),

    testOrderIds:
      orderIds,

    testOrdersToDelete:
      orderIds.length,

    orderItemsToDelete:
      demoResetCountRowsForOrders_(

        DEMO_RESET_CONFIG
          .TRANSACTION_SHEETS
          .ORDER_ITEMS,

        orderIds

      ),

    paymentsToDelete:
      demoResetCountRowsForOrders_(

        DEMO_RESET_CONFIG
          .TRANSACTION_SHEETS
          .PAYMENTS,

        orderIds

      ),

    invoiceRecordsToDelete:
      demoResetCountRowsForOrders_(

        DEMO_RESET_CONFIG
          .TRANSACTION_SHEETS
          .INVOICES,

        orderIds

      ),

    refillWorkflow:
      "Will reset reminder/confirmation/generated-order fields.",

    logs:
      "SMS_Log, Call_Log and Audit_Log data rows will be cleared.",

    masterData:
      "Patients, Drugs and Payment_Settings will NOT be changed."

  };


  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;
}


/********************************************************
 * DELETE ROWS MATCHING TEST ORDER IDS
 ********************************************************/

function demoResetDeleteRowsForOrders_(
  sheetName,
  orderIds
) {

  const sheet =
    sheet_(
      sheetName
    );


  const headers =
    demoResetHeaders_(
      sheet
    );


  if (
    !headers.Order_ID
  ) {

    throw new Error(
      sheetName +
      " does not contain Order_ID."
    );
  }


  const idSet =
    new Set(
      orderIds
    );


  let deleted =
    0;


  for (
    let row = sheet.getLastRow();
    row >= 2;
    row--
  ) {

    const orderId =
      String(
        sheet
          .getRange(
            row,
            headers.Order_ID
          )
          .getValue() ||
        ""
      ).trim();


    if (
      idSet.has(
        orderId
      )
    ) {

      sheet.deleteRow(
        row
      );

      deleted++;
    }

  }


  return deleted;
}


/********************************************************
 * DELETE TEST ORDERS THEMSELVES
 ********************************************************/

function demoResetDeleteTestOrders_(
  orderIds
) {

  const sheet =
    sheet_(
      DEMO_RESET_CONFIG
        .TRANSACTION_SHEETS
        .ORDERS
    );


  const headers =
    demoResetHeaders_(
      sheet
    );


  if (
    !headers.Order_ID
  ) {

    throw new Error(
      "Orders sheet does not contain Order_ID."
    );
  }


  const idSet =
    new Set(
      orderIds
    );


  let deleted =
    0;


  for (
    let row = sheet.getLastRow();
    row >= 2;
    row--
  ) {

    const orderId =
      String(
        sheet
          .getRange(
            row,
            headers.Order_ID
          )
          .getValue() ||
        ""
      ).trim();


    if (
      idSet.has(
        orderId
      )
    ) {

      sheet.deleteRow(
        row
      );

      deleted++;
    }

  }


  return deleted;
}


/********************************************************
 * RESET REFILL WORKFLOW FIELDS
 ********************************************************/

function demoResetRefills_() {

  const sheet =
    sheet_(
      DEMO_RESET_CONFIG
        .REFILLS_SHEET
    );


  const headers =
    demoResetHeaders_(
      sheet
    );


  const lastRow =
    sheet.getLastRow();


  if (
    lastRow < 2
  ) {

    return 0;
  }


  const fieldsToClear = [

    "Reminder_Sent",

    "Reminder_Sent_Date",

    "Patient_Response",

    "Confirmation_Date",

    "Generated_Order_ID"

  ];


  fieldsToClear.forEach(
    field => {

      if (
        headers[field]
      ) {

        sheet
          .getRange(
            2,
            headers[field],
            lastRow - 1,
            1
          )
          .clearContent();

      }

    }
  );


  if (
    headers.Confirmation_Status
  ) {

    sheet
      .getRange(
        2,
        headers.Confirmation_Status,
        lastRow - 1,
        1
      )
      .setValue(
        "Pending"
      );

  }


  SpreadsheetApp.flush();


  return (
    lastRow - 1
  );
}


/********************************************************
 * CLEAR LOG DATA, KEEP HEADERS
 ********************************************************/

function demoResetClearLog_(
  sheetName
) {

  const ss =
    getSystemSpreadsheet();


  const sheet =
    ss.getSheetByName(
      sheetName
    );


  if (!sheet) {

    return {
      sheet:
        sheetName,

      cleared:
        0,

      skipped:
        true
    };
  }


  const lastRow =
    sheet.getLastRow();


  if (
    lastRow < 2
  ) {

    return {
      sheet:
        sheetName,

      cleared:
        0,

      skipped:
        false
    };
  }


  const rows =
    lastRow - 1;


  const lastColumn =
    Math.max(
      sheet.getLastColumn(),
      1
    );


  sheet
    .getRange(
      2,
      1,
      rows,
      lastColumn
    )
    .clearContent();


  return {
    sheet:
      sheetName,

    cleared:
      rows,

    skipped:
      false
  };
}


/********************************************************
 * RUN FINAL DEMO RESET
 ********************************************************/

function runDemoReset() {

  const lock =
    LockService
      .getScriptLock();


  lock.waitLock(
    30000
  );


  try {

    const orderIds =
      demoResetGetTestOrderIds_();


    /**
     * Delete children first.
     */

    const deletedOrderItems =
      demoResetDeleteRowsForOrders_(

        DEMO_RESET_CONFIG
          .TRANSACTION_SHEETS
          .ORDER_ITEMS,

        orderIds

      );


    const deletedPayments =
      demoResetDeleteRowsForOrders_(

        DEMO_RESET_CONFIG
          .TRANSACTION_SHEETS
          .PAYMENTS,

        orderIds

      );


    const deletedInvoices =
      demoResetDeleteRowsForOrders_(

        DEMO_RESET_CONFIG
          .TRANSACTION_SHEETS
          .INVOICES,

        orderIds

      );


    /**
     * Delete parent orders last.
     */

    const deletedOrders =
      demoResetDeleteTestOrders_(
        orderIds
      );


    /**
     * Reset refill workflow.
     */

    const resetRefills =
      demoResetRefills_();


    /**
     * Clear development/test logs.
     */

    const logResults =
      DEMO_RESET_CONFIG
        .LOG_SHEETS
        .map(
          sheetName =>
            demoResetClearLog_(
              sheetName
            )
        );


    SpreadsheetApp.flush();


    /**
     * Recalculate refill status if
     * your current system has the function.
     */

    try {

      if (
        typeof refreshRefillStatuses ===
        "function"
      ) {

        refreshRefillStatuses();
      }

    }

    catch (
      refreshError
    ) {

      Logger.log(
        "Refill status refresh skipped: " +
        refreshError.message
      );
    }


    const result = {

      success:
        true,

      deletedTestOrderIds:
        orderIds,

      deletedOrders:
        deletedOrders,

      deletedOrderItems:
        deletedOrderItems,

      deletedPayments:
        deletedPayments,

      deletedInvoiceReceiptRows:
        deletedInvoices,

      resetRefillRows:
        resetRefills,

      logs:
        logResults,

      preserved:
        [
          "Patients",
          "Drugs",
          "Payment_Settings",
          "Orders O001-O227",
          "their original transaction history"
        ],

      note:
        "Google Drive PDF files were intentionally not deleted."

    };


    Logger.log(
      JSON.stringify(
        result,
        null,
        2
      )
    );


    return result;

  }

  finally {

    lock.releaseLock();

  }
}

/********************************************************
 * FINAL LOG CLEANUP ONLY
 *
 * Clears test/development log rows
 * but preserves the header row.
 ********************************************************/

function clearDemoLogsOnly() {

  const logSheets = [
    "SMS_Log",
    "Call_Log",
    "Audit_Log"
  ];


  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();


  const results = [];


  logSheets.forEach(
    sheetName => {

      const sheet =
        ss.getSheetByName(
          sheetName
        );


      if (!sheet) {

        results.push({

          sheet:
            sheetName,

          status:
            "NOT FOUND",

          rowsCleared:
            0

        });


        return;
      }


      const lastRow =
        sheet.getLastRow();


      const lastColumn =
        sheet.getLastColumn();


      if (
        lastRow <= 1
      ) {

        results.push({

          sheet:
            sheetName,

          status:
            "ALREADY EMPTY",

          rowsCleared:
            0

        });


        return;
      }


      const rowsToClear =
        lastRow - 1;


      sheet
        .getRange(
          2,
          1,
          rowsToClear,
          lastColumn
        )
        .clearContent();


      results.push({

        sheet:
          sheetName,

        status:
          "CLEARED",

        rowsCleared:
          rowsToClear

      });

    }
  );


  SpreadsheetApp.flush();


  Logger.log(
    JSON.stringify(
      results,
      null,
      2
    )
  );


  return results;
}