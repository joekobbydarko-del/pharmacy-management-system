/**
 * DR. EVANS PHARMACY
 * REFILL ENGINE
 *
 * Handles:
 * - Refill status calculation
 * - Refill validation
 * - Patient refill confirmation
 * - Missed / expired refill review
 * - Refill rescheduling
 * - Patient cancellation
 * - Clinical decline
 * - Order / invoice creation flow
 * - Voice reminder integration
 */


/* =========================================================
   REFILL RULES
   ========================================================= */

const REFILL_RULES = {
  DUE_SOON_DAYS: 7,

  OVERDUE_MAX_DAYS: 7,

  VOICE_ELIGIBLE_STATUSES: [
    "Due Soon",
    "Due Today",
    "Overdue",
  ],
};


/* =========================================================
   EXTRA REFILL WORKFLOW COLUMNS
   ========================================================= */

const REFILL_WORKFLOW_COLUMNS = [
  "Generated_Order_ID",
  "Resolution_Status",
  "Resolution_Reason",
  "Review_Note",
  "Reviewed_By",
  "Reviewed_At",
  "Previous_Refill_Date",
];


/* =========================================================
   ENSURE EXTRA COLUMNS EXIST
   ========================================================= */

function ensureRefillWorkflowColumns_() {
  const refillSheet =
    sheet_("Refills");

  const lastColumn =
    Math.max(
      refillSheet.getLastColumn(),
      1
    );

  const headers =
    refillSheet
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

  let nextColumn =
    headers.length + 1;

  let changed =
    false;


  REFILL_WORKFLOW_COLUMNS.forEach(
    header => {
      if (
        headers.indexOf(
          header
        ) !== -1
      ) {
        return;
      }


      refillSheet
        .getRange(
          1,
          nextColumn
        )
        .setValue(
          header
        );


      headers.push(
        header
      );


      nextColumn++;

      changed =
        true;
    }
  );


  if (
    changed
  ) {
    SpreadsheetApp.flush();
  }


  return headerMap_(
    "Refills"
  );
}


/* =========================================================
   CHECK WHETHER REFILL IS CLOSED
   ========================================================= */

function isRefillClosed_(
  refill
) {
  if (
    !refill
  ) {
    return false;
  }


  const patientResponse =
    String(
      refill.Patient_Response ||
      ""
    )
      .trim()
      .toLowerCase();


  const confirmationStatus =
    String(
      refill.Confirmation_Status ||
      ""
    )
      .trim()
      .toLowerCase();


  const resolutionStatus =
    String(
      refill.Resolution_Status ||
      ""
    )
      .trim()
      .toLowerCase();


  const generatedOrderId =
    String(
      refill.Generated_Order_ID ||
      ""
    ).trim();


  if (
    generatedOrderId
  ) {
    return true;
  }


  if (
    [
      "confirmed",
      "completed",
    ].indexOf(
      confirmationStatus
    ) !== -1
  ) {
    return true;
  }


  if (
    [
      "confirmed",
      "cancelled by patient",
      "patient cancelled",
    ].indexOf(
      patientResponse
    ) !== -1
  ) {
    return true;
  }


  return (
    [
      "cancelled by patient",
      "patient cancelled",
      "clinically declined",
      "declined on clinical review",
      "completed",
      "closed",
    ].indexOf(
      resolutionStatus
    ) !== -1
  );
}


/* =========================================================
   REFRESH ALL REFILL STATUSES
   ========================================================= */

function refreshRefillStatuses() {
  const refillSheet =
    sheet_(
      "Refills"
    );


  const map =
    ensureRefillWorkflowColumns_();


  const refills =
    tableRows_(
      "Refills"
    );


  let missedExpired =
    0;

  let overdue =
    0;

  let dueToday =
    0;

  let dueSoon =
    0;

  let notDueYet =
    0;

  let closed =
    0;


  refills.forEach(
    refill => {
      if (
        isRefillClosed_(
          refill
        )
      ) {
        closed++;

        return;
      }


      const status =
        calculateRefillStatus_(
          refill.Next_Refill_Date
        );


      refillSheet
        .getRange(
          refill._row,
          map.Reminder_Status
        )
        .setValue(
          status
        );


      if (
        status ===
        "Missed / Expired"
      ) {
        missedExpired++;
      }


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
    }
  );


  SpreadsheetApp.flush();


  const result = {
    missedExpired:
      missedExpired,

    overdue:
      overdue,

    dueToday:
      dueToday,

    dueSoon:
      dueSoon,

    notDueYet:
      notDueYet,

    closed:
      closed,
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


/* =========================================================
   CALCULATE REFILL STATUS
   ========================================================= */

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
    refillDay ===
    null
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


  /*
   * 8+ DAYS LATE
   */
  if (
    difference <
    -REFILL_RULES
      .OVERDUE_MAX_DAYS
  ) {
    return "Missed / Expired";
  }


  /*
   * 1-7 DAYS LATE
   */
  if (
    difference <
    0
  ) {
    return "Overdue";
  }


  /*
   * TODAY
   */
  if (
    difference ===
    0
  ) {
    return "Due Today";
  }


  /*
   * NEXT 7 DAYS
   */
  if (
    difference <=
    REFILL_RULES
      .DUE_SOON_DAYS
  ) {
    return "Due Soon";
  }


  return "Not Due Yet";
}


/* =========================================================
   CONVERT DATE TO DAY SERIAL
   ========================================================= */

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
    Object.prototype
      .toString
      .call(
        value
      ) ===
      "[object Date]" &&
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
      formatted.split(
        "-"
      );


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


/* =========================================================
   VALIDATE REFILL DATA
   ========================================================= */

function checkRefillData() {
  ensureRefillWorkflowColumns_();


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


  const problems =
    [];


  refills.forEach(
    refill => {
      const refillId =
        String(
          refill.Refill_ID ||
          ""
        ).trim();


      const patientId =
        String(
          refill.Patient_ID ||
          ""
        ).trim();


      const drugId =
        String(
          refill.Drug_ID ||
          ""
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
        ) ===
        null
      ) {
        problems.push(
          refillId +
          ": Invalid Next_Refill_Date."
        );
      }
    }
  );


  if (
    problems.length >
    0
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
      true,
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


/* =========================================================
   GET OPEN REFILL FOR REVIEW
   ========================================================= */

function getOpenRefillForReview_(
  refillId
) {
  const cleanRefillId =
    String(
      refillId ||
      ""
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


  const generatedOrderId =
    String(
      refill.Generated_Order_ID ||
      ""
    ).trim();


  const confirmationStatus =
    String(
      refill.Confirmation_Status ||
      ""
    )
      .trim()
      .toLowerCase();


  const resolutionStatus =
    String(
      refill.Resolution_Status ||
      ""
    )
      .trim()
      .toLowerCase();


  if (
    generatedOrderId ||
    confirmationStatus ===
      "confirmed"
  ) {
    throw new Error(
      "This refill has already been confirmed or converted into an order."
    );
  }


  if (
    [
      "cancelled by patient",
      "clinically declined",
      "completed",
      "closed",
    ].indexOf(
      resolutionStatus
    ) !== -1
  ) {
    throw new Error(
      "This refill has already been closed."
    );
  }


  return refill;
}


/* =========================================================
   PHARMACIST REVIEW
   ========================================================= */

function reviewRefill_(
  refillId,
  note,
  reviewedBy
) {
  const cleanNote =
    String(
      note ||
      ""
    ).trim();


  const reviewer =
    String(
      reviewedBy ||
      "Pharmacist"
    ).trim();


  if (
    !cleanNote
  ) {
    throw new Error(
      "A pharmacist review note is required."
    );
  }


  const refill =
    getOpenRefillForReview_(
      refillId
    );


  const refillSheet =
    sheet_(
      "Refills"
    );


  const map =
    ensureRefillWorkflowColumns_();


  refillSheet
    .getRange(
      refill._row,
      map.Review_Note
    )
    .setValue(
      cleanNote
    );


  refillSheet
    .getRange(
      refill._row,
      map.Reviewed_By
    )
    .setValue(
      reviewer
    );


  refillSheet
    .getRange(
      refill._row,
      map.Reviewed_At
    )
    .setValue(
      new Date()
    );


  SpreadsheetApp.flush();


  logAudit_({
    userType:
      "Admin",

    userId:
      reviewer,

    action:
      "REFILL REVIEWED",

    recordType:
      "Refill",

    recordId:
      String(
        refill.Refill_ID ||
        ""
      ),

    details:
      cleanNote,
  });


  return {
    success:
      true,

    refillId:
      refill.Refill_ID,

    reviewNote:
      cleanNote,

    reviewedBy:
      reviewer,
  };
}


/* =========================================================
   RESCHEDULE REFILL
   ========================================================= */

function rescheduleRefill_(
  refillId,
  newRefillDate,
  note,
  reviewedBy
) {
  const refill =
    getOpenRefillForReview_(
      refillId
    );


  const reviewer =
    String(
      reviewedBy ||
      "Pharmacist"
    ).trim();


  const cleanNote =
    String(
      note ||
      ""
    ).trim();


  if (
    !cleanNote
  ) {
    throw new Error(
      "A pharmacist note is required when rescheduling a refill."
    );
  }


  const newDateSerial =
    dateSerial_(
      newRefillDate
    );


  const todaySerial =
    dateSerial_(
      new Date()
    );


  if (
    newDateSerial ===
    null
  ) {
    throw new Error(
      "The new refill date is invalid."
    );
  }


  if (
    newDateSerial <
    todaySerial
  ) {
    throw new Error(
      "The new refill date cannot be in the past."
    );
  }


  const refillSheet =
    sheet_(
      "Refills"
    );


  const map =
    ensureRefillWorkflowColumns_();


  refillSheet
    .getRange(
      refill._row,
      map.Previous_Refill_Date
    )
    .setValue(
      refill.Next_Refill_Date ||
      ""
    );


  refillSheet
    .getRange(
      refill._row,
      map.Next_Refill_Date
    )
    .setValue(
      newRefillDate
    );


  refillSheet
    .getRange(
      refill._row,
      map.Reminder_Status
    )
    .setValue(
      calculateRefillStatus_(
        newRefillDate
      )
    );


  if (
    map.Reminder_Sent
  ) {
    refillSheet
      .getRange(
        refill._row,
        map.Reminder_Sent
      )
      .clearContent();
  }


  if (
    map.Reminder_Sent_Date
  ) {
    refillSheet
      .getRange(
        refill._row,
        map.Reminder_Sent_Date
      )
      .clearContent();
  }


  if (
    map.Patient_Response
  ) {
    refillSheet
      .getRange(
        refill._row,
        map.Patient_Response
      )
      .clearContent();
  }


  if (
    map.Confirmation_Date
  ) {
    refillSheet
      .getRange(
        refill._row,
        map.Confirmation_Date
      )
      .clearContent();
  }


  if (
    map.Confirmation_Status
  ) {
    refillSheet
      .getRange(
        refill._row,
        map.Confirmation_Status
      )
      .setValue(
        "Pending"
      );
  }


  refillSheet
    .getRange(
      refill._row,
      map.Resolution_Status
    )
    .setValue(
      "Rescheduled"
    );


  refillSheet
    .getRange(
      refill._row,
      map.Resolution_Reason
    )
    .setValue(
      cleanNote
    );


  refillSheet
    .getRange(
      refill._row,
      map.Review_Note
    )
    .setValue(
      cleanNote
    );


  refillSheet
    .getRange(
      refill._row,
      map.Reviewed_By
    )
    .setValue(
      reviewer
    );


  refillSheet
    .getRange(
      refill._row,
      map.Reviewed_At
    )
    .setValue(
      new Date()
    );


  SpreadsheetApp.flush();


  logAudit_({
    userType:
      "Admin",

    userId:
      reviewer,

    action:
      "REFILL RESCHEDULED",

    recordType:
      "Refill",

    recordId:
      String(
        refill.Refill_ID ||
        ""
      ),

    details:
      "Refill rescheduled to " +
      String(
        newRefillDate
      ) +
      ". Reason: " +
      cleanNote,
  });


  return {
    success:
      true,

    refillId:
      refill.Refill_ID,

    status:
      "Rescheduled",

    nextRefillDate:
      newRefillDate,

    note:
      cleanNote,

    reviewedBy:
      reviewer,
  };
}


/* =========================================================
   CANCEL REFILL BY PATIENT
   ========================================================= */

function cancelRefillByPatient_(
  refillId,
  reason,
  reviewedBy
) {
  const refill =
    getOpenRefillForReview_(
      refillId
    );


  const cleanReason =
    String(
      reason ||
      ""
    ).trim();


  const reviewer =
    String(
      reviewedBy ||
      "Pharmacist"
    ).trim();


  if (
    !cleanReason
  ) {
    throw new Error(
      "The patient's cancellation reason is required."
    );
  }


  const refillSheet =
    sheet_(
      "Refills"
    );


  const map =
    ensureRefillWorkflowColumns_();


  refillSheet
    .getRange(
      refill._row,
      map.Patient_Response
    )
    .setValue(
      "Cancelled by Patient"
    );


  refillSheet
    .getRange(
      refill._row,
      map.Confirmation_Status
    )
    .setValue(
      "Cancelled"
    );


  refillSheet
    .getRange(
      refill._row,
      map.Reminder_Status
    )
    .setValue(
      "Cancelled by Patient"
    );


  refillSheet
    .getRange(
      refill._row,
      map.Resolution_Status
    )
    .setValue(
      "Cancelled by Patient"
    );


  refillSheet
    .getRange(
      refill._row,
      map.Resolution_Reason
    )
    .setValue(
      cleanReason
    );


  refillSheet
    .getRange(
      refill._row,
      map.Review_Note
    )
    .setValue(
      "Patient requested cancellation."
    );


  refillSheet
    .getRange(
      refill._row,
      map.Reviewed_By
    )
    .setValue(
      reviewer
    );


  refillSheet
    .getRange(
      refill._row,
      map.Reviewed_At
    )
    .setValue(
      new Date()
    );


  SpreadsheetApp.flush();


  logAudit_({
    userType:
      "Admin",

    userId:
      reviewer,

    action:
      "REFILL CANCELLED BY PATIENT",

    recordType:
      "Refill",

    recordId:
      String(
        refill.Refill_ID ||
        ""
      ),

    details:
      "Patient reason: " +
      cleanReason,
  });


  return {
    success:
      true,

    refillId:
      refill.Refill_ID,

    status:
      "Cancelled by Patient",

    reason:
      cleanReason,

    reviewedBy:
      reviewer,
  };
}


/* =========================================================
   CLINICALLY DECLINE REFILL
   ========================================================= */

function clinicallyDeclineRefill_(
  refillId,
  reason,
  note,
  reviewedBy
) {
  const refill =
    getOpenRefillForReview_(
      refillId
    );


  const cleanReason =
    String(
      reason ||
      ""
    ).trim();


  const cleanNote =
    String(
      note ||
      ""
    ).trim();


  const reviewer =
    String(
      reviewedBy ||
      "Pharmacist"
    ).trim();


  if (
    !cleanReason
  ) {
    throw new Error(
      "A clinical decline reason is required."
    );
  }


  if (
    !reviewer
  ) {
    throw new Error(
      "The reviewer name or role is required."
    );
  }


  const refillSheet =
    sheet_(
      "Refills"
    );


  const map =
    ensureRefillWorkflowColumns_();


  refillSheet
    .getRange(
      refill._row,
      map.Confirmation_Status
    )
    .setValue(
      "Clinically Declined"
    );


  refillSheet
    .getRange(
      refill._row,
      map.Reminder_Status
    )
    .setValue(
      "Clinically Declined"
    );


  refillSheet
    .getRange(
      refill._row,
      map.Resolution_Status
    )
    .setValue(
      "Clinically Declined"
    );


  refillSheet
    .getRange(
      refill._row,
      map.Resolution_Reason
    )
    .setValue(
      cleanReason
    );


  refillSheet
    .getRange(
      refill._row,
      map.Review_Note
    )
    .setValue(
      cleanNote
    );


  refillSheet
    .getRange(
      refill._row,
      map.Reviewed_By
    )
    .setValue(
      reviewer
    );


  refillSheet
    .getRange(
      refill._row,
      map.Reviewed_At
    )
    .setValue(
      new Date()
    );


  SpreadsheetApp.flush();


  logAudit_({
    userType:
      "Admin",

    userId:
      reviewer,

    action:
      "REFILL CLINICALLY DECLINED",

    recordType:
      "Refill",

    recordId:
      String(
        refill.Refill_ID ||
        ""
      ),

    details:
      "Clinical reason: " +
      cleanReason +
      (
        cleanNote
          ? ". Note: " +
            cleanNote
          : ""
      ),
  });


  return {
    success:
      true,

    refillId:
      refill.Refill_ID,

    status:
      "Clinically Declined",

    reason:
      cleanReason,

    note:
      cleanNote,

    reviewedBy:
      reviewer,
  };
}


/* =========================================================
   PROCESS PATIENT REFILL CONFIRMATION
   ========================================================= */

function processRefillConfirmation_(
  refillId,
  token
) {
  const cleanRefillId =
    String(
      refillId ||
      ""
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


  if (
    isRefillClosed_(
      refill
    )
  ) {
    throw new Error(
      "This refill is already closed, confirmed, cancelled, or clinically declined."
    );
  }


  const currentRefillStatus =
    calculateRefillStatus_(
      refill.Next_Refill_Date
    );


  if (
    currentRefillStatus ===
    "Missed / Expired"
  ) {
    throw new Error(
      "This refill is missed / expired and requires pharmacist review before it can continue."
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


  /*
   * CREATE OR REUSE ORDER
   */

  const orderResult =
    createOrderFromRefill_(
      cleanRefillId
    );


  const orderId =
    orderResult.orderId;


  /*
   * CREATE OR REUSE INVOICE
   */

  const invoiceResult =
    createInvoiceForOrder_(
      orderId
    );


  /*
   * MARK REFILL CONFIRMED
   */

  markRefillConfirmed_(
    cleanRefillId,
    orderId
  );


  /*
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
          paymentToken,
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
        invoiceResult.amount ||
        0
      ),

    invoiceLink:
      invoiceResult.invoiceLink ||
      getInvoice_(
        invoiceResult.invoiceId
      ).Invoice_Link,

    paymentLink:
      paymentLink,

    confirmed:
      true,
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


/* =========================================================
   MARK REFILL AS CONFIRMED
   ========================================================= */

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


  const refillSheet =
    sheet_(
      "Refills"
    );


  const map =
    ensureRefillWorkflowColumns_();


  refillSheet
    .getRange(
      refill._row,
      map.Patient_Response
    )
    .setValue(
      "Confirmed"
    );


  refillSheet
    .getRange(
      refill._row,
      map.Confirmation_Date
    )
    .setValue(
      new Date()
    );


  refillSheet
    .getRange(
      refill._row,
      map.Confirmation_Status
    )
    .setValue(
      CONFIG.STATUS.CONFIRMED
    );


  refillSheet
    .getRange(
      refill._row,
      map.Generated_Order_ID
    )
    .setValue(
      orderId
    );


  refillSheet
    .getRange(
      refill._row,
      map.Resolution_Status
    )
    .setValue(
      "Completed"
    );


  refillSheet
    .getRange(
      refill._row,
      map.Resolution_Reason
    )
    .setValue(
      "Patient confirmed refill and an order was created."
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
      ".",
  });


  return true;
}


/* =========================================================
   CHECK IF REFILL IS ALREADY CLOSED / CONFIRMED
   ========================================================= */

function isRefillConfirmed_(
  refill
) {
  return isRefillClosed_(
    refill
  );
}


/* =========================================================
   BUILD UNIQUE VOICE CALL TYPE
   ========================================================= */

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


/* =========================================================
   CHECK FOR PREVIOUS VOICE REMINDER
   ========================================================= */

function hasVoiceReminderBeenSent_(
  refillId
) {
  const cleanRefillId =
    String(
      refillId ||
      ""
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
          call.Call_Type ||
          ""
        ).trim();


      const status =
        String(
          call.Call_Status ||
          ""
        )
          .trim()
          .toUpperCase();


      /*
       * FAILED calls can be retried.
       */

      const successfulSubmission =
        status !==
          "FAILED" &&
        status !==
          "";


      return (
        existingCallType ===
          callType &&
        successfulSubmission
      );
    }
  );
}


/* =========================================================
   CHECK VOICE STATUS ELIGIBILITY
   ========================================================= */

function isVoiceReminderStatusEligible_(
  status
) {
  const cleanStatus =
    String(
      status ||
      ""
    ).trim();


  return (
    REFILL_RULES
      .VOICE_ELIGIBLE_STATUSES
      .indexOf(
        cleanStatus
      ) !== -1
  );
}


/* =========================================================
   SEND ONE REFILL VOICE REMINDER
   ========================================================= */

function sendVoiceReminderForRefill_(
  refillId,
  force
) {
  const cleanRefillId =
    String(
      refillId ||
      ""
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


  /*
   * DO NOT CALL CLOSED REFILLS
   */

  if (
    isRefillConfirmed_(
      refill
    )
  ) {
    throw new Error(
      "Refill " +
      cleanRefillId +
      " is already closed or confirmed. " +
      "No voice reminder will be sent."
    );
  }


  /*
   * CALCULATE STATUS DIRECTLY FROM DATE
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
      "'. Voice reminders are only sent for " +
      "Due Soon, Due Today, or Overdue refills. " +
      "Missed / Expired refills require pharmacist review."
    );
  }


  const allowForce =
    force ===
    true;


  if (
    !allowForce &&
    hasVoiceReminderBeenSent_(
      cleanRefillId
    )
  ) {
    throw new Error(
      "A voice reminder has already been submitted for refill " +
      cleanRefillId +
      "."
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
      "Patient " +
      refill.Patient_ID +
      " was not found."
    );
  }


  const phone =
    String(
      patient.Phone ||
      ""
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


  /*
   * SEND THROUGH Voice.gs
   */

  const voiceResult =
    sendArkeselVoiceCall_(
      phone,
      patient.Patient_ID,
      preferredContact,
      callType
    );


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
      ".",
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
      voiceResult.providerStatus,
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


/* =========================================================
   CHECK VOICE REMINDER READINESS
   ========================================================= */

function checkVoiceReminderReadiness_(
  refillId
) {
  const cleanRefillId =
    String(
      refillId ||
      ""
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
        patient.Phone ||
        ""
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
      ready,
  };
}


/* =========================================================
   SAFE TEST:
   CALCULATE ONE REFILL STATUS
   ========================================================= */

function testRefillStatusCalculation() {
  const refillId =
    "R001";


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
      refillId +
      " was not found."
    );
  }


  const result = {
    refillId:
      refillId,

    nextRefillDate:
      refill.Next_Refill_Date,

    calculatedStatus:
      calculateRefillStatus_(
        refill.Next_Refill_Date
      ),
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


/* =========================================================
   TEST ONE REAL VOICE REMINDER
   WARNING: THIS CAN PLACE A REAL CALL
   ========================================================= */

function testSingleRefillVoiceReminder() {
  const refillId =
    "R001";


  if (
    refillId ===
    "ENTER_REFILL_ID_HERE"
  ) {
    throw new Error(
      "Enter one unconfirmed refill ID inside testSingleRefillVoiceReminder()."
    );
  }


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
    !readiness
      .readyForVoiceReminder
  ) {
    throw new Error(
      "This refill is not ready for a voice reminder. Check the execution log for details."
    );
  }


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


/* =========================================================
   SAFE VOICE READINESS TEST
   DOES NOT PLACE A CALL
   ========================================================= */

function testVoiceReminderReadiness() {
  const refillId =
    "R001";


  if (
    refillId ===
    "ENTER_REFILL_ID_HERE"
  ) {
    throw new Error(
      "Enter a refill ID inside testVoiceReminderReadiness()."
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


/* =========================================================
   SAFE CONFIRMATION READINESS TEST
   DOES NOT CREATE ORDER / INVOICE
   ========================================================= */

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
      refillId +
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
      "Patient was not found."
    );
  }


  const currentStatus =
    calculateRefillStatus_(
      refill.Next_Refill_Date
    );


  const result = {
    refillId:
      refillId,

    patientId:
      patient.Patient_ID,

    tokenValid:
      tokenValid,

    refillStatus:
      currentStatus,

    requiresReview:
      currentStatus ===
      "Missed / Expired",

    confirmationStatus:
      refill.Confirmation_Status,

    resolutionStatus:
      refill.Resolution_Status ||
      "",

    existingOrderId:
      refill.Generated_Order_ID ||
      "",
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


/* =========================================================
   TEST REFILL RESCHEDULE LOGIC
   SAFE UNLESS YOU CALL rescheduleRefill_ DIRECTLY
   ========================================================= */

function testRefillReviewReadiness() {
  const refills =
    tableRows_(
      "Refills"
    );


  const results =
    refills.map(
      refill => {
        const status =
          calculateRefillStatus_(
            refill.Next_Refill_Date
          );


        return {
          refillId:
            refill.Refill_ID,

          patientId:
            refill.Patient_ID,

          drugId:
            refill.Drug_ID,

          nextRefillDate:
            refill.Next_Refill_Date,

          status:
            status,

          closed:
            isRefillClosed_(
              refill
            ),

          reviewRequired:
            status ===
              "Missed / Expired" &&
            !isRefillClosed_(
              refill
            ),
        };
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


/* =========================================================
   REFILL ENGINE TEST
   SAFE:
   UPDATES REMINDER_STATUS + ADDS WORKFLOW COLUMNS
   ========================================================= */

function testRefillEngine() {
  ensureRefillWorkflowColumns_();


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