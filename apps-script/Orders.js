/**
 * DR. EVANS PHARMACY
 * ORDER ENGINE
 */


/**
 * CREATE ORDER FROM REFILL
 *
 * Safe against duplicate clicks.
 * If the refill already has a Generated_Order_ID,
 * that existing order is returned.
 */
function createOrderFromRefill_(refillId) {

  const lock =
    LockService.getScriptLock();

  lock.waitLock(30000);

  try {

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


    /**
     * DUPLICATE PROTECTION
     */
    const existingOrderId =
      String(
        refill.Generated_Order_ID || ""
      ).trim();

    if (existingOrderId) {

      const existingOrder =
        findRecord_(
          "Orders",
          "Order_ID",
          existingOrderId
        );

      if (existingOrder) {

        return {
          orderId:
            existingOrderId,

          created:
            false,

          message:
            "Order already exists."
        };
      }
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


    const customerType =
      String(
        patient.Customer_Type || ""
      ).trim();


    const quantity =
      previousQuantity_(
        patient.Patient_ID,
        refill.Drug_ID
      );


    let unitPrice = 0;


    if (
      customerType ===
      "Monthly"
    ) {

      unitPrice =
        Number(
          drug.Monthly_Price || 0
        );

    } else {

      unitPrice =
        Number(
          drug.One_Time_Price || 0
        );
    }


    if (
      !unitPrice ||
      unitPrice <= 0
    ) {

      throw new Error(
        "A valid selling price was not found for " +
        drug.Drug_Name +
        "."
      );
    }


    const totalAmount =
      quantity *
      unitPrice;


    const costPrice =
      Number(
        drug.Cost_Price || 0
      );


    const costTotal =
      quantity *
      costPrice;


    const profit =
      totalAmount -
      costTotal;


    const orderId =
      nextId_(
        "Orders",
        "Order_ID",
        "O",
        3
      );


    const orderItemId =
      nextId_(
        "Order_Items",
        "Order_Item_ID",
        "OI",
        3
      );


    /**
     * CREATE ORDER
     */
    appendRecord_(
      "Orders",
      {

        Order_ID:
          orderId,

        Order_Date:
          new Date(),

        Patient_ID:
          patient.Patient_ID,

        Customer_Type:
          customerType,

        Payment_Status:
          CONFIG.STATUS.PENDING,

        Order_Status:
          CONFIG.STATUS.PENDING

      }
    );


    /**
     * CREATE ORDER ITEM
     */
    appendRecord_(
      "Order_Items",
      {

        Order_Item_ID:
          orderItemId,

        Order_ID:
          orderId,

        Drug_ID:
          drug.Drug_ID,

        Quantity:
          quantity,

        Unit_Price:
          unitPrice,

        Total_Amount:
          totalAmount,

        Cost_Total:
          costTotal,

        Profit:
          profit

      }
    );


    /**
     * STORE ORDER ID BACK ON REFILL
     */
    const refillSheet =
      sheet_("Refills");

    const refillMap =
      headerMap_("Refills");


    refillSheet
      .getRange(
        refill._row,
        refillMap.Generated_Order_ID
      )
      .setValue(
        orderId
      );


    SpreadsheetApp.flush();


    logAudit_({
      userType:
        "Patient",

      userId:
        patient.Patient_ID,

      action:
        "ORDER CREATED",

      recordType:
        "Order",

      recordId:
        orderId,

      details:
        "Created from refill " +
        refillId +
        "."
    });


    return {

      orderId:
        orderId,

      orderItemId:
        orderItemId,

      patientId:
        patient.Patient_ID,

      drugId:
        drug.Drug_ID,

      quantity:
        quantity,

      unitPrice:
        unitPrice,

      totalAmount:
        totalAmount,

      created:
        true

    };

  }

  finally {

    lock.releaseLock();
  }
}


/**
 * GET PREVIOUS QUANTITY
 *
 * Looks for the most recent order
 * for the same patient and drug.
 *
 * If none exists, quantity defaults to 1.
 */
function previousQuantity_(
  patientId,
  drugId
) {

  const orders =
    tableRows_(
      "Orders"
    );


  const orderItems =
    tableRows_(
      "Order_Items"
    );


  const patientOrders =
    orders
      .filter(
        order =>
          String(
            order.Patient_ID || ""
          ).trim() ===
          String(
            patientId || ""
          ).trim()
      )
      .sort(
        (a, b) =>
          b._row - a._row
      );


  for (
    let i = 0;
    i < patientOrders.length;
    i++
  ) {

    const orderId =
      patientOrders[i].Order_ID;


    const matchingItem =
      orderItems.find(
        item =>
          String(
            item.Order_ID || ""
          ).trim() ===
          String(
            orderId || ""
          ).trim() &&

          String(
            item.Drug_ID || ""
          ).trim() ===
          String(
            drugId || ""
          ).trim()
      );


    if (matchingItem) {

      const quantity =
        Number(
          matchingItem.Quantity || 0
        );

      if (
        quantity > 0
      ) {
        return quantity;
      }
    }
  }


  return 1;
}


/**
 * GET ORDER TOTAL
 */
function orderTotal_(
  orderId
) {

  const items =
    tableRows_(
      "Order_Items"
    )
      .filter(
        item =>
          String(
            item.Order_ID || ""
          ).trim() ===
          String(
            orderId || ""
          ).trim()
      );


  return items.reduce(
    (sum, item) =>
      sum +
      Number(
        item.Total_Amount || 0
      ),
    0
  );
}


/**
 * GET ORDER CONTEXT
 */
function getOrderContext_(
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


  const patient =
    findRecord_(
      "Patients",
      "Patient_ID",
      order.Patient_ID
    );


  const items =
    tableRows_(
      "Order_Items"
    )
      .filter(
        item =>
          String(
            item.Order_ID || ""
          ).trim() ===
          String(
            orderId || ""
          ).trim()
      );


  return {

    order:
      order,

    patient:
      patient,

    items:
      items,

    total:
      orderTotal_(
        orderId
      )

  };
}


/**
 * SAFE ORDER ENGINE TEST
 *
 * IMPORTANT:
 * This does NOT create a real order.
 * It only checks the data needed
 * for R003.
 */
function testOrderEngine() {

  const refill =
    findRecord_(
      "Refills",
      "Refill_ID",
      "R003"
    );

  if (!refill) {
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


  const drug =
    findRecord_(
      "Drugs",
      "Drug_ID",
      refill.Drug_ID
    );


  if (!patient || !drug) {
    throw new Error(
      "Patient or drug data is missing."
    );
  }


  const quantity =
    previousQuantity_(
      patient.Patient_ID,
      drug.Drug_ID
    );


  const customerType =
    String(
      patient.Customer_Type || ""
    ).trim();


  const unitPrice =
    customerType === "Monthly"
      ? Number(
          drug.Monthly_Price || 0
        )
      : Number(
          drug.One_Time_Price || 0
        );


  const result = {

    refillId:
      refill.Refill_ID,

    patientId:
      patient.Patient_ID,

    drugId:
      drug.Drug_ID,

    customerType:
      customerType,

    quantity:
      quantity,

    unitPrice:
      unitPrice,

    total:
      quantity * unitPrice

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