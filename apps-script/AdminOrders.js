
/**
 * ============================================================
 * DR. EVANS PHARMACY
 * PHARMACIST ORDERS ENGINE
 * ============================================================
 *
 * Google Sheets remains the source of truth.
 *
 * Pending -> Approved -> Processing -> Ready
 *         -> Out for Delivery -> Delivered
 *
 * Cancellation is permitted before dispatch.
 *
 * IMPORTANT:
 * - Order status is separate from payment status.
 * - Ready does not deduct inventory.
 * - Ready -> Out for Delivery invokes AdminDispensing.js.
 * - Dispensing uses the original Order ID.
 * - Existing POS checkout remains independent.
 * ============================================================
 */

const PHARMACY_ORDER_STATUS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  PROCESSING: "Processing",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled"
};

/* ============================================================
   HELPERS
   ============================================================ */

function adminOrderText_(value) {
  return String(
    value === undefined || value === null ? "" : value
  ).trim();
}

function adminOrderNumber_(value) {
  const number = dashboardNumber_(value);
  return isFinite(number)
    ? Number(number.toFixed(2))
    : 0;
}

function adminOrderInteger_(value) {
  const number = Math.floor(dashboardNumber_(value));
  return isFinite(number) ? number : 0;
}

function adminOrderStatus_(value) {
  return adminOrderText_(value)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalAdminOrderStatus_(value) {
  const status = adminOrderStatus_(value);

  const aliases = {
    pending: PHARMACY_ORDER_STATUS.PENDING,
    approved: PHARMACY_ORDER_STATUS.APPROVED,
    processing: PHARMACY_ORDER_STATUS.PROCESSING,
    "in progress": PHARMACY_ORDER_STATUS.PROCESSING,
    ready: PHARMACY_ORDER_STATUS.READY,
    "ready for delivery": PHARMACY_ORDER_STATUS.READY,
    "out for delivery": PHARMACY_ORDER_STATUS.OUT_FOR_DELIVERY,
    delivered: PHARMACY_ORDER_STATUS.DELIVERED,
    completed: PHARMACY_ORDER_STATUS.DELIVERED,
    complete: PHARMACY_ORDER_STATUS.DELIVERED,
    cancelled: PHARMACY_ORDER_STATUS.CANCELLED,
    canceled: PHARMACY_ORDER_STATUS.CANCELLED
  };

  if (!aliases[status]) {
    throw new Error(
      "Invalid order status: " + value
    );
  }

  return aliases[status];
}

/* ============================================================
   VALID STATUS TRANSITIONS
   ============================================================ */

function allowedAdminOrderTransitions_(currentStatus) {
  const current = canonicalAdminOrderStatus_(
    currentStatus || PHARMACY_ORDER_STATUS.PENDING
  );

  const transitions = {
    Pending: ["Approved", "Cancelled"],
    Approved: ["Processing", "Cancelled"],
    Processing: ["Ready", "Cancelled"],
    Ready: ["Out for Delivery", "Cancelled"],
    "Out for Delivery": ["Delivered"],
    Delivered: [],
    Cancelled: []
  };

  return transitions[current] || [];
}

/* ============================================================
   LOOKUP HELPERS
   ============================================================ */

function adminOrderIndexBy_(rows, field) {
  const result = {};

  (rows || []).forEach(function (row) {
    const key = adminOrderText_(row[field]);
    if (key) result[key] = row;
  });

  return result;
}

function adminOrderItemsByOrder_(orderItems) {
  const grouped = {};

  (orderItems || []).forEach(function (item) {
    const orderId = adminOrderText_(item.Order_ID);

    if (!orderId) return;

    if (!grouped[orderId]) {
      grouped[orderId] = [];
    }

    grouped[orderId].push(item);
  });

  return grouped;
}

function adminOrderPaymentsByOrder_(payments) {
  const grouped = {};

  (payments || []).forEach(function (payment) {
    const orderId = adminOrderText_(payment.Order_ID);

    if (!orderId) return;

    if (!grouped[orderId]) {
      grouped[orderId] = [];
    }

    grouped[orderId].push(payment);
  });

  return grouped;
}

/* ============================================================
   NORMALIZE ORDER ITEM
   ============================================================ */

function normalizeAdminOrderItem_(item, drugsById) {
  const drugId = adminOrderText_(item.Drug_ID);
  const drug = drugsById[drugId] || {};

  return {
    order_item_id: adminOrderText_(item.Order_Item_ID),
    order_id: adminOrderText_(item.Order_ID),
    drug_id: drugId,
    drug_name: adminOrderText_(
      drug.Drug_Name || item.Drug_Name || drugId
    ),
    category: adminOrderText_(drug.Category),
    quantity: adminOrderInteger_(item.Quantity),
    unit_price: adminOrderNumber_(item.Unit_Price),
    total_amount: adminOrderNumber_(item.Total_Amount),
    cost_total: adminOrderNumber_(item.Cost_Total),
    profit: adminOrderNumber_(item.Profit)
  };
}

/* ============================================================
   NORMALIZE COMPLETE ORDER
   ============================================================ */

function normalizeAdminOrder_(
  order,
  patientsById,
  drugsById,
  itemsByOrder,
  paymentsByOrder
) {
  const orderId = adminOrderText_(order.Order_ID);
  const patientId = adminOrderText_(order.Patient_ID);
  const patient = patientsById[patientId] || {};

  const items = (itemsByOrder[orderId] || []).map(
    function (item) {
      return normalizeAdminOrderItem_(item, drugsById);
    }
  );

  const rawPayments = paymentsByOrder[orderId] || [];

  const totalAmount = adminOrderNumber_(
    items.reduce(function (sum, item) {
      return sum + item.total_amount;
    }, 0)
  );

  const totalQuantity = items.reduce(
    function (sum, item) {
      return sum + item.quantity;
    },
    0
  );

  const amountPaid = adminOrderNumber_(
    rawPayments.reduce(function (sum, payment) {
      return sum + adminOrderNumber_(payment.Amount_Paid);
    }, 0)
  );

  const latestPayment =
    rawPayments.slice().sort(function (a, b) {
      return (
        dashboardDateNumber_(b.Payment_Date) -
        dashboardDateNumber_(a.Payment_Date)
      );
    })[0] || {};

  const rawStatus = adminOrderText_(
    order.Order_Status || PHARMACY_ORDER_STATUS.PENDING
  );

  let status;

  try {
    status = canonicalAdminOrderStatus_(rawStatus);
  } catch (error) {
    status = rawStatus;
  }

  const paymentStatus = adminOrderText_(
    latestPayment.Payment_Status ||
    order.Payment_Status ||
    "Pending"
  );

  const dispensedAt = dashboardDateText_(
    order.Dispensed_At
  );

  const allowedNextStatuses =
    allowedAdminOrderTransitions_(status);

  return {
    id: orderId,
    order_id: orderId,

    order_date: dashboardDateText_(order.Order_Date),
    created_at: dashboardDateText_(order.Order_Date),

    patient_id: patientId,
    patient_name: adminOrderText_(
      patient.Full_Name || patientId
    ),
    patient_phone: adminOrderText_(patient.Phone),
    patient_location: adminOrderText_(patient.Location),
    preferred_contact: adminOrderText_(
      patient.Preferred_Contact
    ),

    customer_type: adminOrderText_(
      order.Customer_Type || patient.Customer_Type
    ),

    payment_status: paymentStatus,
    payment_method: adminOrderText_(
      latestPayment.Payment_Method
    ),
    amount_paid: amountPaid,

    order_status: status,
    status: status,

    item_count: items.length,
    quantity: totalQuantity,
    total_quantity: totalQuantity,
    total_amount: totalAmount,

    balance: adminOrderNumber_(
      Math.max(0, totalAmount - amountPaid)
    ),

    items: items,

    dispensed_at: dispensedAt,
    is_dispensed: Boolean(dispensedAt),

    actionable: [
      "Pending",
      "Approved",
      "Processing",
      "Ready"
    ].indexOf(status) !== -1,

    allowed_next_statuses: allowedNextStatuses
  };
}

/* ============================================================
   BUILD ALL PHARMACIST ORDERS
   ============================================================ */

function buildAdminOrders_() {
  const spreadsheet = dashboardSpreadsheet_();

  const patients = dashboardReadSheet_(
    spreadsheet, "Patients"
  );

  const drugs = dashboardReadSheet_(
    spreadsheet, "Drugs"
  );

  const orders = dashboardReadSheet_(
    spreadsheet, "Orders"
  );

  const orderItems = dashboardReadSheet_(
    spreadsheet, "Order_Items"
  );

  const payments = dashboardReadSheet_(
    spreadsheet, "Payments"
  );

  const patientsById = adminOrderIndexBy_(
    patients, "Patient_ID"
  );

  const drugsById = adminOrderIndexBy_(
    drugs, "Drug_ID"
  );

  const itemsByOrder = adminOrderItemsByOrder_(
    orderItems
  );

  const paymentsByOrder = adminOrderPaymentsByOrder_(
    payments
  );

  const response = orders
    .map(function (order) {
      return normalizeAdminOrder_(
        order,
        patientsById,
        drugsById,
        itemsByOrder,
        paymentsByOrder
      );
    })
    .filter(function (order) {
      return Boolean(order.order_id);
    })
    .sort(function (a, b) {
      return (
        dashboardDateNumber_(b.created_at) -
        dashboardDateNumber_(a.created_at)
      );
    });

  const summary = {
    total: response.length,
    pending: 0,
    approved: 0,
    processing: 0,
    ready: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0,
    actionable: 0
  };

  response.forEach(function (order) {
    const status = adminOrderStatus_(order.order_status);

    if (status === "pending") {
      summary.pending++;
    } else if (status === "approved") {
      summary.approved++;
    } else if (status === "processing") {
      summary.processing++;
    } else if (status === "ready") {
      summary.ready++;
    } else if (status === "out for delivery") {
      summary.out_for_delivery++;
    } else if (status === "delivered") {
      summary.delivered++;
    } else if (status === "cancelled") {
      summary.cancelled++;
    }

    if (order.actionable) {
      summary.actionable++;
    }
  });

  return {
    ok: true,
    source: "google-sheets",
    generated_at: new Date().toISOString(),

    orders: response,
    count: response.length,

    pending_count: summary.pending,
    approved_count: summary.approved,
    processing_count: summary.processing,
    ready_count: summary.ready,
    out_for_delivery_count: summary.out_for_delivery,
    delivered_count: summary.delivered,
    cancelled_count: summary.cancelled,
    actionable_count: summary.actionable,

    summary: summary
  };
}

/* ============================================================
   GET ONE ORDER
   ============================================================ */

function buildAdminOrderDetail_(orderId) {
  const cleanOrderId = adminOrderText_(orderId);

  if (!cleanOrderId) {
    throw new Error("Order ID is required.");
  }

  const data = buildAdminOrders_();

  const order = data.orders.find(function (item) {
    return item.order_id === cleanOrderId;
  });

  if (!order) {
    throw new Error(
      "Order " + cleanOrderId + " was not found."
    );
  }

  return {
    ok: true,
    source: "google-sheets",
    generated_at: new Date().toISOString(),
    order: order
  };
}

/* ============================================================
   FIND ORDER ROW
   ============================================================ */

function adminOrderRow_(spreadsheet, orderId) {
  const sheet = spreadsheet.getSheetByName("Orders");

  if (!sheet) {
    throw new Error("Orders sheet was not found.");
  }

  const map = purchaseHeaderMap_(sheet);

  if (!map.Order_ID) {
    throw new Error(
      "Orders sheet does not contain Order_ID."
    );
  }

  if (!map.Order_Status) {
    throw new Error(
      "Orders sheet does not contain Order_Status."
    );
  }

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return null;

  const values = sheet.getRange(
    2,
    map.Order_ID,
    lastRow - 1,
    1
  ).getValues();

  const cleanOrderId = adminOrderText_(orderId);

  for (let index = 0; index < values.length; index++) {
    if (
      adminOrderText_(values[index][0]) ===
      cleanOrderId
    ) {
      return {
        sheet: sheet,
        map: map,
        row: index + 2
      };
    }
  }

  return null;
}

/* ============================================================
   UPDATE ORDER STATUS
   ============================================================ */

function updateAdminOrderStatus_(payload) {
  payload = payload || {};

  const orderId = adminOrderText_(
    payload.order_id || payload.orderId
  );

  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  const nextStatus = canonicalAdminOrderStatus_(
    payload.status ||
    payload.order_status ||
    payload.orderStatus
  );

  const spreadsheet = dashboardSpreadsheet_();

  const lock = LockService.getScriptLock();

  lock.waitLock(30000);

  try {
    const info = adminOrderRow_(
      spreadsheet,
      orderId
    );

    if (!info) {
      throw new Error(
        "Order " + orderId + " was not found."
      );
    }

    const statusCell = info.sheet.getRange(
      info.row,
      info.map.Order_Status
    );

    const currentStatus =
      canonicalAdminOrderStatus_(
        statusCell.getValue() ||
        PHARMACY_ORDER_STATUS.PENDING
      );

    if (currentStatus === nextStatus) {
      return buildAdminOrderDetail_(orderId).order;
    }

    if (
      currentStatus === PHARMACY_ORDER_STATUS.DELIVERED ||
      currentStatus === PHARMACY_ORDER_STATUS.CANCELLED
    ) {
      throw new Error(
        currentStatus +
        " orders cannot be changed."
      );
    }

    const allowed = allowedAdminOrderTransitions_(
      currentStatus
    );

    if (allowed.indexOf(nextStatus) === -1) {
      throw new Error(
        "Order " + orderId +
        " cannot move from " +
        currentStatus +
        " to " +
        nextStatus + "."
      );
    }

    /*
     * DISPENSING TRANSITION
     *
     * This is deliberately inside the existing
     * script lock.
     *
     * AdminDispensing.js validates stock,
     * writes Dispensed_At, updates inventory,
     * and changes status to Out for Delivery.
     *
     * Do not write status again after the
     * dispensing function completes.
     */
    if (
      currentStatus === PHARMACY_ORDER_STATUS.READY &&
      nextStatus ===
        PHARMACY_ORDER_STATUS.OUT_FOR_DELIVERY
    ) {
      if (
        typeof dispatchAdminOrderLocked_ !==
        "function"
      ) {
        throw new Error(
          "AdminDispensing.js is not installed."
        );
      }

      dispatchAdminOrderLocked_(
        spreadsheet,
        info,
        orderId
      );

      return buildAdminOrderDetail_(orderId).order;
    }

    /*
     * ORDINARY STATUS TRANSITIONS
     *
     * These do not change stock or payment.
     */
    statusCell.setValue(nextStatus);

    SpreadsheetApp.flush();

    try {
      logAudit_({
        userType: "Pharmacist",
        userId: adminOrderText_(
          payload.updated_by ||
          payload.updatedBy ||
          payload.pharmacist ||
          "Pharmacist"
        ),
        action: "ORDER STATUS UPDATED",
        recordType: "Order",
        recordId: orderId,
        details:
          "Order status changed from " +
          currentStatus +
          " to " +
          nextStatus + "."
      });
    } catch (auditError) {
      console.error(auditError);
    }

    return buildAdminOrderDetail_(orderId).order;

  } finally {
    lock.releaseLock();
  }
}

/* ============================================================
   GET ORDERS ENDPOINT
   ============================================================ */

function handleAdminOrders_(e) {
  try {
    if (!verifyAdminDashboardRequest_(e)) {
      return webJson_({
        ok: false,
        error: "Unauthorized orders request."
      });
    }

    return webJson_(buildAdminOrders_());

  } catch (error) {
    console.error(error);

    return webJson_({
      ok: false,
      error:
        error.message ||
        "Unable to load pharmacy orders."
    });
  }
}

/* ============================================================
   GET ORDER DETAILS ENDPOINT
   ============================================================ */

function handleAdminOrderDetail_(e) {
  try {
    if (!verifyAdminDashboardRequest_(e)) {
      return webJson_({
        ok: false,
        error: "Unauthorized order request."
      });
    }

    const orderId = adminOrderText_(
      e &&
      e.parameter &&
      (
        e.parameter.order_id ||
        e.parameter.orderId
      )
    );

    return webJson_(
      buildAdminOrderDetail_(orderId)
    );

  } catch (error) {
    console.error(error);

    return webJson_({
      ok: false,
      error:
        error.message ||
        "Unable to load order."
    });
  }
}

/* ============================================================
   UPDATE ORDER STATUS ENDPOINT
   ============================================================ */

function handleAdminOrderStatus_(e) {
  try {
    if (!verifyAdminDashboardRequest_(e)) {
      return webJson_({
        ok: false,
        error: "Unauthorized order status request."
      });
    }

    const payload = parseJsonBody_(e);

    const order = updateAdminOrderStatus_(
      payload
    );

    return webJson_({
      ok: true,
      source: "google-sheets",
      message:
        "Order status updated successfully.",
      order: order
    });

  } catch (error) {
    console.error(error);

    return webJson_({
      ok: false,
      error:
        error.message ||
        "Unable to update order status."
    });
  }
}

/* ============================================================
   READ-ONLY TEST
   ============================================================ */

function testAdminOrders() {
  const result = buildAdminOrders_();

  Logger.log(
    JSON.stringify(
      {
        count: result.count,
        summary: result.summary,
        first_order: result.orders.length
          ? result.orders[0]
          : null
      },
      null,
      2
    )
  );

  return result;
}
