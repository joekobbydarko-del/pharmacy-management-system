/**
 * DR. EVANS PHARMACY
 * PAYMENT ENGINE
 *
 * PAYSTACK TEST MODE
 * + GCB BANK TRANSFER VERIFICATION
 */


/**
 * GET PAYMENT CONTEXT
 */
function getPaymentContext_(orderId) {

  const cleanOrderId =
    String(orderId || "").trim();


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
      "No invoice was found for this order."
    );
  }


  if (!context.patient) {
    throw new Error(
      "Patient record could not be found."
    );
  }


  return {

    orderId:
      cleanOrderId,

    patientId:
      context.patient.Patient_ID,

    patientName:
      context.patient.Full_Name,

    patientEmail:
      context.patient.Patient_Email,

    amount:
      Number(
        invoice.Invoice_Amount || 0
      ),

    invoiceId:
      invoice.Invoice_ID,

    invoiceStatus:
      invoice.Invoice_Status,

    orderStatus:
      context.order.Order_Status,

    paymentStatus:
      context.order.Payment_Status

  };
}


/**
 * GET PAYSTACK TEST SECRET
 */
function getPaystackSecret_() {

  const key =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        CONFIG.PROPERTIES.PAYSTACK_SECRET
      );


  if (!key) {
    throw new Error(
      "Paystack test secret key has not been configured."
    );
  }


  const cleanKey =
    String(key).trim();


  if (
    !cleanKey.startsWith(
      "sk_test_"
    )
  ) {

    throw new Error(
      "The configured Paystack key is not a Test Secret Key."
    );
  }


  return cleanKey;
}


/**
 * GET LATEST PAYMENT FOR ORDER
 */
function getPaymentByOrder_(orderId) {

  const cleanOrderId =
    String(orderId || "").trim();


  const payments =
    tableRows_("Payments")
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


  return payments.length
    ? payments[0]
    : null;
}


/**
 * CREATE OR GET PENDING PAYMENT
 */
function createPendingPayment_(
  orderId,
  paymentMethod,
  networkProvider
) {

  const context =
    getPaymentContext_(
      orderId
    );


  const existing =
    getPaymentByOrder_(
      orderId
    );


  if (existing) {

    return {

      paymentId:
        existing.Payment_ID,

      transactionReference:
        existing.Transaction_Reference,

      amount:
        Number(
          existing.Amount_Paid || 0
        ),

      paymentStatus:
        existing.Payment_Status,

      created:
        false

    };
  }


  const paymentId =
    nextId_(
      "Payments",
      "Payment_ID",
      "PAY",
      3
    );


  const transactionReference =
    "EVANS-" +
    context.orderId +
    "-" +
    paymentId +
    "-" +
    new Date().getTime();


  appendRecord_(
    "Payments",
    {

      Payment_ID:
        paymentId,

      Order_ID:
        context.orderId,

      Patient_ID:
        context.patientId,

      Payment_Date:
        new Date(),

      Amount_Paid:
        context.amount,

      Payment_Method:
        paymentMethod || "",

      Network_Provider:
        networkProvider || "",

      Transaction_Reference:
        transactionReference,

      Provider_Reference:
        "",

      Provider_Status:
        "Pending",

      Payment_Confirmed:
        false,

      Confirmed_By:
        "",

      Confirmation_Date:
        "",

      Payment_Status:
        CONFIG.STATUS.PENDING

    }
  );


  logAudit_({

    userType:
      "Patient",

    userId:
      context.patientId,

    action:
      "PAYMENT INITIATED",

    recordType:
      "Payment",

    recordId:
      paymentId,

    details:
      "Payment initiated for order " +
      context.orderId +
      "."

  });


  return {

    paymentId:
      paymentId,

    transactionReference:
      transactionReference,

    amount:
      context.amount,

    paymentStatus:
      CONFIG.STATUS.PENDING,

    created:
      true

  };
}


/**
 * INITIALIZE PAYSTACK
 */
function initializePaystackMobileMoney_(
  orderId
) {

  const context =
    getPaymentContext_(
      orderId
    );


  if (
    String(
      context.paymentStatus || ""
    ).trim() ===
    CONFIG.STATUS.PAID
  ) {

    throw new Error(
      "This order has already been paid."
    );
  }


  if (
    !validEmail_(
      context.patientEmail
    )
  ) {

    throw new Error(
      "A valid patient email address is required for Paystack payment."
    );
  }


  const payment =
    createPendingPayment_(
      context.orderId,
      "Mobile Money",
      "Paystack"
    );


  if (
    String(
      payment.paymentStatus || ""
    ).trim() ===
    CONFIG.STATUS.PAID
  ) {

    throw new Error(
      "This payment has already been completed."
    );
  }


  const callbackToken =
    createToken_(
      "PAYSTACK_CALLBACK:" +
      payment.paymentId +
      ":" +
      payment.transactionReference
    );


  const callbackUrl =
    buildPublicUrl_(
      "paystack-callback",
      {

        paymentId:
          payment.paymentId,

        token:
          callbackToken

      }
    );


  const amountInPesewas =
    Math.round(
      Number(
        context.amount
      ) * 100
    );


  if (
    amountInPesewas <= 0
  ) {

    throw new Error(
      "Invalid payment amount."
    );
  }


  const payload = {

    email:
      String(
        context.patientEmail
      ).trim(),

    amount:
      String(
        amountInPesewas
      ),

    currency:
      CONFIG.CURRENCY,

    reference:
      payment.transactionReference,

    callback_url:
      callbackUrl,

    channels: [
      "mobile_money"
    ],

    metadata:
      JSON.stringify({

        payment_id:
          payment.paymentId,

        order_id:
          context.orderId,

        invoice_id:
          context.invoiceId,

        patient_id:
          context.patientId

      })

  };


  const response =
    UrlFetchApp.fetch(
      "https://api.paystack.co/transaction/initialize",
      {

        method:
          "post",

        contentType:
          "application/json",

        headers: {

          Authorization:
            "Bearer " +
            getPaystackSecret_()

        },

        payload:
          JSON.stringify(
            payload
          ),

        muteHttpExceptions:
          true

      }
    );


  const responseCode =
    response.getResponseCode();


  let body;


  try {

    body =
      JSON.parse(
        response.getContentText()
      );

  }

  catch (error) {

    throw new Error(
      "Paystack returned an invalid response."
    );
  }


  if (
    responseCode < 200 ||
    responseCode >= 300 ||
    !body.status ||
    !body.data ||
    !body.data.authorization_url
  ) {

    throw new Error(
      body.message ||
      "Unable to initialize Paystack payment."
    );
  }


  updateProviderStatus_(
    payment.paymentId,
    body.data.reference ||
      payment.transactionReference,
    "Initialized"
  );


  logAudit_({

    userType:
      "System",

    userId:
      "SYSTEM",

    action:
      "PAYSTACK CHECKOUT CREATED",

    recordType:
      "Payment",

    recordId:
      payment.paymentId,

    details:
      "Paystack Test checkout initialized for order " +
      context.orderId +
      "."

  });


  return {

    paymentId:
      payment.paymentId,

    orderId:
      context.orderId,

    invoiceId:
      context.invoiceId,

    amount:
      context.amount,

    checkoutUrl:
      body.data.authorization_url,

    reference:
      body.data.reference ||
      payment.transactionReference

  };
}


/**
 * VERIFY PAYSTACK PAYMENT
 */
function verifyPaystackPayment_(
  paymentId,
  returnedReference
) {

  const cleanPaymentId =
    String(
      paymentId || ""
    ).trim();


  const payment =
    findRecord_(
      "Payments",
      "Payment_ID",
      cleanPaymentId
    );


  if (!payment) {

    throw new Error(
      "Payment record could not be found."
    );
  }


  if (
    String(
      payment.Payment_Status || ""
    ).trim() ===
    CONFIG.STATUS.PAID
  ) {

    const invoice =
      getInvoiceByOrder_(
        payment.Order_ID
      );


    return {

      paymentId:
        payment.Payment_ID,

      orderId:
        payment.Order_ID,

      invoiceId:
        invoice
          ? invoice.Invoice_ID
          : "",

      amount:
        Number(
          payment.Amount_Paid || 0
        ),

      status:
        CONFIG.STATUS.PAID,

      providerStatus:
        payment.Provider_Status,

      alreadyProcessed:
        true

    };
  }


  const storedReference =
    String(
      payment.Transaction_Reference || ""
    ).trim();


  const reference =
    String(
      returnedReference || ""
    ).trim();


  if (
    !reference ||
    reference !==
    storedReference
  ) {

    throw new Error(
      "The Paystack transaction reference does not match our payment record."
    );
  }


  const response =
    UrlFetchApp.fetch(
      "https://api.paystack.co/transaction/verify/" +
      encodeURIComponent(
        reference
      ),
      {

        method:
          "get",

        headers: {

          Authorization:
            "Bearer " +
            getPaystackSecret_()

        },

        muteHttpExceptions:
          true

      }
    );


  const responseCode =
    response.getResponseCode();


  let body;


  try {

    body =
      JSON.parse(
        response.getContentText()
      );

  }

  catch (error) {

    throw new Error(
      "Paystack verification returned an invalid response."
    );
  }


  if (
    responseCode < 200 ||
    responseCode >= 300 ||
    !body.status ||
    !body.data
  ) {

    throw new Error(
      body.message ||
      "Unable to verify this payment with Paystack."
    );
  }


  const data =
    body.data;


  const providerStatus =
    String(
      data.status || ""
    )
      .trim()
      .toLowerCase();


  if (
    providerStatus !==
    "success"
  ) {

    updateProviderStatus_(
      cleanPaymentId,
      reference,
      providerStatus ||
        "Failed"
    );


    throw new Error(
      "Paystack has not confirmed this transaction as successful."
    );
  }


  const verifiedReference =
    String(
      data.reference || ""
    ).trim();


  if (
    verifiedReference !==
    storedReference
  ) {

    throw new Error(
      "The verified Paystack reference does not match our records."
    );
  }


  const expectedAmount =
    Math.round(
      Number(
        payment.Amount_Paid || 0
      ) * 100
    );


  const receivedAmount =
    Number(
      data.amount || 0
    );


  if (
    receivedAmount !==
    expectedAmount
  ) {

    throw new Error(
      "The verified Paystack amount does not match the invoice amount."
    );
  }


  const verifiedCurrency =
    String(
      data.currency || ""
    )
      .trim()
      .toUpperCase();


  if (
    verifiedCurrency !==
    String(
      CONFIG.CURRENCY
    ).toUpperCase()
  ) {

    throw new Error(
      "The verified payment currency does not match the invoice currency."
    );
  }


  const providerReference =
    data.id
      ? String(
          data.id
        )
      : verifiedReference;


  updateProviderStatus_(
    cleanPaymentId,
    providerReference,
    "success"
  );


  const confirmation =
    confirmVerifiedPayment_(
      cleanPaymentId
    );


  return {

    paymentId:
      cleanPaymentId,

    orderId:
      payment.Order_ID,

    invoiceId:
      confirmation.invoiceId,

    amount:
      Number(
        payment.Amount_Paid || 0
      ),

    providerStatus:
      "success",

    paymentStatus:
      CONFIG.STATUS.PAID,

    receiptId:
      confirmation.receiptId || "",

    receiptPdfLink:
      confirmation.receiptPdfLink || "",

    receiptGenerated:
      confirmation.receiptGenerated === true,

    confirmed:
      true

  };
}


/**
 * UPDATE PROVIDER DETAILS
 */
function updateProviderStatus_(
  paymentId,
  providerReference,
  providerStatus
) {

  const payment =
    findRecord_(
      "Payments",
      "Payment_ID",
      paymentId
    );


  if (!payment) {

    throw new Error(
      "Payment " +
      paymentId +
      " was not found."
    );
  }


  const sheet =
    sheet_(
      "Payments"
    );


  const map =
    headerMap_(
      "Payments"
    );


  sheet
    .getRange(
      payment._row,
      map.Provider_Reference
    )
    .setValue(
      providerReference || ""
    );


  sheet
    .getRange(
      payment._row,
      map.Provider_Status
    )
    .setValue(
      providerStatus || ""
    );


  SpreadsheetApp.flush();


  return true;
}


/**
 * CONFIRM VERIFIED PAYSTACK PAYMENT
 */
function confirmVerifiedPayment_(
  paymentId
) {

  const payment =
    findRecord_(
      "Payments",
      "Payment_ID",
      paymentId
    );


  if (!payment) {

    throw new Error(
      "Payment " +
      paymentId +
      " was not found."
    );
  }


  if (
    String(
      payment.Provider_Status || ""
    )
      .trim()
      .toLowerCase() !==
    "success"
  ) {

    throw new Error(
      "Payment cannot be confirmed because Paystack has not verified it."
    );
  }


  return finalizePaidPayment_(
    paymentId,
    "Paystack Verified",
    "PAYSTACK"
  );
}


/**
 * GCB BANK TRANSFER VERIFICATION
 *
 * IMPORTANT:
 * Only call this after the pharmacy
 * has actually verified the transfer.
 */
function confirmBankTransferPayment_(
  paymentId,
  confirmedBy
) {

  const cleanPaymentId =
    String(
      paymentId || ""
    ).trim();


  const payment =
    findRecord_(
      "Payments",
      "Payment_ID",
      cleanPaymentId
    );


  if (!payment) {

    throw new Error(
      "Payment " +
      cleanPaymentId +
      " was not found."
    );
  }


  if (
    String(
      payment.Payment_Status || ""
    ).trim() ===
    CONFIG.STATUS.PAID
  ) {

    return finalizePaidPayment_(
      cleanPaymentId,
      payment.Confirmed_By ||
        "GCB Verified",
      "GCB"
    );
  }


  if (
    String(
      payment.Payment_Method || ""
    ).trim() !==
    "Bank Transfer"
  ) {

    throw new Error(
      "This payment is not a bank transfer."
    );
  }


  if (
    String(
      payment.Network_Provider || ""
    ).trim() !==
    "GCB"
  ) {

    throw new Error(
      "This payment is not a GCB transfer."
    );
  }


  const providerStatus =
    String(
      payment.Provider_Status || ""
    ).trim();


  if (
    providerStatus !==
    "Submitted" &&
    providerStatus !==
    "Verified"
  ) {

    throw new Error(
      "This bank transfer has not been submitted for verification."
    );
  }


  const verifier =
    String(
      confirmedBy ||
      "Pharmacy Verification"
    ).trim();


  updateProviderStatus_(
    cleanPaymentId,
    payment.Provider_Reference,
    "Verified"
  );


  return finalizePaidPayment_(
    cleanPaymentId,
    verifier,
    "GCB"
  );
}


/**
 * FINALIZE A VERIFIED PAYMENT
 *
 * Used by both:
 * - Paystack verified payments
 * - GCB manually verified transfers
 */
function finalizePaidPayment_(
  paymentId,
  confirmedBy,
  source
) {

  const payment =
    findRecord_(
      "Payments",
      "Payment_ID",
      paymentId
    );


  if (!payment) {

    throw new Error(
      "Payment " +
      paymentId +
      " was not found."
    );
  }


  const sheet =
    sheet_(
      "Payments"
    );


  const map =
    headerMap_(
      "Payments"
    );


  /**
   * MARK PAYMENT PAID
   */
  if (
    String(
      payment.Payment_Status || ""
    ).trim() !==
    CONFIG.STATUS.PAID
  ) {

    sheet
      .getRange(
        payment._row,
        map.Payment_Confirmed
      )
      .setValue(true);


    sheet
      .getRange(
        payment._row,
        map.Confirmed_By
      )
      .setValue(
        confirmedBy
      );


    sheet
      .getRange(
        payment._row,
        map.Confirmation_Date
      )
      .setValue(
        new Date()
      );


    sheet
      .getRange(
        payment._row,
        map.Payment_Status
      )
      .setValue(
        CONFIG.STATUS.PAID
      );


    SpreadsheetApp.flush();
  }


  /**
   * ORDER -> PAID / COMPLETED
   */
  markOrderPaid_(
    payment.Order_ID
  );


  /**
   * INVOICE -> PAID
   */
  markInvoicePaid_(
    payment.Order_ID
  );


  /**
   * GENERATE RECEIPT
   */
  let receiptResult = null;
  let receiptError = "";


  try {

    receiptResult =
      generateReceiptForOrder_(
        payment.Order_ID,
        false
      );

  }

  catch (error) {

    receiptError =
      error.message ||
      "Receipt generation failed.";


    console.error(
      receiptError
    );


    logAudit_({

      userType:
        "System",

      userId:
        "SYSTEM",

      action:
        "RECEIPT GENERATION FAILED",

      recordType:
        "Payment",

      recordId:
        paymentId,

      details:
        receiptError

    });
  }


  const invoice =
    getInvoiceByOrder_(
      payment.Order_ID
    );


  logAudit_({

    userType:
      "System",

    userId:
      source || "SYSTEM",

    action:
      "PAYMENT CONFIRMED",

    recordType:
      "Payment",

    recordId:
      paymentId,

    details:
      "Payment confirmed for order " +
      payment.Order_ID +
      " by " +
      confirmedBy +
      "."

  });


  return {

    paymentId:
      paymentId,

    orderId:
      payment.Order_ID,

    invoiceId:
      invoice
        ? invoice.Invoice_ID
        : "",

    status:
      CONFIG.STATUS.PAID,

    confirmed:
      true,

    receiptGenerated:
      Boolean(
        receiptResult
      ),

    receiptId:
      receiptResult
        ? receiptResult.receiptId
        : "",

    receiptPdfLink:
      receiptResult
        ? receiptResult.pdfLink
        : "",

    receiptError:
      receiptError

  };
}


/**
 * MARK ORDER PAID / COMPLETED
 */
function markOrderPaid_(
  orderId
) {

  const order =
    findRecord_(
      "Orders",
      "Order_ID",
      orderId
    );


  if (!order) {

    throw new Error(
      "Order " +
      orderId +
      " was not found."
    );
  }


  const sheet =
    sheet_(
      "Orders"
    );


  const map =
    headerMap_(
      "Orders"
    );


  sheet
    .getRange(
      order._row,
      map.Payment_Status
    )
    .setValue(
      CONFIG.STATUS.PAID
    );


  sheet
    .getRange(
      order._row,
      map.Order_Status
    )
    .setValue(
      CONFIG.STATUS.COMPLETED
    );


  SpreadsheetApp.flush();


  return true;
}


/**
 * MARK INVOICE PAID
 */
function markInvoicePaid_(
  orderId
) {

  const invoice =
    getInvoiceByOrder_(
      orderId
    );


  if (!invoice) {

    throw new Error(
      "Invoice was not found for order " +
      orderId +
      "."
    );
  }


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
      map.Invoice_Status
    )
    .setValue(
      CONFIG.STATUS.PAID
    );


  SpreadsheetApp.flush();


  return true;
}


/**
 * FIND LATEST SUBMITTED GCB TRANSFER
 */
function latestSubmittedGcbPayment_() {

  const payments =
    tableRows_("Payments")
      .filter(
        payment =>

          String(
            payment.Payment_Method || ""
          ).trim() ===
          "Bank Transfer" &&

          String(
            payment.Network_Provider || ""
          ).trim() ===
          "GCB" &&

          String(
            payment.Provider_Status || ""
          ).trim() ===
          "Submitted" &&

          String(
            payment.Payment_Status || ""
          ).trim() ===
          CONFIG.STATUS.PENDING
      )
      .sort(
        (a, b) =>
          b._row - a._row
      );


  if (!payments.length) {

    throw new Error(
      "No submitted GCB transfer is waiting for verification."
    );
  }


  return payments[0];
}


/**
 * TEST / DEMO:
 * VERIFY LATEST SUBMITTED GCB TRANSFER
 *
 * This really marks it Paid.
 *
 * Only run after checking the transfer.
 */
function verifyLatestSubmittedGcbTransfer() {

  const payment =
    latestSubmittedGcbPayment_();


  Logger.log(
    "Verifying GCB payment: " +
    payment.Payment_ID
  );


  const result =
    confirmBankTransferPayment_(
      payment.Payment_ID,
      "Pharmacy Verification"
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


/**
 * PAYSTACK CONFIG TEST
 */
function testPaystackConfiguration() {

  const secret =
    getPaystackSecret_();


  const settings =
    loadPaymentSettings_();


  const result = {

    keyConfigured:
      Boolean(secret),

    keyType:
      secret.startsWith(
        "sk_test_"
      )
        ? "TEST"
        : "UNKNOWN",

    paymentMode:
      String(
        settings.Payment_Mode || ""
      ),

    currency:
      CONFIG.CURRENCY

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


/**
 * SAFE PAYMENT ENGINE TEST
 */
function testPaymentEngine() {

  const invoices =
    tableRows_(
      "Invoices_Receipts"
    );


  if (!invoices.length) {

    throw new Error(
      "No invoice records were found."
    );
  }


  const latestInvoice =
    invoices[
      invoices.length - 1
    ];


  const orderId =
    String(
      latestInvoice.Order_ID || ""
    ).trim();


  const context =
    getPaymentContext_(
      orderId
    );


  const result = {

    orderId:
      context.orderId,

    patientId:
      context.patientId,

    invoiceId:
      context.invoiceId,

    amount:
      context.amount,

    orderStatus:
      context.orderStatus,

    paymentStatus:
      context.paymentStatus

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