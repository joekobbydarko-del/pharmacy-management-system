/**
 * DR. EVANS PHARMACY
 * REFILL ENGINE
 *
 * Handles:
 * - Refill status calculation
 * - Refill validation
 * - Patient refill confirmation
 * - Order/invoice creation flow
 * - Voice reminder integration
 */

const REFILL_RULES = {

  DUE_SOON_DAYS:
    7,

  /**
   * Voice reminders are allowed
   * for these refill statuses.
   */
  VOICE_ELIGIBLE_STATUSES: [
    "Due Soon",
    "Due Today",
    "Overdue"
  ]
};


/**
 * REFRESH ALL REFILL STATUSES
 */
function refreshRefillStatuses() {

  const sheet =
    sheet_("Refills");

  const map =
    headerMap_("Refills");

  const refills =
    tableRows_("Refills");

  let overdue = 0;
  let dueToday = 0;
  let dueSoon = 0;
  let notDueYet = 0;


  refills.forEach(refill => {

    const status =
      calculateRefillStatus_(
        refill.Next_Refill_Date
      );


    sheet
      .getRange(
        refill._row,
        map.Reminder_Status
      )
      .setValue(status);


    if (
      status ===
      "Overdue"
    ) {

      overdue++;
    }


    if (
      status ===
      "Due Today"
    ) {

      dueToday++;
    }


    if (
      status ===
      "Due Soon"
    ) {

      dueSoon++;
    }


    if (
      status ===
      "Not Due Yet"
    ) {

      notDueYet++;
    }

  });


  SpreadsheetApp.flush();


  const result = {

    overdue:
      overdue,

    dueToday:
      dueToday,

    dueSoon:
      dueSoon,

    notDueYet:
      notDueYet
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
 * CALCULATE REFILL STATUS
 */
function calculateRefillStatus_(
  nextRefillDate
) {

  const refillDay =
    dateSerial_(
      nextRefillDate
    );


  const today =
    dateSerial_(
      new Date()
    );


  if (
    refillDay === null
  ) {

    throw new Error(
      "Invalid Next_Refill_Date found."
    );
  }


  const difference =
    Math.round(
      (
        refillDay -
        today
      ) /
      86400000
    );


  if (
    difference < 0
  ) {

    return "Overdue";
  }


  if (
    difference === 0
  ) {

    return "Due Today";
  }


  if (
    difference <=
    REFILL_RULES.DUE_SOON_DAYS
  ) {

    return "Due Soon";
  }


  return "Not Due Yet";
}


/**
 * CONVERT DATE TO DAY SERIAL
 */
function dateSerial_(
  value
) {

  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {

    return null;
  }


  let year;
  let month;
  let day;


  if (
    Object.prototype.toString.call(
      value
    ) === "[object Date]" &&
    !isNaN(
      value.getTime()
    )
  ) {

    const formatted =
      Utilities.formatDate(
        value,
        CONFIG.TIMEZONE,
        "yyyy-MM-dd"
      );


    const parts =
      formatted.split("-");


    year =
      Number(
        parts[0]
      );


    month =
      Number(
        parts[1]
      );


    day =
      Number(
        parts[2]
      );
  }

  else {

    const text =
      String(
        value
      ).trim();


    let match =
      text.match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
      );


    if (
      match
    ) {

      day =
        Number(
          match[1]
        );


      month =
        Number(
          match[2]
        );


      year =
        Number(
          match[3]
        );

    }

    else {

      match =
        text.match(
          /^(\d{4})-(\d{1,2})-(\d{1,2})$/
        );


      if (
        !match
      ) {

        return null;
      }


      year =
        Number(
          match[1]
        );


      month =
        Number(
          match[2]
        );


      day =
        Number(
          match[3]
        );
    }
  }


  if (
    !year ||
    !month ||
    !day
  ) {

    return null;
  }


  return Date.UTC(
    year,
    month - 1,
    day
  );
}


/**
 * VALIDATE REFILL DATA
 */
function checkRefillData() {

  const refills =
    tableRows_(
      "Refills"
    );


  const patients =
    tableRows_(
      "Patients"
    );


  const drugs =
    tableRows_(
      "Drugs"
    );


  const patientIds =
    new Set(
      patients.map(
        patient =>
          String(
            patient.Patient_ID
          ).trim()
      )
    );


  const drugIds =
    new Set(
      drugs.map(
        drug =>
          String(
            drug.Drug_ID
          ).trim()
      )
    );


  const problems = [];


  refills.forEach(
    refill => {

      const refillId =
        String(
          refill.Refill_ID
        ).trim();


      const patientId =
        String(
          refill.Patient_ID
        ).trim();


      const drugId =
        String(
          refill.Drug_ID
        ).trim();


      if (
        !patientIds.has(
          patientId
        )
      ) {

        problems.push(
          refillId +
          ": Patient " +
          patientId +
          " was not found."
        );
      }


      if (
        !drugIds.has(
          drugId
        )
      ) {

        problems.push(
          refillId +
          ": Drug " +
          drugId +
          " was not found."
        );
      }


      if (
        dateSerial_(
          refill.Next_Refill_Date
        ) === null
      ) {

        problems.push(
          refillId +
          ": Invalid Next_Refill_Date."
        );
      }

    }
  );


  if (
    problems.length > 0
  ) {

    throw new Error(
      problems.join(
        "\n"
      )
    );
  }


  const result = {

    refillsChecked:
      refills.length,

    patientsLinked:
      true,

    drugsLinked:
      true,

    datesValid:
      true
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
 * PROCESS PATIENT REFILL CONFIRMATION
 *
 * Workflow:
 * 1. Verify secure token
 * 2. Find refill
 * 3. Create/reuse order
 * 4. Create/reuse invoice
 * 5. Mark refill confirmed
 * 6. Create payment link
 */
function processRefillConfirmation_(
  refillId,
  token
) {

  const cleanRefillId =
    String(
      refillId || ""
    ).trim();


  if (
    !cleanRefillId
  ) {

    throw new Error(
      "Refill ID is missing."
    );
  }


  const validToken =
    verifyToken_(
      "REFILL:" +
      cleanRefillId,
      token
    );


  if (
    !validToken
  ) {

    throw new Error(
      "This refill confirmation link is invalid."
    );
  }


  const refill =
    findRecord_(
      "Refills",
      "Refill_ID",
      cleanRefillId
    );


  if (
    !refill
  ) {

    throw new Error(
      "The refill record could not be found."
    );
  }


  const patient =
    findRecord_(
      "Patients",
      "Patient_ID",
      refill.Patient_ID
    );


  if (
    !patient
  ) {

    throw new Error(
      "The patient record could not be found."
    );
  }


  /**
   * CREATE OR REUSE ORDER
   */
  const orderResult =
    createOrderFromRefill_(
      cleanRefillId
    );


  const orderId =
    orderResult.orderId;


  /**
   * CREATE OR REUSE INVOICE
   */
  const invoiceResult =
    createInvoiceForOrder_(
      orderId
    );


  /**
   * MARK REFILL CONFIRMED
   *
   * Only after order +
   * invoice succeed.
   */
  markRefillConfirmed_(
    cleanRefillId,
    orderId
  );


  /**
   * PAYMENT LINK
   */
  const paymentToken =
    createToken_(
      "PAYMENT:" +
      orderId
    );


  const paymentLink =
    buildPublicUrl_(
      "payment",
      {

        orderId:
          orderId,

        token:
          paymentToken
      }
    );


  const result = {

    refillId:
      cleanRefillId,

    patientId:
      patient.Patient_ID,

    patientName:
      patient.Full_Name,

    orderId:
      orderId,

    orderCreated:
      orderResult.created,

    invoiceId:
      invoiceResult.invoiceId,

    invoiceAmount:
      Number(
        invoiceResult.amount || 0
      ),

    invoiceLink:
      invoiceResult.invoiceLink ||
      getInvoice_(
        invoiceResult.invoiceId
      ).Invoice_Link,

    paymentLink:
      paymentLink,

    confirmed:
      true
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
 * MARK REFILL AS CONFIRMED
 */
function markRefillConfirmed_(
  refillId,
  orderId
) {

  const refill =
    findRecord_(
      "Refills",
      "Refill_ID",
      refillId
    );


  if (
    !refill
  ) {

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
      map.Patient_Response
    )
    .setValue(
      "Confirmed"
    );


  sheet
    .getRange(
      refill._row,
      map.Confirmation_Date
    )
    .setValue(
      new Date()
    );


  sheet
    .getRange(
      refill._row,
      map.Confirmation_Status
    )
    .setValue(
      CONFIG.STATUS.CONFIRMED
    );


  sheet
    .getRange(
      refill._row,
      map.Generated_Order_ID
    )
    .setValue(
      orderId
    );


  SpreadsheetApp.flush();


  logAudit_({

    userType:
      "Patient",

    userId:
      refill.Patient_ID,

    action:
      "REFILL CONFIRMED",

    recordType:
      "Refill",

    recordId:
      refillId,

    details:
      "Refill confirmed and linked to order " +
      orderId +
      "."

  });


  return true;
}


/********************************************************
 * VOICE REMINDER SECTION
 ********************************************************/


/**
 * CHECK IF REFILL IS ALREADY CONFIRMED
 */
function isRefillConfirmed_(
  refill
) {

  if (
    !refill
  ) {

    return false;
  }


  const confirmationStatus =
    String(
      refill.Confirmation_Status || ""
    )
      .trim()
      .toLowerCase();


  const patientResponse =
    String(
      refill.Patient_Response || ""
    )
      .trim()
      .toLowerCase();


  const generatedOrderId =
    String(
      refill.Generated_Order_ID || ""
    ).trim();


  if (
    confirmationStatus ===
    "confirmed"
  ) {

    return true;
  }


  if (
    patientResponse ===
    "confirmed"
  ) {

    return true;
  }


  if (
    generatedOrderId
  ) {

    return true;
  }


  return false;
}


/**
 * BUILD UNIQUE CALL TYPE
 *
 * Example:
 *
 * Refill Reminder - R005
 *
 * This allows Call_Log to identify
 * which refill received the call.
 */
function buildRefillVoiceCallType_(
  refillId
) {

  return (
    "Refill Reminder - " +
    String(
      refillId
    ).trim()
  );
}


/**
 * CHECK IF VOICE REMINDER HAS
 * ALREADY BEEN SENT FOR REFILL
 *
 * Prevents duplicate calls.
 */
function hasVoiceReminderBeenSent_(
  refillId
) {

  const cleanRefillId =
    String(
      refillId || ""
    ).trim();


  if (
    !cleanRefillId
  ) {

    return false;
  }


  const callType =
    buildRefillVoiceCallType_(
      cleanRefillId
    );


  const calls =
    tableRows_(
      "Call_Log"
    );


  return calls.some(
    call => {

      const existingCallType =
        String(
          call.Call_Type || ""
        ).trim();


      const status =
        String(
          call.Call_Status || ""
        )
          .trim()
          .toUpperCase();


      /**
       * FAILED attempts do not block
       * another retry.
       */
      const successfulSubmission =
        status !== "FAILED" &&
        status !== "";


      return (
        existingCallType ===
          callType &&
        successfulSubmission
      );
    }
  );
}


/**
 * CHECK WHETHER REFILL STATUS
 * IS ELIGIBLE FOR VOICE REMINDER
 */
function isVoiceReminderStatusEligible_(
  status
) {

  const cleanStatus =
    String(
      status || ""
    ).trim();


  return (
    REFILL_RULES
      .VOICE_ELIGIBLE_STATUSES
      .indexOf(
        cleanStatus
      ) !== -1
  );
}


/**
 * SEND ONE REFILL VOICE REMINDER
 *
 * Used by the refill engine.
 *
 * force = false:
 * prevents duplicate reminders.
 *
 * force = true:
 * allows an intentional resend.
 */
function sendVoiceReminderForRefill_(
  refillId,
  force
) {

  const cleanRefillId =
    String(
      refillId || ""
    ).trim();


  if (
    !cleanRefillId
  ) {

    throw new Error(
      "Refill ID is missing."
    );
  }


  const refill =
    findRecord_(
      "Refills",
      "Refill_ID",
      cleanRefillId
    );


  if (
    !refill
  ) {

    throw new Error(
      "Refill " +
      cleanRefillId +
      " was not found."
    );
  }


  /**
   * DO NOT CALL CONFIRMED REFILLS
   */
  if (
    isRefillConfirmed_(
      refill
    )
  ) {

    throw new Error(
      "Refill " +
      cleanRefillId +
      " is already confirmed. " +
      "No voice reminder will be sent."
    );
  }


  /**
   * CALCULATE CURRENT STATUS
   *
   * We calculate directly from the
   * date so the decision does not rely
   * on an old sheet value.
   */
  const currentStatus =
    calculateRefillStatus_(
      refill.Next_Refill_Date
    );


  if (
    !isVoiceReminderStatusEligible_(
      currentStatus
    )
  ) {

    throw new Error(
      "Refill " +
      cleanRefillId +
      " is currently '" +
      currentStatus +
      "'. Voice reminders are only " +
      "sent for Due Soon, Due Today, " +
      "or Overdue refills."
    );
  }


  /**
   * PREVENT DUPLICATE CALL
   */
  const allowForce =
    force === true;


  if (
    !allowForce &&
    hasVoiceReminderBeenSent_(
      cleanRefillId
    )
  ) {

    throw new Error(
      "A voice reminder has already " +
      "been submitted for refill " +
      cleanRefillId +
      "."
    );
  }


  /**
   * FIND PATIENT
   */
  const patient =
    findRecord_(
      "Patients",
      "Patient_ID",
      refill.Patient_ID
    );


  if (
    !patient
  ) {

    throw new Error(
      "Patient " +
      refill.Patient_ID +
      " was not found."
    );
  }


  /**
   * GET PHONE
   */
  const phone =
    String(
      patient.Phone || ""
    ).trim();


  if (
    !phone
  ) {

    throw new Error(
      "Patient " +
      patient.Patient_ID +
      " does not have a phone number."
    );
  }


  const preferredContact =
    String(
      patient.Preferred_Contact ||
      "Voice"
    ).trim();


  const callType =
    buildRefillVoiceCallType_(
      cleanRefillId
    );


  /**
   * SEND THROUGH Voice.gs
   */
  const voiceResult =
    sendArkeselVoiceCall_(

      phone,

      patient.Patient_ID,

      preferredContact,

      callType
    );


  /**
   * AUDIT LOG
   */
  logAudit_({

    userType:
      "System",

    userId:
      patient.Patient_ID,

    action:
      "VOICE REFILL REMINDER SENT",

    recordType:
      "Refill",

    recordId:
      cleanRefillId,

    details:
      "Voice reminder submitted for " +
      currentStatus +
      " refill. Call Log: " +
      voiceResult.callId +
      ". Campaign ID: " +
      (
        voiceResult.campaignId ||
        "Not returned"
      ) +
      "."

  });


  const result = {

    success:
      true,

    refillId:
      cleanRefillId,

    refillStatus:
      currentStatus,

    patientId:
      patient.Patient_ID,

    patientName:
      patient.Full_Name,

    phone:
      voiceResult.phone,

    callId:
      voiceResult.callId,

    campaignId:
      voiceResult.campaignId,

    providerStatus:
      voiceResult.providerStatus

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
 * CHECK WHETHER A REFILL IS READY
 * FOR A VOICE REMINDER
 *
 * DOES NOT MAKE A CALL.
 */
function checkVoiceReminderReadiness_(
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


  if (
    !refill
  ) {

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


  if (
    !patient
  ) {

    throw new Error(
      "Patient record was not found."
    );
  }


  const status =
    calculateRefillStatus_(
      refill.Next_Refill_Date
    );


  const confirmed =
    isRefillConfirmed_(
      refill
    );


  const duplicate =
    hasVoiceReminderBeenSent_(
      cleanRefillId
    );


  const phoneExists =
    Boolean(
      String(
        patient.Phone || ""
      ).trim()
    );


  const statusEligible =
    isVoiceReminderStatusEligible_(
      status
    );


  const ready =
    statusEligible &&
    !confirmed &&
    !duplicate &&
    phoneExists;


  return {

    refillId:
      cleanRefillId,

    patientId:
      patient.Patient_ID,

    patientName:
      patient.Full_Name,

    status:
      status,

    confirmed:
      confirmed,

    phoneExists:
      phoneExists,

    alreadyCalled:
      duplicate,

    readyForVoiceReminder:
      ready

  };
}


/**
 * TEST ONE REAL REFILL
 *
 * STEP 1:
 *
 * Put an UNCONFIRMED Due Soon,
 * Due Today, or Overdue Refill_ID
 * below.
 *
 * Example:
 * R010
 *
 * Do NOT use R003 because R003
 * has already been confirmed.
 *
 * This function WILL place a real call.
 */
function testSingleRefillVoiceReminder() {

  const refillId =
    "R001";


  if (
    refillId ===
    "ENTER_REFILL_ID_HERE"
  ) {

    throw new Error(
      "Enter one unconfirmed refill ID " +
      "inside testSingleRefillVoiceReminder()."
    );
  }


  /**
   * CHECK FIRST
   */
  const readiness =
    checkVoiceReminderReadiness_(
      refillId
    );


  Logger.log(
    "VOICE REMINDER READINESS:"
  );


  Logger.log(
    JSON.stringify(
      readiness,
      null,
      2
    )
  );


  if (
    !readiness.readyForVoiceReminder
  ) {

    throw new Error(
      "This refill is not ready for a voice reminder. " +
      "Check the execution log for details."
    );
  }


  /**
   * SEND REAL CALL
   */
  const result =
    sendVoiceReminderForRefill_(
      refillId,
      false
    );


  Logger.log(
    "VOICE REMINDER RESULT:"
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
 * SAFE VOICE READINESS TEST
 *
 * DOES NOT PLACE ANY CALL.
 *
 * Put a refill ID below and run
 * this first if you want to check it.
 */
function testVoiceReminderReadiness() {

  const refillId =
    "R001";


  if (
    refillId ===
    "ENTER_REFILL_ID_HERE"
  ) {

    throw new Error(
      "Enter a refill ID inside " +
      "testVoiceReminderReadiness()."
    );
  }


  const result =
    checkVoiceReminderReadiness_(
      refillId
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
 * SAFE CONFIRMATION READINESS TEST
 *
 * This does NOT:
 * - create an order
 * - create an invoice
 * - confirm the refill
 *
 * It only checks the secure token
 * and linked data.
 */
function testRefillConfirmationReadiness() {

  const refillId =
    "R003";


  const token =
    createToken_(
      "REFILL:" +
      refillId
    );


  const tokenValid =
    verifyToken_(
      "REFILL:" +
      refillId,
      token
    );


  const refill =
    findRecord_(
      "Refills",
      "Refill_ID",
      refillId
    );


  if (
    !refill
  ) {

    throw new Error(
      "R003 was not found."
    );
  }


  const patient =
    findRecord_(
      "Patients",
      "Patient_ID",
      refill.Patient_ID
    );


  if (
    !patient
  ) {

    throw new Error(
      "Patient was not found."
    );
  }


  const result = {

    refillId:
      refillId,

    patientId:
      patient.Patient_ID,

    tokenValid:
      tokenValid,

    confirmationStatus:
      refill.Confirmation_Status,

    existingOrderId:
      refill.Generated_Order_ID || ""

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
 * REFILL ENGINE TEST
 */
function testRefillEngine() {

  checkRefillData();


  const result =
    refreshRefillStatuses();


  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;
}