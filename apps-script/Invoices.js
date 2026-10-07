/**
 * ============================================================
 * DR. EVANS PHARMACY
 * PROFESSIONAL INVOICE + RECEIPT DOCUMENT ENGINE
 * ============================================================
 *
 * Generates:
 * - Professional Invoice PDF
 * - Professional Receipt PDF
 *
 * Design goals:
 * - Same visual identity as web app
 * - Compact executive-style layout
 * - Professional branded header
 * - Clear document hierarchy
 * - One-page layout for normal orders
 * - Matching invoice and receipt structure
 */


/********************************************************
 * DOCUMENT THEME
 ********************************************************/

const DOCUMENT_THEME = {

  NAVY:
    "#073B4C",

  DARK_TEAL:
    "#064C59",

  TEAL:
    "#0F766E",

  ACCENT:
    "#14B8A6",

  LIGHT_TEAL:
    "#ECF8F7",

  PANEL:
    "#F8FAFC",

  SOFT:
    "#F1F5F9",

  BORDER:
    "#D9E3E7",

  TEXT:
    "#0F172A",

  SECONDARY:
    "#475569",

  MUTED:
    "#64748B",

  SUCCESS:
    "#166534",

  SUCCESS_BG:
    "#ECFDF3",

  SUCCESS_BORDER:
    "#BBF7D0",

  WARNING:
    "#92400E",

  WARNING_BG:
    "#FFFBEB",

  WHITE:
    "#FFFFFF"
};


/********************************************************
 * DOCUMENT CONFIG
 ********************************************************/

const DOCUMENT_LAYOUT = {

  TOP_MARGIN:
    24,

  BOTTOM_MARGIN:
    24,

  LEFT_MARGIN:
    30,

  RIGHT_MARGIN:
    30,

  BODY_FONT_SIZE:
    9,

  LABEL_FONT_SIZE:
    8,

  SECTION_FONT_SIZE:
    9,

  TITLE_FONT_SIZE:
    18,

  BRAND_FONT_SIZE:
    17
};


/********************************************************
 * CREATE INVOICE FOR ORDER
 ********************************************************/

function createInvoiceForOrder_(
  orderId
) {

  const cleanOrderId =
    String(
      orderId || ""
    ).trim();


  if (!cleanOrderId) {

    throw new Error(
      "Order ID is missing."
    );
  }


  const existingInvoice =
    getInvoiceByOrder_(
      cleanOrderId
    );


  if (existingInvoice) {

    return {

      invoiceId:
        existingInvoice.Invoice_ID,

      orderId:
        existingInvoice.Order_ID,

      amount:
        Number(
          existingInvoice.Invoice_Amount || 0
        ),

      invoiceLink:
        existingInvoice.Invoice_Link,

      invoiceStatus:
        existingInvoice.Invoice_Status,

      created:
        false

    };
  }


  const context =
    getOrderContext_(
      cleanOrderId
    );


  const total =
    Number(
      context.total || 0
    );


  if (
    !total ||
    total <= 0
  ) {

    throw new Error(
      "A valid invoice amount could not be calculated."
    );
  }


  const invoiceId =
    nextId_(
      "Invoices_Receipts",
      "Invoice_ID",
      "INV",
      3
    );


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
          invoiceToken

      }
    );


  const paymentStatus =
    String(
      context.order.Payment_Status || ""
    ).trim();


  const invoiceStatus =
    paymentStatus ===
      CONFIG.STATUS.PAID

      ? CONFIG.STATUS.PAID

      : CONFIG.STATUS.PENDING;


  appendRecord_(
    "Invoices_Receipts",
    {

      Invoice_ID:
        invoiceId,

      Order_ID:
        cleanOrderId,

      Invoice_Date:
        new Date(),

      Invoice_Amount:
        total,

      Invoice_Status:
        invoiceStatus,

      Receipt_ID:
        "",

      Receipt_Date:
        "",

      Receipt_Status:
        "",

      Invoice_Link:
        invoiceLink,

      Receipt_PDF_Link:
        ""

    }
  );


  logAudit_({

    userType:
      "System",

    userId:
      "SYSTEM",

    action:
      "INVOICE CREATED",

    recordType:
      "Invoice",

    recordId:
      invoiceId,

    details:
      "Invoice created for order " +
      cleanOrderId +
      "."

  });


  return {

    invoiceId:
      invoiceId,

    orderId:
      cleanOrderId,

    amount:
      total,

    invoiceLink:
      invoiceLink,

    invoiceStatus:
      invoiceStatus,

    created:
      true

  };
}


/********************************************************
 * GET INVOICE
 ********************************************************/

function getInvoice_(
  invoiceId
) {

  const invoice =
    findRecord_(
      "Invoices_Receipts",
      "Invoice_ID",
      invoiceId
    );


  if (!invoice) {

    throw new Error(
      "Invoice " +
      invoiceId +
      " was not found."
    );
  }


  return invoice;
}


/********************************************************
 * GET INVOICE BY ORDER
 ********************************************************/

function getInvoiceByOrder_(
  orderId
) {

  const cleanOrderId =
    String(
      orderId || ""
    ).trim();


  const invoice =
    tableRows_(
      "Invoices_Receipts"
    )
      .find(
        row =>

          String(
            row.Order_ID || ""
          ).trim() ===
          cleanOrderId
      );


  return invoice || null;
}


/********************************************************
 * RECEIPT FOLDER
 ********************************************************/

function receiptFolder_() {

  const folderName =
    "Dr Evans Pharmacy Receipts";


  const folders =
    DriveApp.getFoldersByName(
      folderName
    );


  if (
    folders.hasNext()
  ) {

    return folders.next();
  }


  return DriveApp.createFolder(
    folderName
  );
}


/********************************************************
 * INVOICE FOLDER
 ********************************************************/

function invoicePdfFolder_() {

  const folderName =
    "Dr Evans Pharmacy Invoices";


  const folders =
    DriveApp.getFoldersByName(
      folderName
    );


  if (
    folders.hasNext()
  ) {

    return folders.next();
  }


  return DriveApp.createFolder(
    folderName
  );
}


/********************************************************
 * APPLY DOCUMENT PAGE SETTINGS
 ********************************************************/

function applyDocumentLayout_(
  body
) {

  body
    .setMarginTop(
      DOCUMENT_LAYOUT.TOP_MARGIN
    )
    .setMarginBottom(
      DOCUMENT_LAYOUT.BOTTOM_MARGIN
    )
    .setMarginLeft(
      DOCUMENT_LAYOUT.LEFT_MARGIN
    )
    .setMarginRight(
      DOCUMENT_LAYOUT.RIGHT_MARGIN
    );
}


/********************************************************
 * CELL PADDING
 ********************************************************/

function setCellPadding_(
  cell,
  top,
  right,
  bottom,
  left
) {

  cell
    .setPaddingTop(
      top
    )
    .setPaddingRight(
      right
    )
    .setPaddingBottom(
      bottom
    )
    .setPaddingLeft(
      left
    );


  return cell;
}


/********************************************************
 * STYLE PARAGRAPH
 ********************************************************/

function styleParagraph_(
  paragraph,
  options
) {

  const text =
    paragraph.editAsText();


  if (
    options.bold !== undefined
  ) {

    text.setBold(
      options.bold
    );
  }


  if (
    options.fontSize
  ) {

    text.setFontSize(
      options.fontSize
    );
  }


  if (
    options.color
  ) {

    text.setForegroundColor(
      options.color
    );
  }


  if (
    options.alignment
  ) {

    paragraph.setAlignment(
      options.alignment
    );
  }


  if (
    options.spacingBefore !== undefined
  ) {

    paragraph.setSpacingBefore(
      options.spacingBefore
    );
  }


  if (
    options.spacingAfter !== undefined
  ) {

    paragraph.setSpacingAfter(
      options.spacingAfter
    );
  }


  if (
    options.lineSpacing
  ) {

    paragraph.setLineSpacing(
      options.lineSpacing
    );
  }


  return paragraph;
}


/********************************************************
 * SMALL SPACER
 ********************************************************/

function addSmallSpacer_(
  body,
  size
) {

  const paragraph =
    body.appendParagraph(
      ""
    );


  paragraph
    .setSpacingBefore(
      0
    )
    .setSpacingAfter(
      size || 2
    );


  return paragraph;
}


/********************************************************
 * PROFESSIONAL DOCUMENT HEADER
 ********************************************************/

function addProfessionalHeader_(
  body,
  documentType,
  documentId,
  status,
  isPaid
) {

  const header =
    body.appendTable([
      [
        "",
        ""
      ]
    ]);


  header
    .setBorderWidth(
      0
    );


  const row =
    header.getRow(
      0
    );


  const left =
    row.getCell(
      0
    );


  const right =
    row.getCell(
      1
    );


  left.setWidth(
    310
  );


  right.setWidth(
    210
  );


  left.setBackgroundColor(
    DOCUMENT_THEME.NAVY
  );


  right.setBackgroundColor(
    DOCUMENT_THEME.NAVY
  );


  setCellPadding_(
    left,
    16,
    12,
    14,
    16
  );


  setCellPadding_(
    right,
    16,
    16,
    14,
    12
  );


  /**
   * LEFT SIDE
   */

  const brand =
    left.appendParagraph(
      "✚  DR. EVANS PHARMACY"
    );


  styleParagraph_(
    brand,
    {

      bold:
        true,

      fontSize:
        DOCUMENT_LAYOUT.BRAND_FONT_SIZE,

      color:
        DOCUMENT_THEME.WHITE,

      spacingAfter:
        2

    }
  );


  const brandSubtitle =
    left.appendParagraph(
      "PHARMACEUTICAL PATIENT CARE"
    );


  styleParagraph_(
    brandSubtitle,
    {

      bold:
        true,

      fontSize:
        7,

      color:
        "#BFE5E2",

      spacingAfter:
        0

    }
  );


  /**
   * RIGHT SIDE
   */

  const typeParagraph =
    right.appendParagraph(
      documentType
    );


  styleParagraph_(
    typeParagraph,
    {

      bold:
        true,

      fontSize:
        13,

      color:
        DOCUMENT_THEME.WHITE,

      alignment:
        DocumentApp
          .HorizontalAlignment
          .RIGHT,

      spacingAfter:
        4

    }
  );


  const idParagraph =
    right.appendParagraph(
      documentId
    );


  styleParagraph_(
    idParagraph,
    {

      bold:
        true,

      fontSize:
        10,

      color:
        "#CDE8E6",

      alignment:
        DocumentApp
          .HorizontalAlignment
          .RIGHT,

      spacingAfter:
        0

    }
  );


  /**
   * ACCENT LINE
   */

  const accent =
    body.appendTable([
      [
        ""
      ]
    ]);


  accent
    .setBorderWidth(
      0
    );


  const accentCell =
    accent
      .getRow(0)
      .getCell(0);


  accentCell
    .setBackgroundColor(
      DOCUMENT_THEME.ACCENT
    );


  setCellPadding_(
    accentCell,
    2,
    0,
    2,
    0
  );


  addSmallSpacer_(
    body,
    4
  );


  /**
   * STATUS STRIP
   */

  const statusTable =
    body.appendTable([
      [
        isPaid
          ? "✓ " + status
          : status
      ]
    ]);


  statusTable
    .setBorderWidth(
      1
    );


  statusTable
    .setBorderColor(
      isPaid
        ? DOCUMENT_THEME.SUCCESS_BORDER
        : "#FDE68A"
    );


  const statusCell =
    statusTable
      .getRow(0)
      .getCell(0);


  statusCell.setBackgroundColor(
    isPaid
      ? DOCUMENT_THEME.SUCCESS_BG
      : DOCUMENT_THEME.WARNING_BG
  );


  setCellPadding_(
    statusCell,
    6,
    10,
    6,
    10
  );


  const statusText =
    statusCell.editAsText();


  statusText
    .setBold(
      true
    )
    .setFontSize(
      9
    )
    .setForegroundColor(
      isPaid
        ? DOCUMENT_THEME.SUCCESS
        : DOCUMENT_THEME.WARNING
    );


  addSmallSpacer_(
    body,
    5
  );
}


/********************************************************
 * SECTION LABEL
 ********************************************************/

function addSectionLabel_(
  body,
  title
) {

  const paragraph =
    body.appendParagraph(
      title
    );


  styleParagraph_(
    paragraph,
    {

      bold:
        true,

      fontSize:
        DOCUMENT_LAYOUT.SECTION_FONT_SIZE,

      color:
        DOCUMENT_THEME.DARK_TEAL,

      spacingBefore:
        2,

      spacingAfter:
        4

    }
  );


  return paragraph;
}


/********************************************************
 * INFORMATION PANEL
 ********************************************************/

function addInformationPanel_(
  body,
  rows
) {

  const tableRows =
    rows.map(
      item => [
        String(
          item.label || ""
        ),
        String(
          item.value === undefined ||
          item.value === null
            ? ""
            : item.value
        )
      ]
    );


  const table =
    body.appendTable(
      tableRows
    );


  table
    .setBorderWidth(
      1
    );


  table
    .setBorderColor(
      DOCUMENT_THEME.BORDER
    );


  for (
    let rowIndex = 0;
    rowIndex <
      table.getNumRows();
    rowIndex++
  ) {

    const row =
      table.getRow(
        rowIndex
      );


    const labelCell =
      row.getCell(
        0
      );


    const valueCell =
      row.getCell(
        1
      );


    labelCell.setWidth(
      180
    );


    labelCell
      .setBackgroundColor(
        DOCUMENT_THEME.PANEL
      );


    valueCell
      .setBackgroundColor(
        DOCUMENT_THEME.WHITE
      );


    setCellPadding_(
      labelCell,
      5,
      7,
      5,
      7
    );


    setCellPadding_(
      valueCell,
      5,
      7,
      5,
      7
    );


    labelCell
      .editAsText()
      .setBold(
        true
      )
      .setFontSize(
        DOCUMENT_LAYOUT.LABEL_FONT_SIZE
      )
      .setForegroundColor(
        DOCUMENT_THEME.MUTED
      );


    valueCell
      .editAsText()
      .setBold(
        true
      )
      .setFontSize(
        DOCUMENT_LAYOUT.BODY_FONT_SIZE
      )
      .setForegroundColor(
        DOCUMENT_THEME.TEXT
      );

  }


  return table;
}


/********************************************************
 * TWO COLUMN INFORMATION SECTION
 ********************************************************/

function addTwoColumnDetails_(
  body,
  leftTitle,
  leftRows,
  rightTitle,
  rightRows
) {

  const outer =
    body.appendTable([
      [
        "",
        ""
      ]
    ]);


  outer
    .setBorderWidth(
      0
    );


  const leftCell =
    outer
      .getRow(0)
      .getCell(0);


  const rightCell =
    outer
      .getRow(0)
      .getCell(1);


  leftCell.setWidth(
    260
  );


  rightCell.setWidth(
    260
  );


  leftCell
    .setBackgroundColor(
      DOCUMENT_THEME.WHITE
    );


  rightCell
    .setBackgroundColor(
      DOCUMENT_THEME.WHITE
    );


  setCellPadding_(
    leftCell,
    0,
    8,
    0,
    0
  );


  setCellPadding_(
    rightCell,
    0,
    0,
    0,
    8
  );


  /**
   * LEFT TITLE
   */

  const leftHeading =
    leftCell.appendParagraph(
      leftTitle
    );


  styleParagraph_(
    leftHeading,
    {

      bold:
        true,

      fontSize:
        8,

      color:
        DOCUMENT_THEME.DARK_TEAL,

      spacingAfter:
        4

    }
  );


  /**
   * RIGHT TITLE
   */

  const rightHeading =
    rightCell.appendParagraph(
      rightTitle
    );


  styleParagraph_(
    rightHeading,
    {

      bold:
        true,

      fontSize:
        8,

      color:
        DOCUMENT_THEME.DARK_TEAL,

      spacingAfter:
        4

    }
  );


  /**
   * LEFT PANEL
   */

  const leftTableRows =
    leftRows.map(
      item => [
        String(
          item.label
        ),
        String(
          item.value || ""
        )
      ]
    );


  const leftTable =
    leftCell.appendTable(
      leftTableRows
    );


  styleMiniPanel_(
    leftTable
  );


  /**
   * RIGHT PANEL
   */

  const rightTableRows =
    rightRows.map(
      item => [
        String(
          item.label
        ),
        String(
          item.value || ""
        )
      ]
    );


  const rightTable =
    rightCell.appendTable(
      rightTableRows
    );


  styleMiniPanel_(
    rightTable
  );


  addSmallSpacer_(
    body,
    5
  );


  return outer;
}


/********************************************************
 * STYLE MINI PANEL
 ********************************************************/

function styleMiniPanel_(
  table
) {

  table
    .setBorderWidth(
      1
    )
    .setBorderColor(
      DOCUMENT_THEME.BORDER
    );


  for (
    let rowIndex = 0;
    rowIndex <
      table.getNumRows();
    rowIndex++
  ) {

    const row =
      table.getRow(
        rowIndex
      );


    const labelCell =
      row.getCell(
        0
      );


    const valueCell =
      row.getCell(
        1
      );


    labelCell
      .setBackgroundColor(
        DOCUMENT_THEME.PANEL
      );


    valueCell
      .setBackgroundColor(
        DOCUMENT_THEME.WHITE
      );


    setCellPadding_(
      labelCell,
      4,
      5,
      4,
      5
    );


    setCellPadding_(
      valueCell,
      4,
      5,
      4,
      5
    );


    labelCell
      .editAsText()
      .setBold(
        true
      )
      .setFontSize(
        7
      )
      .setForegroundColor(
        DOCUMENT_THEME.MUTED
      );


    valueCell
      .editAsText()
      .setBold(
        true
      )
      .setFontSize(
        8
      )
      .setForegroundColor(
        DOCUMENT_THEME.TEXT
      );

  }


  return table;
}


/********************************************************
 * PROFESSIONAL ITEMS TABLE
 ********************************************************/

function addItemsTable_(
  body,
  items
) {

  const rows = [
    [
      "MEDICATION",
      "QTY",
      "UNIT PRICE",
      "AMOUNT"
    ]
  ];


  items.forEach(
    item => {

      const drug =
        findRecord_(
          "Drugs",
          "Drug_ID",
          item.Drug_ID
        );


      const drugName =
        drug
          ? String(
              drug.Drug_Name || ""
            )
          : String(
              item.Drug_ID || ""
            );


      rows.push([
        drugName,

        String(
          item.Quantity || 0
        ),

        "GHS " +
        Number(
          item.Unit_Price || 0
        ).toFixed(2),

        "GHS " +
        Number(
          item.Total_Amount || 0
        ).toFixed(2)
      ]);

    }
  );


  const table =
    body.appendTable(
      rows
    );


  table
    .setBorderWidth(
      1
    )
    .setBorderColor(
      DOCUMENT_THEME.BORDER
    );


  const header =
    table.getRow(
      0
    );


  for (
    let column = 0;
    column <
      header.getNumCells();
    column++
  ) {

    const cell =
      header.getCell(
        column
      );


    cell
      .setBackgroundColor(
        DOCUMENT_THEME.DARK_TEAL
      );


    setCellPadding_(
      cell,
      6,
      5,
      6,
      5
    );


    cell
      .editAsText()
      .setBold(
        true
      )
      .setFontSize(
        8
      )
      .setForegroundColor(
        DOCUMENT_THEME.WHITE
      );
  }


  for (
    let rowIndex = 1;
    rowIndex <
      table.getNumRows();
    rowIndex++
  ) {

    const row =
      table.getRow(
        rowIndex
      );


    for (
      let column = 0;
      column <
        row.getNumCells();
      column++
    ) {

      const cell =
        row.getCell(
          column
        );


      cell.setBackgroundColor(
        rowIndex % 2 === 0
          ? DOCUMENT_THEME.PANEL
          : DOCUMENT_THEME.WHITE
      );


      setCellPadding_(
        cell,
        5,
        5,
        5,
        5
      );


      cell
        .editAsText()
        .setFontSize(
          8
        )
        .setForegroundColor(
          DOCUMENT_THEME.TEXT
        );
    }
  }


  return table;
}


/********************************************************
 * TOTAL SUMMARY
 ********************************************************/

function addTotalSummary_(
  body,
  total,
  paid
) {

  const table =
    body.appendTable([
      [
        "",
        ""
      ]
    ]);


  table
    .setBorderWidth(
      0
    );


  const left =
    table
      .getRow(0)
      .getCell(0);


  const right =
    table
      .getRow(0)
      .getCell(1);


  left.setWidth(
    325
  );


  right.setWidth(
    195
  );


  left.setBackgroundColor(
    DOCUMENT_THEME.WHITE
  );


  right.setBackgroundColor(
    DOCUMENT_THEME.NAVY
  );


  setCellPadding_(
    right,
    10,
    12,
    10,
    12
  );


  const smallLabel =
    right.appendParagraph(
      paid
        ? "TOTAL PAID"
        : "TOTAL DUE"
    );


  styleParagraph_(
    smallLabel,
    {

      bold:
        true,

      fontSize:
        7,

      color:
        "#BFE5E2",

      alignment:
        DocumentApp
          .HorizontalAlignment
          .RIGHT,

      spacingAfter:
        2

    }
  );


  const amount =
    right.appendParagraph(
      "GHS " +
      Number(
        total || 0
      ).toFixed(2)
    );


  styleParagraph_(
    amount,
    {

      bold:
        true,

      fontSize:
        15,

      color:
        DOCUMENT_THEME.WHITE,

      alignment:
        DocumentApp
          .HorizontalAlignment
          .RIGHT,

      spacingAfter:
        0

    }
  );


  return table;
}


/********************************************************
 * VERIFIED NOTICE
 ********************************************************/

function addVerifiedNotice_(
  body,
  title,
  message
) {

  const table =
    body.appendTable([
      [
        ""
      ]
    ]);


  table
    .setBorderWidth(
      1
    )
    .setBorderColor(
      DOCUMENT_THEME.SUCCESS_BORDER
    );


  const cell =
    table
      .getRow(0)
      .getCell(0);


  cell.setBackgroundColor(
    DOCUMENT_THEME.SUCCESS_BG
  );


  setCellPadding_(
    cell,
    7,
    9,
    7,
    9
  );


  const titleParagraph =
    cell.appendParagraph(
      "✓ " +
      title
    );


  styleParagraph_(
    titleParagraph,
    {

      bold:
        true,

      fontSize:
        8,

      color:
        DOCUMENT_THEME.SUCCESS,

      spacingAfter:
        2

    }
  );


  const messageParagraph =
    cell.appendParagraph(
      message
    );


  styleParagraph_(
    messageParagraph,
    {

      fontSize:
        7,

      color:
        DOCUMENT_THEME.SUCCESS,

      spacingAfter:
        0

    }
  );


  return table;
}


/********************************************************
 * PROFESSIONAL FOOTER
 ********************************************************/

function addProfessionalFooter_(
  body,
  documentId
) {

  addSmallSpacer_(
    body,
    6
  );


  const line =
    body.appendTable([
      [
        ""
      ]
    ]);


  line
    .setBorderWidth(
      0
    );


  line
    .getRow(0)
    .getCell(0)
    .setBackgroundColor(
      DOCUMENT_THEME.BORDER
    );


  setCellPadding_(
    line
      .getRow(0)
      .getCell(0),
    1,
    0,
    1,
    0
  );


  addSmallSpacer_(
    body,
    3
  );


  const footer =
    body.appendTable([
      [
        "",
        ""
      ]
    ]);


  footer
    .setBorderWidth(
      0
    );


  const left =
    footer
      .getRow(0)
      .getCell(0);


  const right =
    footer
      .getRow(0)
      .getCell(1);


  left.setWidth(
    365
  );


  right.setWidth(
    155
  );


  const thankYou =
    left.appendParagraph(
      "Thank you for choosing Dr. Evans Pharmacy."
    );


  styleParagraph_(
    thankYou,
    {

      bold:
        true,

      fontSize:
        7,

      color:
        DOCUMENT_THEME.DARK_TEAL,

      spacingAfter:
        1

    }
  );


  const slogan =
    left.appendParagraph(
      "Always making life better."
    );


  styleParagraph_(
    slogan,
    {

      fontSize:
        7,

      color:
        DOCUMENT_THEME.MUTED,

      spacingAfter:
        0

    }
  );


  const docRef =
    right.appendParagraph(
      "Document Ref"
    );


  styleParagraph_(
    docRef,
    {

      bold:
        true,

      fontSize:
        6,

      color:
        DOCUMENT_THEME.MUTED,

      alignment:
        DocumentApp
          .HorizontalAlignment
          .RIGHT,

      spacingAfter:
        1

    }
  );


  const docValue =
    right.appendParagraph(
      documentId
    );


  styleParagraph_(
    docValue,
    {

      bold:
        true,

      fontSize:
        7,

      color:
        DOCUMENT_THEME.DARK_TEAL,

      alignment:
        DocumentApp
          .HorizontalAlignment
          .RIGHT,

      spacingAfter:
        0

    }
  );
}


/********************************************************
 * LATEST PAID PAYMENT
 ********************************************************/

function latestPaidPayment_() {

  const payments =
    tableRows_(
      "Payments"
    )
      .filter(
        payment =>

          String(
            payment.Payment_Status || ""
          ).trim() ===
          CONFIG.STATUS.PAID
      )
      .sort(
        (a, b) =>
          b._row - a._row
      );


  if (
    payments.length === 0
  ) {

    throw new Error(
      "No Paid payment was found."
    );
  }


  return payments[0];
}


/********************************************************
 * NEXT RECEIPT ID
 ********************************************************/

function nextReceiptId_() {

  const rows =
    tableRows_(
      "Invoices_Receipts"
    );


  let highest =
    0;


  rows.forEach(
    row => {

      const value =
        String(
          row.Receipt_ID || ""
        ).trim();


      if (
        !value.startsWith(
          "REC"
        )
      ) {

        return;
      }


      const number =
        parseInt(
          value.substring(
            3
          ),
          10
        );


      if (
        !isNaN(
          number
        ) &&
        number > highest
      ) {

        highest =
          number;
      }

    }
  );


  return (
    "REC" +
    String(
      highest + 1
    ).padStart(
      3,
      "0"
    )
  );
}


/********************************************************
 * DRIVE FILE ID
 ********************************************************/

function driveFileIdFromUrl_(
  url
) {

  const value =
    String(
      url || ""
    ).trim();


  if (!value) {

    return "";
  }


  const match =
    value.match(
      /[-\w]{25,}/
    );


  return match
    ? match[0]
    : "";
}


/********************************************************
 * DIRECT DRIVE DOWNLOAD
 ********************************************************/

function driveDirectDownloadUrl_(
  url
) {

  const fileId =
    driveFileIdFromUrl_(
      url
    );


  if (!fileId) {

    return String(
      url || ""
    );
  }


  return (
    "https://drive.google.com/uc" +
    "?export=download&id=" +
    encodeURIComponent(
      fileId
    )
  );
}


/********************************************************
 * GENERATE PROFESSIONAL INVOICE PDF
 ********************************************************/

function generateInvoicePdfForOrder_(
  orderId
) {

  const cleanOrderId =
    String(
      orderId || ""
    ).trim();


  if (!cleanOrderId) {

    throw new Error(
      "Order ID is missing."
    );
  }


  const context =
    getOrderContext_(
      cleanOrderId
    );


  const invoice =
    getInvoiceByOrder_(
      cleanOrderId
    );


  if (!invoice) {

    throw new Error(
      "Invoice was not found for order " +
      cleanOrderId +
      "."
    );
  }


  const patient =
    context.patient;


  if (!patient) {

    throw new Error(
      "Patient record could not be found."
    );
  }


  const invoiceId =
    String(
      invoice.Invoice_ID || ""
    ).trim();


  const fileName =
    invoiceId +
    "_Dr_Evans_Pharmacy_Invoice.pdf";


  const folder =
    invoicePdfFolder_();


  /**
   * REUSE EXISTING PDF
   */

  const existingFiles =
    folder.getFilesByName(
      fileName
    );


  if (
    existingFiles.hasNext()
  ) {

    const existing =
      existingFiles.next();


    return {

      invoiceId:
        invoiceId,

      orderId:
        cleanOrderId,

      pdfLink:
        existing.getUrl(),

      downloadUrl:
        driveDirectDownloadUrl_(
          existing.getUrl()
        ),

      created:
        false

    };
  }


  const total =
    Number(
      invoice.Invoice_Amount || 0
    );


  const paid =
    String(
      invoice.Invoice_Status || ""
    ).trim() ===
    CONFIG.STATUS.PAID;


  const invoiceDate =
    invoice.Invoice_Date

      ? Utilities.formatDate(
          new Date(
            invoice.Invoice_Date
          ),
          CONFIG.TIMEZONE,
          "dd MMM yyyy"
        )

      : "-";


  const document =
    DocumentApp.create(
      "Dr Evans Pharmacy Invoice " +
      invoiceId
    );


  const body =
    document.getBody();


  body.clear();


  applyDocumentLayout_(
    body
  );


  /**
   * HEADER
   */

  addProfessionalHeader_(
    body,
    "OFFICIAL INVOICE",
    invoiceId,
    paid
      ? "PAID"
      : "PAYMENT PENDING",
    paid
  );


  /**
   * DETAILS
   */

  addTwoColumnDetails_(
    body,

    "INVOICE INFORMATION",

    [
      {
        label:
          "Invoice ID",
        value:
          invoiceId
      },

      {
        label:
          "Order ID",
        value:
          cleanOrderId
      },

      {
        label:
          "Invoice Date",
        value:
          invoiceDate
      },

      {
        label:
          "Status",
        value:
          String(
            invoice.Invoice_Status || ""
          )
      }
    ],

    "PATIENT INFORMATION",

    [
      {
        label:
          "Patient",
        value:
          String(
            patient.Full_Name || ""
          )
      },

      {
        label:
          "Patient ID",
        value:
          String(
            patient.Patient_ID || ""
          )
      },

      {
        label:
          "Customer Type",
        value:
          String(
            context.order.Customer_Type || ""
          )
      },

      {
        label:
          "Reference",
        value:
          invoiceId
      }
    ]
  );


  /**
   * ITEMS
   */

  addSectionLabel_(
    body,
    "MEDICATION / ORDER DETAILS"
  );


  addItemsTable_(
    body,
    context.items
  );


  addSmallSpacer_(
    body,
    5
  );


  /**
   * TOTAL
   */

  addTotalSummary_(
    body,
    total,
    paid
  );


  /**
   * PAID NOTICE
   */

  if (paid) {

    addSmallSpacer_(
      body,
      5
    );


    addVerifiedNotice_(
      body,
      "Payment verified successfully",
      "This invoice has been fully paid and the associated pharmacy order has been completed."
    );
  }


  /**
   * FOOTER
   */

  addProfessionalFooter_(
    body,
    invoiceId
  );


  document.saveAndClose();


  /**
   * CONVERT TO PDF
   */

  const docFile =
    DriveApp.getFileById(
      document.getId()
    );


  const pdfBlob =
    docFile
      .getAs(
        MimeType.PDF
      )
      .setName(
        fileName
      );


  const pdfFile =
    folder.createFile(
      pdfBlob
    );


  docFile.setTrashed(
    true
  );


  const pdfLink =
    pdfFile.getUrl();


  logAudit_({

    userType:
      "System",

    userId:
      "SYSTEM",

    action:
      "INVOICE PDF GENERATED",

    recordType:
      "Invoice",

    recordId:
      invoiceId,

    details:
      "Professional invoice PDF generated for order " +
      cleanOrderId +
      "."

  });


  return {

    invoiceId:
      invoiceId,

    orderId:
      cleanOrderId,

    pdfLink:
      pdfLink,

    downloadUrl:
      driveDirectDownloadUrl_(
        pdfLink
      ),

    created:
      true

  };
}


/********************************************************
 * GENERATE PROFESSIONAL RECEIPT
 ********************************************************/

function generateReceiptForOrder_(
  orderId,
  forceRegenerate
) {

  forceRegenerate =
    forceRegenerate === true;


  const cleanOrderId =
    String(
      orderId || ""
    ).trim();


  if (!cleanOrderId) {

    throw new Error(
      "Order ID is missing."
    );
  }


  const context =
    getOrderContext_(
      cleanOrderId
    );


  let invoice =
    getInvoiceByOrder_(
      cleanOrderId
    );


  if (!invoice) {

    createInvoiceForOrder_(
      cleanOrderId
    );


    invoice =
      getInvoiceByOrder_(
        cleanOrderId
      );
  }


  if (!invoice) {

    throw new Error(
      "Invoice could not be found."
    );
  }


  if (
    String(
      context.order.Payment_Status || ""
    ).trim() !==
    CONFIG.STATUS.PAID
  ) {

    throw new Error(
      "Receipt cannot be generated because payment is not Paid."
    );
  }


  if (
    String(
      invoice.Invoice_Status || ""
    ).trim() !==
    CONFIG.STATUS.PAID
  ) {

    throw new Error(
      "Receipt cannot be generated because invoice is not Paid."
    );
  }


  const oldReceiptId =
    String(
      invoice.Receipt_ID || ""
    ).trim();


  const oldPdfLink =
    String(
      invoice.Receipt_PDF_Link || ""
    ).trim();


  if (
    oldReceiptId &&
    oldPdfLink &&
    !forceRegenerate
  ) {

    return {

      receiptId:
        oldReceiptId,

      orderId:
        cleanOrderId,

      invoiceId:
        invoice.Invoice_ID,

      amount:
        Number(
          invoice.Invoice_Amount || 0
        ),

      pdfLink:
        oldPdfLink,

      created:
        false

    };
  }


  const patient =
    context.patient;


  if (!patient) {

    throw new Error(
      "Patient record could not be found."
    );
  }


  const payments =
    tableRows_(
      "Payments"
    )
      .filter(
        payment =>

          String(
            payment.Order_ID || ""
          ).trim() ===
          cleanOrderId
      )
      .sort(
        (a, b) =>
          b._row - a._row
      );


  if (
    payments.length === 0
  ) {

    throw new Error(
      "No payment record was found."
    );
  }


  const payment =
    payments[0];


  const receiptId =
    oldReceiptId &&
    forceRegenerate

      ? oldReceiptId

      : nextReceiptId_();


  const total =
    Number(
      invoice.Invoice_Amount || 0
    );


  const paymentDate =
    payment.Payment_Date

      ? Utilities.formatDate(
          new Date(
            payment.Payment_Date
          ),
          CONFIG.TIMEZONE,
          "dd MMM yyyy HH:mm"
        )

      : Utilities.formatDate(
          new Date(),
          CONFIG.TIMEZONE,
          "dd MMM yyyy HH:mm"
        );


  const receiptDate =
    Utilities.formatDate(
      new Date(),
      CONFIG.TIMEZONE,
      "dd MMM yyyy HH:mm"
    );


  const document =
    DocumentApp.create(
      "Dr Evans Pharmacy Receipt " +
      receiptId
    );


  const body =
    document.getBody();


  body.clear();


  applyDocumentLayout_(
    body
  );


  /**
   * HEADER
   */

  addProfessionalHeader_(
    body,
    "OFFICIAL PAYMENT RECEIPT",
    receiptId,
    "PAYMENT VERIFIED",
    true
  );


  /**
   * TWO-COLUMN DETAILS
   */

  addTwoColumnDetails_(
    body,

    "RECEIPT INFORMATION",

    [
      {
        label:
          "Receipt ID",
        value:
          receiptId
      },

      {
        label:
          "Invoice ID",
        value:
          String(
            invoice.Invoice_ID || ""
          )
      },

      {
        label:
          "Order ID",
        value:
          cleanOrderId
      },

      {
        label:
          "Receipt Date",
        value:
          receiptDate
      }
    ],

    "PATIENT INFORMATION",

    [
      {
        label:
          "Patient",
        value:
          String(
            patient.Full_Name || ""
          )
      },

      {
        label:
          "Patient ID",
        value:
          String(
            patient.Patient_ID || ""
          )
      },

      {
        label:
          "Customer Type",
        value:
          String(
            context.order.Customer_Type || ""
          )
      },

      {
        label:
          "Payment Status",
        value:
          "Paid"
      }
    ]
  );


  /**
   * PAYMENT DETAILS
   */

  addSectionLabel_(
    body,
    "PAYMENT INFORMATION"
  );


  addInformationPanel_(
    body,
    [

      {
        label:
          "Payment ID",
        value:
          String(
            payment.Payment_ID || ""
          )
      },

      {
        label:
          "Payment Method",
        value:
          String(
            payment.Payment_Method ||
            "Mobile Money"
          )
      },

      {
        label:
          "Provider",
        value:
          String(
            payment.Network_Provider ||
            "Paystack"
          )
      },

      {
        label:
          "Transaction Reference",
        value:
          String(
            payment.Transaction_Reference ||
            "-"
          )
      },

      {
        label:
          "Payment Date",
        value:
          paymentDate
      }

    ]
  );


  addSmallSpacer_(
    body,
    5
  );


  /**
   * ITEMS
   */

  addSectionLabel_(
    body,
    "ITEMS PAID FOR"
  );


  addItemsTable_(
    body,
    context.items
  );


  addSmallSpacer_(
    body,
    5
  );


  /**
   * TOTAL
   */

  addTotalSummary_(
    body,
    total,
    true
  );


  addSmallSpacer_(
    body,
    5
  );


  /**
   * VERIFIED NOTICE
   */

  addVerifiedNotice_(
    body,
    "Payment verified",
    "This receipt confirms that payment has been received and verified for the associated pharmacy order."
  );


  /**
   * FOOTER
   */

  addProfessionalFooter_(
    body,
    receiptId
  );


  document.saveAndClose();


  /**
   * CREATE PDF
   */

  const docFile =
    DriveApp.getFileById(
      document.getId()
    );


  const pdfBlob =
    docFile
      .getAs(
        MimeType.PDF
      )
      .setName(
        receiptId +
        "_Dr_Evans_Pharmacy_Receipt.pdf"
      );


  const folder =
    receiptFolder_();


  /**
   * DELETE PREVIOUS RECEIPT PDF
   */

  if (
    forceRegenerate &&
    oldPdfLink
  ) {

    try {

      const oldFileId =
        driveFileIdFromUrl_(
          oldPdfLink
        );


      if (oldFileId) {

        DriveApp
          .getFileById(
            oldFileId
          )
          .setTrashed(
            true
          );
      }

    }

    catch (error) {

      console.log(
        "Old receipt could not be deleted: " +
        error.message
      );
    }
  }


  const pdfFile =
    folder.createFile(
      pdfBlob
    );


  docFile.setTrashed(
    true
  );


  const pdfLink =
    pdfFile.getUrl();


  /**
   * UPDATE INVOICE RECORD
   */

  const sheet =
    sheet_(
      "Invoices_Receipts"
    );


  const map =
    headerMap_(
      "Invoices_Receipts"
    );


  sheet
    .getRange(
      invoice._row,
      map.Receipt_ID
    )
    .setValue(
      receiptId
    );


  sheet
    .getRange(
      invoice._row,
      map.Receipt_Date
    )
    .setValue(
      new Date()
    );


  sheet
    .getRange(
      invoice._row,
      map.Receipt_Status
    )
    .setValue(
      CONFIG.STATUS.GENERATED
    );


  sheet
    .getRange(
      invoice._row,
      map.Receipt_PDF_Link
    )
    .setValue(
      pdfLink
    );


  SpreadsheetApp.flush();


  /**
   * EMAIL RECEIPT
   */

  if (
    validEmail_(
      patient.Patient_Email
    )
  ) {

    MailApp.sendEmail({

      to:
        String(
          patient.Patient_Email
        ).trim(),

      subject:
        "Dr. Evans Pharmacy - Official Payment Receipt",

      name:
        "Dr. Evans Pharmacy",

      body:
        "Your payment has been verified successfully. Your official receipt is attached.",

      htmlBody:
        `

        <div
          style="
            margin:0;
            padding:30px 12px;
            background:#eef4f5;
            font-family:Arial,Helvetica,sans-serif;
          "
        >

          <div
            style="
              max-width:650px;
              margin:auto;
              overflow:hidden;
              border-radius:18px;
              background:#ffffff;
              box-shadow:
                0 15px 45px
                rgba(15,23,42,.10);
            "
          >


            <div
              style="
                padding:28px 32px;
                background:#073b4c;
                border-bottom:5px solid #14b8a6;
                color:#ffffff;
              "
            >

              <div
                style="
                  font-size:24px;
                  font-weight:800;
                "
              >

                ✚ Dr. Evans Pharmacy

              </div>


              <div
                style="
                  margin-top:5px;
                  color:#bfe5e2;
                  font-size:10px;
                  font-weight:700;
                  letter-spacing:1px;
                "
              >

                PHARMACEUTICAL PATIENT CARE

              </div>

            </div>


            <div
              style="
                padding:30px 32px;
              "
            >


              <div
                style="
                  display:inline-block;
                  padding:7px 13px;
                  border-radius:999px;
                  background:#ecfdf3;
                  color:#166534;
                  font-size:11px;
                  font-weight:800;
                "
              >

                ✓ PAYMENT VERIFIED

              </div>


              <h2
                style="
                  color:#0f172a;
                  margin:22px 0 6px;
                "
              >

                Payment received successfully

              </h2>


              <p
                style="
                  margin:0;
                  color:#64748b;
                  line-height:1.7;
                "
              >

                Hello
                ${escapeHtml_(
                  patient.Full_Name
                )},

                your payment has been
                successfully verified.

                Your official pharmacy
                receipt is attached.

              </p>


              <div
                style="
                  margin-top:22px;
                  padding:18px;
                  border:1px solid #d9e3e7;
                  border-radius:12px;
                  background:#f8fafc;
                  line-height:1.9;
                  color:#334155;
                "
              >

                <strong>
                  Receipt ID:
                </strong>

                ${escapeHtml_(
                  receiptId
                )}

                <br>


                <strong>
                  Invoice ID:
                </strong>

                ${escapeHtml_(
                  invoice.Invoice_ID
                )}

                <br>


                <strong>
                  Order ID:
                </strong>

                ${escapeHtml_(
                  cleanOrderId
                )}

              </div>


              <div
                style="
                  margin-top:18px;
                  padding:20px;
                  border-radius:12px;
                  background:#073b4c;
                  color:#ffffff;
                  text-align:right;
                "
              >

                <div
                  style="
                    color:#bfe5e2;
                    font-size:10px;
                    font-weight:700;
                  "
                >

                  TOTAL PAID

                </div>


                <div
                  style="
                    margin-top:4px;
                    font-size:27px;
                    font-weight:800;
                  "
                >

                  GHS ${total.toFixed(2)}

                </div>

              </div>


              <div
                style="
                  margin-top:20px;
                  padding:15px;
                  border:1px solid #bbf7d0;
                  border-radius:10px;
                  background:#ecfdf3;
                  color:#166534;
                  line-height:1.6;
                "
              >

                ✓ Payment verified successfully.

                Your order has been
                completed.

              </div>

            </div>


            <div
              style="
                padding:18px 32px;
                background:#f8fafc;
                border-top:1px solid #e2e8f0;
                color:#64748b;
                font-size:11px;
              "
            >

              Dr. Evans Pharmacy

              <br>

              Always making life better.

            </div>

          </div>

        </div>
        `,

      attachments: [
        pdfBlob
      ]

    });
  }


  logAudit_({

    userType:
      "System",

    userId:
      "SYSTEM",

    action:
      forceRegenerate
        ? "RECEIPT REGENERATED"
        : "RECEIPT GENERATED",

    recordType:
      "Receipt",

    recordId:
      receiptId,

    details:
      "Professional receipt generated for order " +
      cleanOrderId +
      "."

  });


  return {

    receiptId:
      receiptId,

    orderId:
      cleanOrderId,

    invoiceId:
      invoice.Invoice_ID,

    amount:
      total,

    pdfLink:
      pdfLink,

    created:
      true

  };
}


/********************************************************
 * TEST INVOICE ENGINE
 ********************************************************/

function testInvoiceEngine() {

  const orders =
    tableRows_(
      "Orders"
    );


  if (
    orders.length === 0
  ) {

    throw new Error(
      "No orders were found."
    );
  }


  const latestOrder =
    orders[
      orders.length - 1
    ];


  const context =
    getOrderContext_(
      latestOrder.Order_ID
    );


  const result = {

    orderId:
      latestOrder.Order_ID,

    patientId:
      latestOrder.Patient_ID,

    itemCount:
      context.items.length,

    total:
      context.total

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
 * REGENERATE LATEST RECEIPT
 ********************************************************/

function regenerateLatestPaidReceipt() {

  const payment =
    latestPaidPayment_();


  const orderId =
    String(
      payment.Order_ID || ""
    ).trim();


  if (!orderId) {

    throw new Error(
      "Latest payment does not have an Order ID."
    );
  }


  const result =
    generateReceiptForOrder_(
      orderId,
      true
    );


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
 * DELETE OLD INVOICE PDF AND REGENERATE
 ********************************************************/

function regenerateLatestPaidInvoice() {

  const payment =
    latestPaidPayment_();


  const orderId =
    String(
      payment.Order_ID || ""
    ).trim();


  if (!orderId) {

    throw new Error(
      "Latest paid payment does not have an Order ID."
    );
  }


  const invoice =
    getInvoiceByOrder_(
      orderId
    );


  if (!invoice) {

    throw new Error(
      "Invoice not found."
    );
  }


  const invoiceId =
    String(
      invoice.Invoice_ID || ""
    ).trim();


  const folder =
    invoicePdfFolder_();


  const filename =
    invoiceId +
    "_Dr_Evans_Pharmacy_Invoice.pdf";


  const files =
    folder.getFilesByName(
      filename
    );


  while (
    files.hasNext()
  ) {

    files
      .next()
      .setTrashed(
        true
      );
  }


  const result =
    generateInvoicePdfForOrder_(
      orderId
    );


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
 * REGENERATE BOTH LATEST DOCUMENTS
 ********************************************************/

function regenerateLatestPaidDocuments() {

  const payment =
    latestPaidPayment_();


  const orderId =
    String(
      payment.Order_ID || ""
    ).trim();


  if (!orderId) {

    throw new Error(
      "Latest payment does not contain an Order ID."
    );
  }


  const invoice =
    getInvoiceByOrder_(
      orderId
    );


  if (!invoice) {

    throw new Error(
      "No invoice exists for the latest paid order."
    );
  }


  /**
   * REMOVE OLD INVOICE
   */

  const invoiceId =
    String(
      invoice.Invoice_ID || ""
    ).trim();


  const invoiceFolder =
    invoicePdfFolder_();


  const filename =
    invoiceId +
    "_Dr_Evans_Pharmacy_Invoice.pdf";


  const invoiceFiles =
    invoiceFolder.getFilesByName(
      filename
    );


  while (
    invoiceFiles.hasNext()
  ) {

    invoiceFiles
      .next()
      .setTrashed(
        true
      );
  }


  /**
   * NEW INVOICE
   */

  const invoiceResult =
    generateInvoicePdfForOrder_(
      orderId
    );


  /**
   * NEW RECEIPT
   */

  const receiptResult =
    generateReceiptForOrder_(
      orderId,
      true
    );


  const result = {

    orderId:
      orderId,

    invoice:
      invoiceResult,

    receipt:
      receiptResult

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
 * RECOVERY FUNCTION
 ********************************************************/

function recoverInvoiceAndGenerateReceipt() {

  const payment =
    latestPaidPayment_();


  const orderId =
    String(
      payment.Order_ID || ""
    ).trim();


  if (!orderId) {

    throw new Error(
      "Paid payment has no Order ID."
    );
  }


  createInvoiceForOrder_(
    orderId
  );


  const result =
    generateReceiptForOrder_(
      orderId,
      true
    );


  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;
}