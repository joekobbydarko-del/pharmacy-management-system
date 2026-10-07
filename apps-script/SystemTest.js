/**
 * DR. EVANS PHARMACY
 * FULL SYSTEM TEST CONTROLLER
 *
 * Purpose:
 * - Support safe end-to-end system testing.
 * - Does NOT send SMS.
 * - Does NOT send email.
 * - Does NOT make voice calls.
 * - Does NOT create an order until the real
 *   patient confirmation page is used.
 */


/**
 * TEST 2
 * PREPARE A REAL REFILL CONFIRMATION LINK
 *
 * Finds the first refill that:
 * - is Due Soon or Due Today
 * - is not already confirmed
 * - has no generated order
 *
 * Then creates the same secure confirmation
 * URL used by the real system.
 */
function prepareSystemTestConfirmation() {

  refreshRefillStatuses();

  const refills =
    tableRows_(
      "Refills"
    );

  const eligibleRefill =
    refills.find(
      refill => {

        const status =
          String(
            refill.Reminder_Status || ""
          ).trim();

        const confirmationStatus =
          String(
            refill.Confirmation_Status || ""
          ).trim();

        const generatedOrderId =
          String(
            refill.Generated_Order_ID || ""
          ).trim();

        return (
          (
            status === "Due Soon" ||
            status === "Due Today"
          ) &&
          confirmationStatus !==
            CONFIG.STATUS.CONFIRMED &&
          !generatedOrderId
        );
      }
    );

  if (!eligibleRefill) {

    throw new Error(
      "No eligible unconfirmed Due Soon or Due Today refill was found."
    );
  }

  const refillId =
    String(
      eligibleRefill.Refill_ID || ""
    ).trim();

  const patientId =
    String(
      eligibleRefill.Patient_ID || ""
    ).trim();

  const status =
    String(
      eligibleRefill.Reminder_Status || ""
    ).trim();

  const confirmationUrl =
    buildRefillConfirmationUrl_(
      refillId
    );

  const result = {

    test:
      "Patient Confirmation -> Order Creation",

    refillId:
      refillId,

    patientId:
      patientId,

    refillStatus:
      status,

    confirmationStatus:
      String(
        eligibleRefill.Confirmation_Status || ""
      ).trim(),

    generatedOrderId:
      String(
        eligibleRefill.Generated_Order_ID || ""
      ).trim(),

    confirmationUrl:
      confirmationUrl,

    communicationSent:
      false,

    safeTest:
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