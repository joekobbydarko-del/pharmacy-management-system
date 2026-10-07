/**
 * DR. EVANS PHARMACY
 * DAILY REFILL AUTOMATION TRIGGER
 *
 * Purpose:
 * - Run the completed refill automation daily
 * - Keep the existing trigger handler name
 * - Log success or failure
 *
 * IMPORTANT:
 * RefillAutomation.gs currently controls DEMO_MODE.
 */


/********************************************************
 * DAILY REFILL TRIGGER JOB
 *
 * Keep this exact function name because
 * the installed time-driven trigger uses it.
 ********************************************************/

function runDailyRefillTriggerJob() {

  Logger.log(
    "===================================="
  );

  Logger.log(
    "DR. EVANS PHARMACY"
  );

  Logger.log(
    "DAILY REFILL TRIGGER STARTED"
  );

  Logger.log(
    "===================================="
  );


  const startedAt =
    new Date();


  try {

    /****************************************************
     * RUN COMPLETE REFILL AUTOMATION
     ****************************************************/

    const automationResult =
      runRefillAutomation();


    /****************************************************
     * SUCCESS AUDIT
     ****************************************************/

    logAudit_({

      userType:
        "System",

      userId:
        "SYSTEM",

      action:
        "DAILY REFILL TRIGGER COMPLETED",

      recordType:
        "System",

      recordId:
        "DAILY-REFILL-TRIGGER",

      details:
        "Daily refill automation completed successfully. " +
        "Demo mode: " +
        automationResult.demoMode +
        ". Total refills: " +
        automationResult.totalRefills +
        ". Actionable: " +
        automationResult.actionable +
        ". Reminders sent: " +
        automationResult.remindersSent +
        ". Errors: " +
        automationResult.errors +
        "."

    });


    Logger.log(
      "DAILY REFILL TRIGGER RESULT:"
    );


    Logger.log(
      JSON.stringify(
        automationResult,
        null,
        2
      )
    );


    Logger.log(
      "===================================="
    );

    Logger.log(
      "DAILY REFILL TRIGGER COMPLETED"
    );

    Logger.log(
      "===================================="
    );


    return automationResult;

  }

  catch (error) {

    /****************************************************
     * ERROR AUDIT
     ****************************************************/

    try {

      logAudit_({

        userType:
          "System",

        userId:
          "SYSTEM",

        action:
          "DAILY REFILL TRIGGER FAILED",

        recordType:
          "System",

        recordId:
          "DAILY-REFILL-TRIGGER",

        details:
          "Daily refill automation failed. Error: " +
          error.message

      });

    }

    catch (auditError) {

      Logger.log(
        "Audit logging also failed: " +
        auditError.message
      );
    }


    Logger.log(
      "DAILY REFILL TRIGGER ERROR:"
    );


    Logger.log(
      error.message
    );


    throw error;

  }

  finally {

    const finishedAt =
      new Date();


    const durationSeconds =
      Math.round(
        (
          finishedAt.getTime() -
          startedAt.getTime()
        ) /
        1000
      );


    Logger.log(
      "Trigger duration: " +
      durationSeconds +
      " seconds."
    );
  }
}


/********************************************************
 * SAFE MANUAL TEST
 *
 * Does not allow the test to run if
 * RefillAutomation.gs is in production mode.
 ********************************************************/

function testDailyRefillTrigger() {

  if (
    typeof REFILL_AUTOMATION_CONFIG ===
    "undefined"
  ) {

    throw new Error(
      "REFILL_AUTOMATION_CONFIG was not found. " +
      "Check RefillAutomation.gs."
    );
  }


  if (
    REFILL_AUTOMATION_CONFIG
      .DEMO_MODE !== true
  ) {

    throw new Error(
      "Safety stop: DEMO_MODE must be true " +
      "before running this test."
    );
  }


  const result =
    runDailyRefillTriggerJob();


  Logger.log(
    "SAFE DAILY TRIGGER TEST COMPLETED."
  );


  return result;
}


/********************************************************
 * CHECK WHETHER DAILY TRIGGER EXISTS
 *
 * Does NOT create or delete anything.
 ********************************************************/

function checkDailyRefillTrigger() {

  const triggers =
    ScriptApp
      .getProjectTriggers();


  const matchingTriggers =
    triggers.filter(
      trigger => {

        return (
          trigger
            .getHandlerFunction() ===
          "runDailyRefillTriggerJob"
        );

      }
    );


  const result = {

    triggerExists:
      matchingTriggers.length > 0,

    numberOfMatchingTriggers:
      matchingTriggers.length,

    handlerFunction:
      "runDailyRefillTriggerJob"

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
 * CHECK REFILL AUTOMATION SAFETY
 *
 * Does not send anything.
 ********************************************************/

function checkRefillAutomationSafety() {

  if (
    typeof REFILL_AUTOMATION_CONFIG ===
    "undefined"
  ) {

    throw new Error(
      "REFILL_AUTOMATION_CONFIG was not found."
    );
  }


  const demoMode =
    REFILL_AUTOMATION_CONFIG
      .DEMO_MODE;


  const result = {

    demoMode:
      demoMode,

    automaticSmsEnabled:
      demoMode === false,

    automaticVoiceEnabled:
      demoMode === false,

    status:
      demoMode === true
        ? "SAFE DEMO MODE"
        : "PRODUCTION MODE"

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