/**
 * DR. EVANS PHARMACY
 * MESSAGING & REFILL REMINDER ENGINE
 *
 * Handles:
 * - Patient refill email
 * - Doctor refill alert email
 * - Arkesel SMS
 * - Arkesel Voice reminder routing
 * - Preferred contact routing
 * - Secure refill confirmation links
 * - SMS logging
 * - Refill reminder tracking
 *
 * DEMO SAFETY:
 * Automated patient contact is restricted
 * to approved test patients only.
 */


/********************************************************
 * MESSAGING CONFIGURATION
 ********************************************************/

const SMS_CONFIG = {

  ARKESEL_ENDPOINT:
    "https://sms.arkesel.com/api/v2/sms/send",

  API_KEY_PROPERTY:
    "ARKESEL_API_KEY",

  SENDER_ID:
    "DrEvans"

};


/********************************************************
 * DEMO SAFETY
 *
 * Keep this TRUE during the demo.
 *
 * Only P001 and P011 may receive
 * automated patient SMS / Voice contact.
 *
 * This prevents fictional numbers from
 * accidentally being contacted.
 ********************************************************/

const MESSAGING_DEMO = {

  ENABLED:
    true,

  ALLOWED_TEST_PATIENT_IDS: [
    "P001",
    "P011"
  ]

};


/********************************************************
 * BASIC EMAIL VALIDATION
 ********************************************************/

function validEmail_(email) {

  const value =
    String(
      email || ""
    ).trim();


  if (!value) {

    return false;
  }


  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(
      value
    );
}


/********************************************************
 * FORMAT DATE
 ********************************************************/

function formatDate_(value) {

  if (!value) {

    return "-";
  }


  try {

    return Utilities.formatDate(

      new Date(value),

      CONFIG.TIMEZONE,

      "dd MMM yyyy"

    );

  }

  catch (error) {

    return String(
      value
    );
  }
}


/********************************************************
 * BUILD SECURE CONTACT PATIENT LINK
 ********************************************************/

function buildContactPatientUrl_(
  patientId
) {

  const cleanPatientId =
    String(
      patientId || ""
    ).trim();


  if (!cleanPatientId) {

    throw new Error(
      "Patient ID is missing."
    );
  }


  const token =
    createToken_(

      "CONTACT:" +
      cleanPatientId

    );


  return buildPublicUrl_(

    "contact",

    {

      patientId:
        cleanPatientId,

      token:
        token

    }

  );
}


/********************************************************
 * BUILD SECURE REFILL CONFIRMATION LINK
 ********************************************************/

function buildRefillConfirmationUrl_(
  refillId
) {

  const cleanRefillId =
    String(
      refillId || ""
    ).trim();


  if (!cleanRefillId) {

    throw new Error(
      "Refill ID is missing."
    );
  }


  const token =
    createToken_(

      "REFILL:" +
      cleanRefillId

    );


  return buildPublicUrl_(

    "confirm-refill",

    {

      refillId:
        cleanRefillId,

      token:
        token

    }

  );
}


/********************************************************
 * GET COMPLETE REFILL CONTEXT
 ********************************************************/

function getRefillMessageContext_(
  refillId
) {

  const cleanRefillId =
    String(
      refillId || ""
    ).trim();


  const refill =
    findRecord_(

      "Refills",

      "Refill_ID",

      cleanRefillId

    );


  if (!refill) {

    throw new Error(
      "Refill " +
      cleanRefillId +
      " was not found."
    );
  }


  const patient =
    findRecord_(

      "Patients",

      "Patient_ID",

      refill.Patient_ID

    );


  if (!patient) {

    throw new Error(
      "Patient " +
      refill.Patient_ID +
      " was not found."
    );
  }


  const drug =
    findRecord_(

      "Drugs",

      "Drug_ID",

      refill.Drug_ID

    );


  if (!drug) {

    throw new Error(
      "Drug " +
      refill.Drug_ID +
      " was not found."
    );
  }


  return {

    refill:
      refill,

    patient:
      patient,

    drug:
      drug,

    refillId:
      cleanRefillId,

    patientId:
      String(
        patient.Patient_ID || ""
      ).trim(),

    patientName:
      String(
        patient.Full_Name || ""
      ).trim(),

    phone:
      String(
        patient.Phone || ""
      ).trim(),

    patientEmail:
      String(
        patient.Patient_Email || ""
      ).trim(),

    doctorEmail:
      String(
        patient.Doctor_Email || ""
      ).trim(),

    preferredContact:
      String(
        patient.Preferred_Contact || ""
      ).trim(),

    nextRefillDate:
      refill.Next_Refill_Date,

    reminderStatus:
      String(
        refill.Reminder_Status || ""
      ).trim()

  };
}


/********************************************************
 * NORMALIZE PREFERRED CONTACT
 ********************************************************/

function normalizePreferredContact_(
  value
) {

  const contact =
    String(
      value || ""
    )
      .trim()
      .toLowerCase();


  if (
    contact === "email" ||
    contact === "e-mail"
  ) {

    return "Email";
  }


  if (
    contact === "sms" ||
    contact === "text" ||
    contact === "text message"
  ) {

    return "SMS";
  }


  if (
    contact === "voice" ||
    contact === "call" ||
    contact === "phone" ||
    contact === "phone call"
  ) {

    return "Voice";
  }


  if (
    contact === "whatsapp" ||
    contact === "whats app"
  ) {

    return "WhatsApp";
  }


  /**
   * Default safely to Email.
   */
  return "Email";
}


/********************************************************
 * CHECK DEMO PATIENT SAFETY
 ********************************************************/

function isApprovedDemoPatient_(
  patientId
) {

  if (
    MESSAGING_DEMO.ENABLED !== true
  ) {

    return true;
  }


  const cleanPatientId =
    String(
      patientId || ""
    ).trim();


  return (
    MESSAGING_DEMO
      .ALLOWED_TEST_PATIENT_IDS
      .indexOf(
        cleanPatientId
      ) !== -1
  );
}


/********************************************************
 * PATIENT REFILL EMAIL
 ********************************************************/

function sendPatientRefillEmail_(
  context
) {

  if (
    !validEmail_(
      context.patientEmail
    )
  ) {

    return false;
  }


  const confirmationUrl =
    buildRefillConfirmationUrl_(
      context.refillId
    );


  let subject =
    "Refill reminder";


  let intro =
    "This is a reminder from Dr. Evans Pharmacy regarding your refill.";


  if (
    context.reminderStatus ===
    "Due Soon"
  ) {

    subject =
      "Upcoming refill reminder";

    intro =
      "This is a courteous reminder from Dr. Evans Pharmacy that your refill is due soon.";
  }


  else if (
    context.reminderStatus ===
    "Due Today"
  ) {

    subject =
      "Your refill is due today";

    intro =
      "This is a reminder from Dr. Evans Pharmacy that your refill is due today.";
  }


  else if (
    context.reminderStatus ===
    "Overdue"
  ) {

    subject =
      "Refill reminder";

    intro =
      "Our records indicate that your refill is overdue. Please review your refill information below.";
  }


  const html = `

  <!DOCTYPE html>

  <html>

  <head>

    <meta
      name="viewport"
      content="width=device-width, initial-scale=1"
    >

    <style>

      .email-button {

        display:inline-block;
        padding:14px 25px;
        background:#0f766e;
        color:#ffffff !important;
        text-decoration:none;
        border-radius:10px;
        font-weight:bold;

      }

      @media
      only screen
      and
      (max-width:600px) {

        .email-card {

          width:100% !important;

        }

        .email-body {

          padding:24px 20px !important;

        }

      }

    </style>

  </head>


  <body
    style="
      margin:0;
      padding:0;
      background:#eef4f5;
    "
  >

    <div style="
      padding:30px 12px;
      background:#eef4f5;
      font-family:Arial,Helvetica,sans-serif;
    ">


      <div
        class="email-card"
        style="
          max-width:620px;
          margin:auto;
          background:#ffffff;
          border-radius:18px;
          overflow:hidden;
          border:1px solid #e2e8f0;
          box-shadow:
            0 10px 30px
            rgba(15,23,42,.08);
        "
      >


        <div style="
          padding:30px;
          background:
            linear-gradient(
              135deg,
              #075563,
              #0f766e
            );
          color:#ffffff;
        ">

          <div style="
            font-size:28px;
            font-weight:bold;
          ">

            ✚ Dr. Evans Pharmacy

          </div>


          <div style="
            margin-top:7px;
            color:#d5eeee;
            font-size:12px;
            letter-spacing:1px;
          ">

            PATIENT REFILL REMINDER

          </div>

        </div>


        <div
          class="email-body"
          style="
            padding:30px;
            color:#334155;
          "
        >


          <h2 style="
            margin-top:0;
            color:#075563;
          ">

            Hello
            ${escapeHtml_(
              context.patientName
            )}

          </h2>


          <p style="
            line-height:1.7;
          ">

            ${escapeHtml_(
              intro
            )}

          </p>


          <div style="
            margin:22px 0;
            padding:18px;
            background:#f1f7f7;
            border:1px solid #dbe7e9;
            border-radius:12px;
            line-height:1.9;
          ">


            <strong>
              Refill ID:
            </strong>

            ${escapeHtml_(
              context.refillId
            )}

            <br>


            <strong>
              Refill Date:
            </strong>

            ${escapeHtml_(
              formatDate_(
                context.nextRefillDate
              )
            )}

            <br>


            <strong>
              Status:
            </strong>

            ${escapeHtml_(
              context.reminderStatus
            )}


          </div>


          <p style="
            line-height:1.7;
          ">

            Please use the secure button below
            to review and confirm your refill.

          </p>


          <div style="
            text-align:center;
            margin:30px 0 12px;
          ">


            <a
              class="email-button"
              href="${confirmationUrl}"
            >

              Review & Confirm Refill

            </a>


          </div>

        </div>


        <div style="
          padding:18px;
          text-align:center;
          background:#f8fafc;
          color:#94a3b8;
          font-size:11px;
          line-height:1.6;
        ">

          Dr. Evans Pharmacy —
          Always making life better.

        </div>


      </div>

    </div>

  </body>

  </html>
  `;


  MailApp.sendEmail({

    to:
      context.patientEmail,

    subject:
      subject,

    name:
      "Dr. Evans Pharmacy",

    body:
      "You have a pharmacy refill reminder. Please open this email to review and confirm your refill.",

    htmlBody:
      html

  });


  return true;
}


/********************************************************
 * DOCTOR REFILL EMAIL
 ********************************************************/

function sendDoctorRefillEmail_(
  context
) {

  if (
    !validEmail_(
      context.doctorEmail
    )
  ) {

    return false;
  }


  const contactUrl =
    buildContactPatientUrl_(
      context.patientId
    );


  const subject =
    "Patient refill alert - " +
    context.patientName;


  const html = `

  <!DOCTYPE html>

  <html>

  <body
    style="
      margin:0;
      padding:0;
      background:#eef4f5;
    "
  >

    <div style="
      padding:30px 12px;
      background:#eef4f5;
      font-family:Arial,Helvetica,sans-serif;
    ">


      <div style="
        max-width:620px;
        margin:auto;
        background:#ffffff;
        border-radius:18px;
        overflow:hidden;
        border:1px solid #e2e8f0;
      ">


        <div style="
          padding:30px;
          background:#075563;
          color:#ffffff;
        ">

          <div style="
            font-size:28px;
            font-weight:bold;
          ">

            ✚ Dr. Evans Pharmacy

          </div>


          <div style="
            margin-top:7px;
            color:#d5eeee;
            font-size:12px;
          ">

            PATIENT REFILL ALERT

          </div>

        </div>


        <div style="
          padding:30px;
          color:#334155;
        ">


          <div style="
            padding:18px;
            background:#f1f7f7;
            border:1px solid #dbe7e9;
            border-radius:12px;
            line-height:1.9;
          ">


            <strong>
              Patient:
            </strong>

            ${escapeHtml_(
              context.patientName
            )}

            <br>


            <strong>
              Patient ID:
            </strong>

            ${escapeHtml_(
              context.patientId
            )}

            <br>


            <strong>
              Phone:
            </strong>

            ${escapeHtml_(
              context.phone
            )}

            <br>


            <strong>
              Preferred Contact:
            </strong>

            ${escapeHtml_(
              normalizePreferredContact_(
                context.preferredContact
              )
            )}

            <br>


            <strong>
              Refill Date:
            </strong>

            ${escapeHtml_(
              formatDate_(
                context.nextRefillDate
              )
            )}

            <br>


            <strong>
              Status:
            </strong>

            ${escapeHtml_(
              context.reminderStatus
            )}


          </div>


          <p style="
            margin-top:22px;
            line-height:1.7;
            color:#64748b;
          ">

            Use the secure patient contact centre
            if manual follow-up is required.

          </p>


          <div style="
            text-align:center;
            margin:30px 0 12px;
          ">


            <a
              href="${contactUrl}"
              style="
                display:inline-block;
                padding:14px 25px;
                background:#0f766e;
                color:#ffffff;
                text-decoration:none;
                border-radius:10px;
                font-weight:bold;
              "
            >

              Contact Patient

            </a>


          </div>

        </div>


        <div style="
          padding:18px;
          text-align:center;
          background:#f8fafc;
          color:#94a3b8;
          font-size:11px;
        ">

          Dr. Evans Pharmacy —
          Always making life better.

        </div>


      </div>

    </div>

  </body>

  </html>
  `;


  MailApp.sendEmail({

    to:
      context.doctorEmail,

    subject:
      subject,

    name:
      "Dr. Evans Pharmacy",

    body:
      "A patient has a refill alert. Please open this email to review the patient contact options.",

    htmlBody:
      html

  });


  return true;
}


/********************************************************
 *
 * ARKESEL SMS SECTION
 *
 ********************************************************/


/********************************************************
 * NORMALIZE GHANA PHONE NUMBER
 ********************************************************/

function normalizeSmsPhone_(
  phone
) {

  if (!phone) {

    throw new Error(
      "SMS phone number is missing."
    );
  }


  let cleaned =
    String(
      phone
    )
      .trim()
      .replace(/\s+/g, "")
      .replace(/-/g, "")
      .replace(/\(/g, "")
      .replace(/\)/g, "");


  if (
    cleaned.startsWith("+233")
  ) {

    cleaned =
      cleaned.substring(1);
  }


  if (
    cleaned.startsWith("0")
  ) {

    cleaned =
      "233" +
      cleaned.substring(1);
  }


  if (
    !cleaned.startsWith("233")
  ) {

    throw new Error(
      "Invalid Ghana SMS phone number."
    );
  }


  return cleaned;
}


/********************************************************
 * GET ARKESEL SMS API KEY
 ********************************************************/

function getArkeselSmsApiKey_() {

  const apiKey =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        SMS_CONFIG.API_KEY_PROPERTY
      );


  if (!apiKey) {

    throw new Error(
      "ARKESEL_API_KEY was not found in Script Properties."
    );
  }


  return apiKey;
}


/********************************************************
 * CREATE SMS LOG ID
 ********************************************************/

function createSmsLogId_() {

  const sheet =
    sheet_(
      "SMS_Log"
    );


  const lastRow =
    sheet.getLastRow();


  if (
    lastRow < 2
  ) {

    return "SMS001";
  }


  const ids =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        1
      )
      .getValues()
      .flat()
      .filter(String);


  let highest = 0;


  ids.forEach(
    id => {

      const match =
        String(
          id
        ).match(
          /SMS(\d+)/i
        );


      if (
        match
      ) {

        const number =
          Number(
            match[1]
          );


        if (
          number >
          highest
        ) {

          highest =
            number;
        }
      }

    }
  );


  return (
    "SMS" +
    String(
      highest + 1
    ).padStart(
      3,
      "0"
    )
  );
}


/********************************************************
 * LOG SMS
 ********************************************************/

function logSms_(
  patientId,
  phone,
  messageType,
  messageText,
  providerMessageId,
  deliveryStatus
) {

  const sheet =
    sheet_(
      "SMS_Log"
    );


  const smsId =
    createSmsLogId_();


  sheet.appendRow([

    smsId,

    new Date(),

    patientId || "",

    phone || "",

    messageType || "",

    messageText || "",

    providerMessageId || "",

    deliveryStatus || ""

  ]);


  SpreadsheetApp.flush();


  return smsId;
}


/********************************************************
 * EXTRACT ARKESEL MESSAGE ID
 ********************************************************/

function getArkeselSmsMessageId_(
  responseJson
) {

  if (
    !responseJson ||
    !responseJson.data
  ) {

    return "";
  }


  const data =
    responseJson.data;


  if (
    Array.isArray(
      data
    )
  ) {

    if (
      data.length > 0
    ) {

      return String(

        data[0].id ||

        data[0].message_id ||

        data[0].messageId ||

        ""

      );
    }


    return "";
  }


  return String(

    data.id ||

    data.message_id ||

    data.messageId ||

    ""

  );
}


/********************************************************
 * SEND SMS THROUGH ARKESEL
 ********************************************************/

function sendArkeselSms_(
  phone,
  message,
  patientId,
  messageType
) {

  const recipient =
    normalizeSmsPhone_(
      phone
    );


  const cleanMessage =
    String(
      message || ""
    ).trim();


  if (!cleanMessage) {

    throw new Error(
      "SMS message cannot be empty."
    );
  }


  if (
    !isApprovedDemoPatient_(
      patientId
    )
  ) {

    throw new Error(
      "DEMO SAFETY: Automated SMS is restricted to approved test patients."
    );
  }


  const apiKey =
    getArkeselSmsApiKey_();


  const payload = {

    sender:
      SMS_CONFIG.SENDER_ID,

    message:
      cleanMessage,

    recipients: [
      recipient
    ]

  };


  const options = {

    method:
      "post",

    contentType:
      "application/json",

    headers: {

      "api-key":
        apiKey

    },

    payload:
      JSON.stringify(
        payload
      ),

    muteHttpExceptions:
      true

  };


  let response;
  let responseCode;
  let responseText;


  try {

    response =
      UrlFetchApp.fetch(

        SMS_CONFIG.ARKESEL_ENDPOINT,

        options

      );


    responseCode =
      response.getResponseCode();


    responseText =
      response.getContentText();

  }

  catch (error) {

    const failedSmsId =
      logSms_(

        patientId,

        recipient,

        messageType,

        cleanMessage,

        "",

        "FAILED"

      );


    throw new Error(

      "Arkesel SMS request failed: " +
      error.message +
      ". SMS Log: " +
      failedSmsId

    );
  }


  Logger.log(
    "Arkesel SMS HTTP Code: " +
    responseCode
  );


  Logger.log(
    "Arkesel SMS Response: " +
    responseText
  );


  let responseJson = {};


  try {

    responseJson =
      JSON.parse(
        responseText
      );

  }

  catch (error) {

    responseJson = {};
  }


  const providerStatus =
    String(
      responseJson.status || ""
    )
      .trim()
      .toLowerCase();


  const providerMessageId =
    getArkeselSmsMessageId_(
      responseJson
    );


  const successful =
    responseCode >= 200 &&
    responseCode < 300 &&
    (
      providerStatus ===
        "success" ||
      providerStatus === ""
    );


  if (
    successful
  ) {

    const smsId =
      logSms_(

        patientId,

        recipient,

        messageType,

        cleanMessage,

        providerMessageId,

        "SUBMITTED"

      );


    return {

      success:
        true,

      smsId:
        smsId,

      patientId:
        patientId,

      phone:
        recipient,

      sender:
        SMS_CONFIG.SENDER_ID,

      providerMessageId:
        providerMessageId,

      providerStatus:
        providerStatus ||
        "success",

      responseCode:
        responseCode,

      response:
        responseJson

    };
  }


  const failedSmsId =
    logSms_(

      patientId,

      recipient,

      messageType,

      cleanMessage,

      providerMessageId,

      "FAILED"

    );


  throw new Error(

    "Arkesel SMS API returned HTTP " +
    responseCode +
    ". Response: " +
    responseText +
    ". SMS Log: " +
    failedSmsId

  );
}


/********************************************************
 * PROFESSIONAL REFILL SMS
 ********************************************************/

function buildRefillSmsMessage_(
  context
) {

  const confirmationUrl =
    buildRefillConfirmationUrl_(
      context.refillId
    );


  if (
    context.reminderStatus ===
    "Due Soon"
  ) {

    return (

      "Dr. Evans Pharmacy: " +

      "A refill is due soon. " +

      "Please review and confirm securely: " +

      confirmationUrl +

      " Automated message. Please do not reply."

    );
  }


  if (
    context.reminderStatus ===
    "Due Today"
  ) {

    return (

      "Dr. Evans Pharmacy: " +

      "A refill is due today. " +

      "Please review and confirm securely: " +

      confirmationUrl +

      " Automated message. Please do not reply."

    );
  }


  if (
    context.reminderStatus ===
    "Overdue"
  ) {

    return (

      "Dr. Evans Pharmacy: " +

      "A refill is overdue. " +

      "Please review and confirm securely: " +

      confirmationUrl +

      " Automated message. Please do not reply."

    );
  }


  throw new Error(
    "Unsupported refill status for SMS."
  );
}


/********************************************************
 * CHECK DUPLICATE REFILL SMS
 ********************************************************/

function hasRefillSmsBeenSent_(
  refillId,
  reminderStatus
) {

  const messageType =
    "Refill Reminder - " +
    String(
      refillId || ""
    ).trim() +
    " - " +
    String(
      reminderStatus || ""
    ).trim();


  const rows =
    tableRows_(
      "SMS_Log"
    );


  return rows.some(
    row => {

      const existingType =
        String(
          row.Message_Type || ""
        ).trim();


      const deliveryStatus =
        String(
          row.Delivery_Status || ""
        )
          .trim()
          .toUpperCase();


      return (

        existingType ===
          messageType &&

        deliveryStatus !==
          "FAILED" &&

        deliveryStatus !==
          ""

      );

    }
  );
}


/********************************************************
 * SEND REFILL SMS
 ********************************************************/

function sendRefillSms_(
  refillId,
  force
) {

  const context =
    getRefillMessageContext_(
      refillId
    );


  const status =
    context.reminderStatus;


  if (
    status !== "Due Soon" &&
    status !== "Due Today" &&
    status !== "Overdue"
  ) {

    throw new Error(
      "This refill is not eligible for SMS."
    );
  }


  if (
    !isApprovedDemoPatient_(
      context.patientId
    )
  ) {

    throw new Error(
      "DEMO SAFETY: " +
      context.patientId +
      " is not an approved SMS test patient."
    );
  }


  const messageType =
    "Refill Reminder - " +
    context.refillId +
    " - " +
    status;


  if (
    force !== true &&
    hasRefillSmsBeenSent_(
      context.refillId,
      status
    )
  ) {

    throw new Error(
      "A refill SMS has already been submitted for this refill stage."
    );
  }


  const message =
    buildRefillSmsMessage_(
      context
    );


  const result =
    sendArkeselSms_(

      context.phone,

      message,

      context.patientId,

      messageType

    );


  logAudit_({

    userType:
      "System",

    userId:
      context.patientId,

    action:
      "SMS REFILL REMINDER SENT",

    recordType:
      "Refill",

    recordId:
      context.refillId,

    details:
      "SMS reminder submitted. " +
      "Status: " +
      status +
      ". SMS Log: " +
      result.smsId +
      "."

  });


  return result;
}


/********************************************************
 * CHECK IF REFILL ALREADY CONFIRMED
 ********************************************************/

function messagingRefillIsConfirmed_(
  context
) {

  const confirmationStatus =
    String(
      context.refill.Confirmation_Status || ""
    )
      .trim()
      .toLowerCase();


  const patientResponse =
    String(
      context.refill.Patient_Response || ""
    )
      .trim()
      .toLowerCase();


  const orderId =
    String(
      context.refill.Generated_Order_ID || ""
    ).trim();


  return (

    confirmationStatus ===
      "confirmed" ||

    patientResponse ===
      "confirmed" ||

    Boolean(
      orderId
    )

  );
}


/********************************************************
 * SEND PATIENT REMINDER BY
 * PREFERRED CONTACT METHOD
 ********************************************************/

function sendPatientPreferredReminder_(
  context
) {

  const preferredContact =
    normalizePreferredContact_(
      context.preferredContact
    );


  const result = {

    preferredContact:
      preferredContact,

    sent:
      false,

    emailSent:
      false,

    smsSent:
      false,

    voiceSent:
      false,

    manualWhatsApp:
      false,

    referenceId:
      ""

  };


  /*****************************************************
   * EMAIL
   *****************************************************/

  if (
    preferredContact ===
    "Email"
  ) {

    result.emailSent =
      sendPatientRefillEmail_(
        context
      );


    result.sent =
      result.emailSent;


    return result;
  }


  /*****************************************************
   * SMS
   *****************************************************/

  if (
    preferredContact ===
    "SMS"
  ) {

    if (
      !isApprovedDemoPatient_(
        context.patientId
      )
    ) {

      result.referenceId =
        "DEMO SAFETY SKIP";

      return result;
    }


    const smsResult =
      sendRefillSms_(

        context.refillId,

        false

      );


    result.smsSent =
      smsResult.success === true;


    result.sent =
      result.smsSent;


    result.referenceId =
      smsResult.smsId || "";


    return result;
  }


  /*****************************************************
   * VOICE
   *****************************************************/

  if (
    preferredContact ===
    "Voice"
  ) {

    if (
      !isApprovedDemoPatient_(
        context.patientId
      )
    ) {

      result.referenceId =
        "DEMO SAFETY SKIP";

      return result;
    }


    const voiceResult =
      sendVoiceReminderForRefill_(

        context.refillId,

        false

      );


    result.voiceSent =
      voiceResult.success === true;


    result.sent =
      result.voiceSent;


    result.referenceId =
      voiceResult.callId || "";


    return result;
  }


  /*****************************************************
   * WHATSAPP
   *
   * For now this remains manual
   * through the Contact Patient page.
   *****************************************************/

  if (
    preferredContact ===
    "WhatsApp"
  ) {

    result.manualWhatsApp =
      true;


    result.referenceId =
      "CONTACT PATIENT CENTRE";


    return result;
  }


  return result;
}


/********************************************************
 * UPDATE REFILL REMINDER TRACKING
 ********************************************************/

function markRefillReminderSent_(
  refillId,
  status
) {

  const refill =
    findRecord_(

      "Refills",

      "Refill_ID",

      refillId

    );


  if (!refill) {

    throw new Error(
      "Refill " +
      refillId +
      " was not found."
    );
  }


  const sheet =
    sheet_(
      "Refills"
    );


  const map =
    headerMap_(
      "Refills"
    );


  sheet
    .getRange(
      refill._row,
      map.Reminder_Sent
    )
    .setValue(
      status
    );


  sheet
    .getRange(
      refill._row,
      map.Reminder_Sent_Date
    )
    .setValue(
      new Date()
    );


  SpreadsheetApp.flush();


  return true;
}


/********************************************************
 * PROCESS ONE REFILL REMINDER
 *
 * MAIN ROUTING ENGINE
 ********************************************************/

function sendRefillReminderForRecord_(
  refillId,
  ignoreDuplicateCheck
) {

  const context =
    getRefillMessageContext_(
      refillId
    );


  const status =
    context.reminderStatus;


  /*****************************************************
   * SKIP CONFIRMED REFILLS
   *****************************************************/

  if (
    messagingRefillIsConfirmed_(
      context
    )
  ) {

    return {

      refillId:
        context.refillId,

      patientId:
        context.patientId,

      status:
        status,

      skipped:
        true,

      reason:
        "Refill already confirmed"

    };
  }


  /*****************************************************
   * NOT DUE YET
   *****************************************************/

  if (
    status ===
    "Not Due Yet"
  ) {

    return {

      refillId:
        context.refillId,

      patientId:
        context.patientId,

      status:
        status,

      skipped:
        true,

      reason:
        "Not Due Yet"

    };
  }


  /*****************************************************
   * VALID STATUS
   *****************************************************/

  if (
    status !== "Due Soon" &&
    status !== "Due Today" &&
    status !== "Overdue"
  ) {

    return {

      refillId:
        context.refillId,

      patientId:
        context.patientId,

      status:
        status,

      skipped:
        true,

      reason:
        "Unsupported refill status"

    };
  }


  /*****************************************************
   * DUPLICATE STAGE CHECK
   *****************************************************/

  const previouslySent =
    String(
      context.refill.Reminder_Sent || ""
    ).trim();


  if (
    ignoreDuplicateCheck !== true &&
    previouslySent === status
  ) {

    return {

      refillId:
        context.refillId,

      patientId:
        context.patientId,

      status:
        status,

      skipped:
        true,

      reason:
        "Reminder already sent for this stage"

    };
  }


  /*****************************************************
   * PATIENT PREFERRED CHANNEL
   *****************************************************/

  let patientResult;


  try {

    patientResult =
      sendPatientPreferredReminder_(
        context
      );

  }

  catch (error) {

    patientResult = {

      preferredContact:
        normalizePreferredContact_(
          context.preferredContact
        ),

      sent:
        false,

      emailSent:
        false,

      smsSent:
        false,

      voiceSent:
        false,

      manualWhatsApp:
        false,

      referenceId:
        "",

      error:
        error.message

    };
  }


  /*****************************************************
   * DOCTOR ALERT
   *****************************************************/

  let doctorSent =
    false;


  try {

    doctorSent =
      sendDoctorRefillEmail_(
        context
      );

  }

  catch (error) {

    Logger.log(
      "Doctor email failed for " +
      context.refillId +
      ": " +
      error.message
    );
  }


  /*****************************************************
   * MARK REMINDER STAGE
   *
   * Mark complete when:
   *
   * 1. Patient automated contact succeeded
   *
   * OR
   *
   * 2. WhatsApp is the preferred method
   *    and doctor received the manual
   *    Contact Patient alert.
   *****************************************************/

  const stageCompleted =
    patientResult.sent === true ||
    (
      patientResult.manualWhatsApp ===
        true &&
      doctorSent ===
        true
    );


  if (
    stageCompleted
  ) {

    markRefillReminderSent_(

      context.refillId,

      status

    );
  }


  /*****************************************************
   * AUDIT
   *****************************************************/

  logAudit_({

    userType:
      "System",

    userId:
      "SYSTEM",

    action:
      "REFILL REMINDER PROCESSED",

    recordType:
      "Refill",

    recordId:
      context.refillId,

    details:
      "Status: " +
      status +
      ". Preferred contact: " +
      patientResult.preferredContact +
      ". Patient sent: " +
      patientResult.sent +
      ". Patient reference: " +
      (
        patientResult.referenceId ||
        "None"
      ) +
      ". Doctor email: " +
      doctorSent +
      ". Stage completed: " +
      stageCompleted +
      (
        patientResult.error
          ? ". Patient channel error: " +
            patientResult.error
          : ""
      ) +
      "."

  });


  return {

    refillId:
      context.refillId,

    patientId:
      context.patientId,

    patientName:
      context.patientName,

    status:
      status,

    preferredContact:
      patientResult.preferredContact,

    patientReminderSent:
      patientResult.sent,

    patientEmailSent:
      patientResult.emailSent,

    patientSmsSent:
      patientResult.smsSent,

    patientVoiceSent:
      patientResult.voiceSent,

    manualWhatsAppRequired:
      patientResult.manualWhatsApp,

    patientReferenceId:
      patientResult.referenceId,

    patientChannelError:
      patientResult.error || "",

    doctorEmailSent:
      doctorSent,

    reminderStageCompleted:
      stageCompleted,

    skipped:
      false

  };
}


/********************************************************
 * SEND ALL REFILL REMINDERS
 *
 * DEMO SAFETY:
 *
 * Email may be processed normally.
 *
 * SMS and Voice are blocked for patients
 * outside P001 / P011 while demo mode is ON.
 ********************************************************/

function sendRefillReminders() {

  refreshRefillStatuses();


  const refills =
    tableRows_(
      "Refills"
    );


  const results = [];


  refills.forEach(
    refill => {

      const status =
        String(
          refill.Reminder_Status || ""
        ).trim();


      if (
        status === "Due Soon" ||
        status === "Due Today" ||
        status === "Overdue"
      ) {

        try {

          results.push(

            sendRefillReminderForRecord_(

              refill.Refill_ID,

              false

            )

          );

        }

        catch (error) {

          results.push({

            refillId:
              refill.Refill_ID,

            error:
              error.message

          });
        }
      }

    }
  );


  Logger.log(
    JSON.stringify(
      results,
      null,
      2
    )
  );


  return results;
}


/********************************************************
 * SAFE READINESS TEST
 *
 * DOES NOT SEND ANY MESSAGE.
 ********************************************************/

function testPreferredContactReadiness() {

  refreshRefillStatuses();


  const refillId =
    "R001";


  const context =
    getRefillMessageContext_(
      refillId
    );


  const result = {

    refillId:
      context.refillId,

    patientId:
      context.patientId,

    patientName:
      context.patientName,

    status:
      context.reminderStatus,

    preferredContact:
      normalizePreferredContact_(
        context.preferredContact
      ),

    confirmed:
      messagingRefillIsConfirmed_(
        context
      ),

    demoApproved:
      isApprovedDemoPatient_(
        context.patientId
      ),

    phoneExists:
      Boolean(
        context.phone
      ),

    emailValid:
      validEmail_(
        context.patientEmail
      )

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
 * TEST ONE REAL PREFERRED-CONTACT REMINDER
 *
 * R001 -> P001
 *
 * THIS MAY SEND A REAL EMAIL, SMS OR VOICE CALL
 * DEPENDING ON P001 Preferred_Contact.
 ********************************************************/

function testPreferredContactReminderR001() {

  refreshRefillStatuses();


  const context =
    getRefillMessageContext_(
      "R001"
    );


  if (
    context.patientId !==
    "P001"
  ) {

    throw new Error(
      "Safety check failed. R001 is not linked to P001."
    );
  }


  if (
    !isApprovedDemoPatient_(
      context.patientId
    )
  ) {

    throw new Error(
      "P001 is not approved for demo messaging."
    );
  }


  const result =
    sendRefillReminderForRecord_(

      "R001",

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
 * EXISTING SINGLE REFILL TEST
 ********************************************************/

function testSingleRefillReminder(
  refillId
) {

  refreshRefillStatuses();


  const result =
    sendRefillReminderForRecord_(

      refillId,

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
 * EXISTING R003 TEST
 ********************************************************/

function runSingleRefillTest() {

  return testSingleRefillReminder(
    "R003"
  );
}