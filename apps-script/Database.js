/**
 * DR. EVANS PHARMACY
 * DATABASE FOUNDATION
 */


/**
 * INSTALL SYSTEM
 * Run this once after setup.
 */
function installSystem() {

  const spreadsheet =
    SpreadsheetApp.getActiveSpreadsheet();

  PropertiesService
    .getScriptProperties()
    .setProperty(
      CONFIG.PROPERTIES.SPREADSHEET_ID,
      spreadsheet.getId()
    );

  validateWorkbook_();
  validatePaymentSettings_();
  setupExistingPaymentCheckboxes_();

  logAudit_({
    userType: "System",
    userId: "SYSTEM",
    action: "SYSTEM INSTALLED",
    recordType: "System",
    recordId: "SYSTEM",
    details:
      "Dr. Evans Pharmacy system installed successfully."
  });

  SpreadsheetApp
    .getActiveSpreadsheet()
    .toast(
      "System installed successfully.",
      "Dr. Evans Pharmacy",
      5
    );

  Logger.log(
    "Dr. Evans Pharmacy system installed successfully."
  );

  return true;
}


/**
 * GET MAIN DATABASE
 */
function db_() {

  const properties =
    PropertiesService.getScriptProperties();

  const spreadsheetId =
    properties.getProperty(
      CONFIG.PROPERTIES.SPREADSHEET_ID
    );

  if (spreadsheetId) {
    return SpreadsheetApp.openById(
      spreadsheetId
    );
  }

  return SpreadsheetApp.getActiveSpreadsheet();
}


/**
 * GET SHEET
 */
function sheet_(sheetName) {

  const sheet =
    db_().getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(
      'Sheet "' +
      sheetName +
      '" was not found.'
    );
  }

  return sheet;
}


/**
 * GET HEADER MAP
 *
 * Example:
 * Payment_ID = column 1
 * Payment_Status = column 14
 */
function headerMap_(sheetName) {

  const sheet =
    sheet_(sheetName);

  const lastColumn =
    sheet.getLastColumn();

  if (lastColumn < 1) {
    throw new Error(
      'Sheet "' +
      sheetName +
      '" has no headers.'
    );
  }

  const headers =
    sheet
      .getRange(
        1,
        1,
        1,
        lastColumn
      )
      .getValues()[0];

  const map = {};

  headers.forEach(
    (header, index) => {

      const name =
        String(
          header || ""
        ).trim();

      if (name) {
        map[name] =
          index + 1;
      }
    }
  );

  return map;
}


/**
 * VALIDATE WORKBOOK
 */
function validateWorkbook_() {

  const spreadsheet =
    db_();

  Object.keys(
    CONFIG.SHEETS
  ).forEach(
    sheetName => {

      const expectedHeaders =
        CONFIG.SHEETS[sheetName];

      const sheet =
        spreadsheet.getSheetByName(
          sheetName
        );

      if (!sheet) {
        throw new Error(
          'Missing sheet: "' +
          sheetName +
          '".'
        );
      }

      /**
       * Dashboard has no fixed headers.
       */
      if (
        expectedHeaders === null
      ) {
        return;
      }

      const actualHeaders =
        sheet
          .getRange(
            1,
            1,
            1,
            expectedHeaders.length
          )
          .getValues()[0]
          .map(
            value =>
              String(
                value || ""
              ).trim()
          );

      expectedHeaders.forEach(
        (expected, index) => {

          const actual =
            actualHeaders[index];

          if (
            actual !== expected
          ) {

            throw new Error(
              'Header problem in "' +
              sheetName +
              '" column ' +
              (index + 1) +
              '. Expected "' +
              expected +
              '" but found "' +
              actual +
              '".'
            );
          }
        }
      );
    }
  );

  return true;
}


/**
 * GET ALL REAL DATA ROWS
 *
 * IMPORTANT:
 * A row only counts as a record
 * when the first column contains an ID.
 *
 * This prevents blank checkbox rows
 * from being counted as payments.
 */
function tableRows_(sheetName) {

  const sheet =
    sheet_(sheetName);

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

  const headers =
    sheet
      .getRange(
        1,
        1,
        1,
        lastColumn
      )
      .getValues()[0]
      .map(
        value =>
          String(
            value || ""
          ).trim()
      );

  const values =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        lastColumn
      )
      .getValues();

  const records = [];

  values.forEach(
    (row, index) => {

      /**
       * First column must contain ID.
       */
      const idValue =
        String(
          row[0] || ""
        ).trim();

      if (!idValue) {
        return;
      }

      const record = {
        _row: index + 2
      };

      headers.forEach(
        (header, columnIndex) => {

          if (!header) {
            return;
          }

          record[header] =
            row[columnIndex];
        }
      );

      records.push(record);
    }
  );

  return records;
}


/**
 * FIND ONE RECORD
 */
function findRecord_(
  sheetName,
  field,
  value
) {

  const target =
    String(
      value || ""
    ).trim();

  const rows =
    tableRows_(
      sheetName
    );

  return (
    rows.find(
      row =>
        String(
          row[field] || ""
        ).trim() === target
    ) || null
  );
}


/**
 * APPEND RECORD
 */
function appendRecord_(
  sheetName,
  data
) {

  const sheet =
    sheet_(sheetName);

  const headers =
    CONFIG.SHEETS[
      sheetName
    ];

  if (!headers) {
    throw new Error(
      'Cannot append structured data to "' +
      sheetName +
      '".'
    );
  }

  const row =
    headers.map(
      header => {

        if (
          Object.prototype
            .hasOwnProperty
            .call(
              data,
              header
            )
        ) {
          return data[header];
        }

        return "";
      }
    );

  sheet.appendRow(row);

  const rowNumber =
    sheet.getLastRow();

  /**
   * Only add checkbox to a real
   * newly-created payment row.
   */
  if (
    sheetName ===
    "Payments"
  ) {

    const map =
      headerMap_(
        "Payments"
      );

    const checkboxCell =
      sheet.getRange(
        rowNumber,
        map.Payment_Confirmed
      );

    checkboxCell
      .insertCheckboxes();

    if (
      data.Payment_Confirmed ===
      true
    ) {
      checkboxCell
        .setValue(true);
    }
  }

  return rowNumber;
}


/**
 * NEXT ID GENERATOR
 *
 * Examples:
 * O228
 * PAY001
 * INV001
 * LOG00001
 */
function nextId_(
  sheetName,
  field,
  prefix,
  digits
) {

  const rows =
    tableRows_(
      sheetName
    );

  let highest = 0;

  rows.forEach(
    row => {

      const value =
        String(
          row[field] || ""
        ).trim();

      if (
        !value.startsWith(
          prefix
        )
      ) {
        return;
      }

      const numericPart =
        value.substring(
          prefix.length
        );

      const number =
        parseInt(
          numericPart,
          10
        );

      if (
        !isNaN(number) &&
        number > highest
      ) {
        highest =
          number;
      }
    }
  );

  const nextNumber =
    highest + 1;

  return (
    prefix +
    String(
      nextNumber
    ).padStart(
      digits,
      "0"
    )
  );
}


/**
 * LOAD PAYMENT SETTINGS
 */
function loadPaymentSettings_() {

  const sheet =
    sheet_(
      "Payment_Settings"
    );

  const lastRow =
    sheet.getLastRow();

  const settings = {};

  if (
    lastRow < 2
  ) {
    return settings;
  }

  const values =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        2
      )
      .getValues();

  values.forEach(
    row => {

      const setting =
        String(
          row[0] || ""
        ).trim();

      if (!setting) {
        return;
      }

      settings[setting] =
        row[1];
    }
  );

  return settings;
}


/**
 * VALIDATE PAYMENT SETTINGS
 */
function validatePaymentSettings_() {

  const settings =
    loadPaymentSettings_();

  CONFIG
    .REQUIRED_PAYMENT_SETTINGS
    .forEach(
      setting => {

        const value =
          settings[setting];

        if (
          value === "" ||
          value === null ||
          value === undefined
        ) {

          throw new Error(
            'Payment setting "' +
            setting +
            '" is missing.'
          );
        }
      }
    );

  const receiptRule =
    String(
      settings
        .Receipt_Requires_Confirmation
    )
      .trim()
      .toUpperCase();

  if (
    receiptRule !==
    "TRUE"
  ) {

    throw new Error(
      "Receipt_Requires_Confirmation must be TRUE."
    );
  }

  return true;
}


/**
 * ADD CHECKBOXES TO REAL
 * EXISTING PAYMENT RECORDS ONLY.
 *
 * Blank rows are ignored.
 */
function setupExistingPaymentCheckboxes_() {

  const payments =
    tableRows_(
      "Payments"
    );

  if (
    payments.length === 0
  ) {
    return true;
  }

  const sheet =
    sheet_(
      "Payments"
    );

  const map =
    headerMap_(
      "Payments"
    );

  payments.forEach(
    payment => {

      sheet
        .getRange(
          payment._row,
          map.Payment_Confirmed
        )
        .insertCheckboxes();
    }
  );

  return true;
}


/**
 * AUDIT LOG
 */
function logAudit_(data) {

  const logId =
    nextId_(
      "Audit_Log",
      "Log_ID",
      "LOG",
      5
    );

  appendRecord_(
    "Audit_Log",
    {

      Log_ID:
        logId,

      Timestamp:
        new Date(),

      User_Type:
        data.userType ||
        "System",

      User_ID:
        data.userId ||
        "SYSTEM",

      Action:
        data.action ||
        "",

      Record_Type:
        data.recordType ||
        "",

      Record_ID:
        data.recordId ||
        "",

      Details:
        data.details ||
        ""

    }
  );

  return logId;
}


/**
 * COLUMN NUMBER TO LETTER
 *
 * 1 = A
 * 14 = N
 */
function columnLetter_(
  columnNumber
) {

  let number =
    columnNumber;

  let result = "";

  while (
    number > 0
  ) {

    const remainder =
      (
        number - 1
      ) % 26;

    result =
      String.fromCharCode(
        65 + remainder
      ) +
      result;

    number =
      Math.floor(
        (
          number - 1
        ) / 26
      );
  }

  return result;
}


/**
 * SYSTEM CHECK
 */
function checkSystem() {

  validateWorkbook_();
  validatePaymentSettings_();

  const result = {

    system:
      CONFIG.APP_NAME,

    spreadsheet:
      db_().getName(),

    patients:
      tableRows_(
        "Patients"
      ).length,

    drugs:
      tableRows_(
        "Drugs"
      ).length,

    orders:
      tableRows_(
        "Orders"
      ).length,

    orderItems:
      tableRows_(
        "Order_Items"
      ).length,

    refills:
      tableRows_(
        "Refills"
      ).length,

    payments:
      tableRows_(
        "Payments"
      ).length,

    invoices:
      tableRows_(
        "Invoices_Receipts"
      ).length

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