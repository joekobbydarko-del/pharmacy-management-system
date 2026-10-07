/**
 * DR. EVANS PHARMACY
 * REFILL AUTOMATION CONTROLLER
 *
 * Purpose:
 * - Coordinate the complete refill reminder workflow
 * - Refresh refill statuses
 * - Skip confirmed refills
 * - Route reminders by preferred contact
 * - Prevent duplicate reminders
 * - Support safe demo mode
 * - Record activity in Audit_Log
 *
 * Existing systems used:
 * - Refills.gs
 * - Messaging.gs
 * - Voice.gs
 * - Trigger.gs
 */


/********************************************************
 * REFILL AUTOMATION CONFIGURATION
 ********************************************************/

const REFILL_AUTOMATION_CONFIG = {

  /**
   * KEEP TRUE FOR DEMO.
   *
   * true:
   * No paid SMS or Voice calls are sent
   * by the automation controller.
   *
   * false:
   * Real preferred-contact routing is used.
   */
  DEMO_MODE:
    true,


  /**
   * Refill statuses that require action.
   */
  ACTIONABLE_STATUSES: [

    "Due Soon",

    "Due Today",

    "Overdue"

  ],


  /**
   * During demo mode we allow the system
   * to identify all records, but it will
   * not send paid reminders automatically.
   */
  DEMO_ALLOWED_PATIENTS: [

    "P001",

    "P011"

  ]

};


/********************************************************
 * CHECK WHETHER REFILL STATUS
 * NEEDS ACTION
 ********************************************************/

function refillAutomationStatusEligible_(
  status
) {

  const cleanStatus =
    String(
      status || ""
    ).trim();


  return (
    REFILL_AUTOMATION_CONFIG
      .ACTIONABLE_STATUSES
      .indexOf(
        cleanStatus
      ) !== -1
  );
}


/********************************************************
 * CHECK WHETHER REFILL IS CONFIRMED
 ********************************************************/

function refillAutomationConfirmed_(
  refill
) {

  if (!refill) {

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


  const orderId =
    String(
      refill.Generated_Order_ID || ""
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
 * CHECK WHETHER PATIENT IS AN
 * APPROVED DEMO TEST PATIENT
 ********************************************************/

function refillAutomationDemoPatient_(
  patientId
) {

  const cleanPatientId =
    String(
      patientId || ""
    ).trim();


  return (
    REFILL_AUTOMATION_CONFIG
      .DEMO_ALLOWED_PATIENTS
      .indexOf(
        cleanPatientId
      ) !== -1
  );
}


/********************************************************
 * PREVIEW ONE REFILL ACTION
 *
 * SAFE:
 * Does NOT send anything.
 ********************************************************/

function previewRefillAutomationAction_(
  refillId
) {

  const context =
    getRefillMessageContext_(
      refillId
    );


  const confirmed =
    refillAutomationConfirmed_(
      context.refill
    );


  const statusEligible =
    refillAutomationStatusEligible_(
      context.reminderStatus
    );


  const preferredContact =
    normalizePreferredContact_(
      context.preferredContact
    );


  const previouslySent =
    String(
      context.refill.Reminder_Sent || ""
    ).trim();


  const duplicateStage =
    previouslySent ===
    context.reminderStatus;


  const demoApproved =
    refillAutomationDemoPatient_(
      context.patientId
    );


  let action =
    "No action";


  let reason =
    "";


  if (
    confirmed
  ) {

    action =
      "Skip";

    reason =
      "Refill already confirmed";
  }


  else if (
    !statusEligible
  ) {

    action =
      "Skip";

    reason =
      "Refill is not currently due";
  }


  else if (
    duplicateStage
  ) {

    action =
      "Skip";

    reason =
      "Reminder already processed for this stage";
  }


  else if (
    preferredContact ===
    "WhatsApp"
  ) {

    action =
      "Manual WhatsApp follow-up";

    reason =
      "Patient prefers WhatsApp";
  }


  else if (
    REFILL_AUTOMATION_CONFIG
      .DEMO_MODE === true
  ) {

    action =
      "Demo identification only";

    reason =
      "Paid automated messaging disabled in demo mode";
  }


  else {

    action =
      "Send " +
      preferredContact +
      " reminder";

    reason =
      "Eligible refill";
  }


  return {

    refillId:
      context.refillId,

    patientId:
      context.patientId,

    patientName:
      context.patientName,

    status:
      context.reminderStatus,

    preferredContact:
      preferredContact,

    confirmed:
      confirmed,

    reminderAlreadyProcessed:
      duplicateStage,

    demoApproved:
      demoApproved,

    action:
      action,

    reason:
      reason

  };
}


/********************************************************
 * PROCESS ONE REFILL THROUGH
 * THE AUTOMATION CONTROLLER
 ********************************************************/

function processAutomatedRefill_(
  refillId
) {

  const preview =
    previewRefillAutomationAction_(
      refillId
    );


  /******************************************************
   * CONFIRMED
   ******************************************************/

  if (
    preview.confirmed
  ) {

    return {

      ...preview,

      sent:
        false,

      skipped:
        true

    };
  }


  /******************************************************
   * NOT ACTIONABLE
   ******************************************************/

  if (
    !refillAutomationStatusEligible_(
      preview.status
    )
  ) {

    return {

      ...preview,

      sent:
        false,

      skipped:
        true

    };
  }


  /******************************************************
   * DUPLICATE
   ******************************************************/

  if (
    preview.reminderAlreadyProcessed
  ) {

    return {

      ...preview,

      sent:
        false,

      skipped:
        true

    };
  }


  /******************************************************
   * DEMO MODE
   *
   * Identify action without sending.
   ******************************************************/

  if (
    REFILL_AUTOMATION_CONFIG
      .DEMO_MODE === true
  ) {

    const result = {

      ...preview,

      sent:
        false,

      skipped:
        false,

      demo:
        true

    };


    logAudit_({

      userType:
        "System",

      userId:
        preview.patientId,

      action:
        "REFILL AUTOMATION DEMO",

      recordType:
        "Refill",

      recordId:
        preview.refillId,

      details:
        "Status: " +
        preview.status +
        ". Preferred contact: " +
        preview.preferredContact +
        ". Planned action: " +
        preview.action +
        "."

    });


    return result;
  }


  /******************************************************
   * PRODUCTION ROUTING
   *
   * This calls the existing Messaging.gs
   * preferred-contact engine.
   ******************************************************/

  const result =
    sendRefillReminderForRecord_(

      preview.refillId,

      false

    );


  return {

    ...preview,

    sent:
      Boolean(
        result.patientReminderSent
      ),

    skipped:
      Boolean(
        result.skipped
      ),

    messagingResult:
      result

  };
}


/********************************************************
 * RUN FULL REFILL AUTOMATION
 ********************************************************/

function runRefillAutomation() {

  Logger.log(
    "===================================="
  );

  Logger.log(
    "DR. EVANS PHARMACY"
  );

  Logger.log(
    "REFILL AUTOMATION STARTED"
  );

  Logger.log(
    "===================================="
  );


  /******************************************************
   * STEP 1:
   * REFRESH CURRENT REFILL STATUSES
   ******************************************************/

  const statusSummary =
    refreshRefillStatuses();


  /******************************************************
   * STEP 2:
   * LOAD REFILLS
   ******************************************************/

  const refills =
    tableRows_(
      "Refills"
    );


  const results = [];


  /******************************************************
   * STEP 3:
   * PROCESS EACH REFILL
   ******************************************************/

  refills.forEach(
    refill => {

      const refillId =
        String(
          refill.Refill_ID || ""
        ).trim();


      if (
        !refillId
      ) {

        return;
      }


      try {

        const result =
          processAutomatedRefill_(
            refillId
          );


        results.push(
          result
        );

      }

      catch (error) {

        results.push({

          refillId:
            refillId,

          success:
            false,

          error:
            error.message

        });

      }

    }
  );


  /******************************************************
   * STEP 4:
   * SUMMARY COUNTERS
   ******************************************************/

  const actionable =
    results.filter(
      item => {

        return (
          refillAutomationStatusEligible_(
            item.status
          ) &&
          item.confirmed !== true
        );

      }
    ).length;


  const confirmedSkipped =
    results.filter(
      item =>
        item.confirmed === true
    ).length;


  const duplicateSkipped =
    results.filter(
      item =>
        item.reminderAlreadyProcessed ===
        true
    ).length;


  const demoActions =
    results.filter(
      item =>
        item.demo === true
    ).length;


  const sent =
    results.filter(
      item =>
        item.sent === true
    ).length;


  const errors =
    results.filter(
      item =>
        Boolean(
          item.error
        )
    ).length;


  /******************************************************
   * STEP 5:
   * BUILD RESULT
   ******************************************************/

  const summary = {

    timestamp:
      new Date(),

    demoMode:
      REFILL_AUTOMATION_CONFIG
        .DEMO_MODE,

    totalRefills:
      refills.length,

    overdue:
      statusSummary.overdue,

    dueToday:
      statusSummary.dueToday,

    dueSoon:
      statusSummary.dueSoon,

    notDueYet:
      statusSummary.notDueYet,

    actionable:
      actionable,

    confirmedSkipped:
      confirmedSkipped,

    duplicateSkipped:
      duplicateSkipped,

    demoActions:
      demoActions,

    remindersSent:
      sent,

    errors:
      errors,

    results:
      results

  };


  /******************************************************
   * STEP 6:
   * MASTER AUDIT ENTRY
   ******************************************************/

  logAudit_({

    userType:
      "System",

    userId:
      "SYSTEM",

    action:
      REFILL_AUTOMATION_CONFIG
        .DEMO_MODE === true

        ? "REFILL AUTOMATION DEMO RUN"

        : "REFILL AUTOMATION RUN",

    recordType:
      "System",

    recordId:
      "REFILL-AUTOMATION",

    details:
      "Total refills: " +
      refills.length +
      ". Actionable: " +
      actionable +
      ". Confirmed skipped: " +
      confirmedSkipped +
      ". Duplicate skipped: " +
      duplicateSkipped +
      ". Demo actions: " +
      demoActions +
      ". Reminders sent: " +
      sent +
      ". Errors: " +
      errors +
      "."

  });


  /******************************************************
   * STEP 7:
   * EXECUTION LOG
   ******************************************************/

  Logger.log(
    "REFILL AUTOMATION SUMMARY:"
  );


  Logger.log(
    JSON.stringify(
      summary,
      null,
      2
    )
  );


  Logger.log(
    "===================================="
  );

  Logger.log(
    "REFILL AUTOMATION COMPLETED"
  );

  Logger.log(
    "===================================="
  );


  return summary;
}


/********************************************************
 * SAFE REFILL AUTOMATION TEST
 *
 * Does NOT send paid SMS or Voice calls
 * while DEMO_MODE = true.
 ********************************************************/

function testRefillAutomation() {

  if (
    REFILL_AUTOMATION_CONFIG
      .DEMO_MODE !== true
  ) {

    throw new Error(
      "Safety stop: DEMO_MODE must be true for this test."
    );
  }


  return runRefillAutomation();
}


/********************************************************
 * TEST ONE REFILL PREVIEW
 *
 * No messages are sent.
 ********************************************************/

function testRefillAutomationPreviewR001() {

  const result =
    previewRefillAutomationAction_(
      "R001"
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