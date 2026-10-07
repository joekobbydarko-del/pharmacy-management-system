const DASHBOARD_SYNC_KEY_PROPERTY =
  "DASHBOARD_SYNC_KEY";


function createDashboardSyncKey() {

  const properties =
    PropertiesService
      .getScriptProperties();


  const key =
    Utilities.getUuid() +
    Utilities.getUuid() +
    Utilities.getUuid();


  properties.setProperty(
    DASHBOARD_SYNC_KEY_PROPERTY,
    key
  );


  Logger.log(
    "DASHBOARD_SYNC_KEY=" + key
  );


  return key;
}


function verifyDashboardSyncKey_(
  suppliedKey
) {

  const savedKey =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        DASHBOARD_SYNC_KEY_PROPERTY
      );


  if (!savedKey) {

    throw new Error(
      "Dashboard sync key has not been configured."
    );

  }


  return (
    String(
      suppliedKey || ""
    ).trim() ===
    String(
      savedKey
    ).trim()
  );
}


function dashboardJson_(
  data
) {

  return ContentService
    .createTextOutput(
      JSON.stringify(
        data
      )
    )
    .setMimeType(
      ContentService
        .MimeType
        .JSON
    );
}


function dashboardSheetObjects_(
  sheetName
) {

  const spreadsheet =
    db_();


  const sheet =
    spreadsheet.getSheetByName(
      sheetName
    );


  if (!sheet) {

    throw new Error(
      'Sheet "' +
      sheetName +
      '" was not found.'
    );

  }


  const values =
    sheet
      .getDataRange()
      .getValues();


  if (
    !values ||
    values.length < 1
  ) {

    return [];

  }


  const headers =
    values[0].map(
      function(header) {

        return String(
          header || ""
        ).trim();

      }
    );


  const output = [];


  for (
    let rowIndex = 1;
    rowIndex < values.length;
    rowIndex++
  ) {

    const row =
      values[rowIndex];


    const hasData =
      row.some(
        function(value) {

          return (
            value !== "" &&
            value !== null
          );

        }
      );


    if (!hasData) {

      continue;

    }


    const item = {};


    headers.forEach(
      function(
        header,
        columnIndex
      ) {

        if (!header) {

          return;

        }


        let value =
          row[columnIndex];


        if (
          value instanceof Date
        ) {

          value =
            Utilities.formatDate(
              value,
              Session
                .getScriptTimeZone(),
              "yyyy-MM-dd'T'HH:mm:ss"
            );

        }


        item[header] =
          value;

      }
    );


    output.push(
      item
    );

  }


  return output;
}


function handleDashboardInventory_(
  e
) {

  const suppliedKey =
    String(
      e &&
      e.parameter &&
      e.parameter.key
        ? e.parameter.key
        : ""
    ).trim();


  if (
    !verifyDashboardSyncKey_(
      suppliedKey
    )
  ) {

    return dashboardJson_({
      ok: false,
      error:
        "Unauthorized dashboard sync request."
    });

  }


  const drugs =
    dashboardSheetObjects_(
      "Drugs"
    );


  const inventory =
    dashboardSheetObjects_(
      "Inventory"
    );


  return dashboardJson_({

    ok: true,

    source:
      "Dr Evans Pharmacy System",

    generated_at:
      new Date().toISOString(),

    counts: {
      drugs:
        drugs.length,

      inventory:
        inventory.length
    },

    drugs:
      drugs,

    inventory:
      inventory
  });
}