
/**
 * DR. EVANS PHARMACY
 * ADMIN DISPENSING ENGINE
 *
 * Handles existing patient orders.
 *
 * IMPORTANT:
 * This function must be called while the
 * AdminOrders.js script lock is held.
 *
 * It does not create another order,
 * invoice or payment.
 */

function dispatchAdminOrderLocked_(
  spreadsheet,
  orderInfo,
  orderId
) {
  const cleanOrderId = String(
    orderId || ""
  ).trim();

  if (!cleanOrderId || !orderInfo) {
    throw new Error("Valid order details are required.");
  }

  const ordersSheet = orderInfo.sheet;
  const orderRow = orderInfo.row;
  const orderMap = orderInfo.map;

  const inventorySheet =
    spreadsheet.getSheetByName("Inventory");

  const drugsSheet =
    spreadsheet.getSheetByName("Drugs");

  if (!inventorySheet || !drugsSheet) {
    throw new Error(
      "Inventory or Drugs sheet is missing."
    );
  }

  // Ensure the Orders sheet can permanently
  // identify an already-dispensed order.
  let dispensedColumn = orderMap.Dispensed_At;

  if (!dispensedColumn) {
    dispensedColumn =
      ordersSheet.getLastColumn() + 1;

    ordersSheet
      .getRange(1, dispensedColumn)
      .setValue("Dispensed_At");

    orderMap.Dispensed_At =
      dispensedColumn;
  }

  const dispensedCell = ordersSheet.getRange(
    orderRow,
    dispensedColumn
  );

  const previousDispensedAt =
    dispensedCell.getValue();

  if (previousDispensedAt) {
    throw new Error(
      "Order " + cleanOrderId +
      " has already been dispensed. " +
      "Stock cannot be deducted again."
    );
  }

  const currentStatusCell =
    ordersSheet.getRange(
      orderRow,
      orderMap.Order_Status
    );

  const currentStatus = String(
    currentStatusCell.getValue() || ""
  ).trim();

  if (currentStatus.toLowerCase() !== "ready") {
    throw new Error(
      "Only Ready orders can be dispatched. " +
      "Current status: " + currentStatus
    );
  }

  const allItems = dashboardReadSheet_(
    spreadsheet,
    "Order_Items"
  );

  const quantitiesByDrug = {};

  allItems.forEach(function (item) {
    if (
      String(item.Order_ID || "").trim() !==
      cleanOrderId
    ) {
      return;
    }

    const drugId = String(
      item.Drug_ID || ""
    ).trim();

    const quantity = Number(
      item.Quantity
    );

    if (
      !drugId ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1
    ) {
      throw new Error(
        "Order contains an invalid medicine or quantity."
      );
    }

    quantitiesByDrug[drugId] =
      (quantitiesByDrug[drugId] || 0) +
      quantity;
  });

  const drugIds = Object.keys(
    quantitiesByDrug
  );

  if (drugIds.length === 0) {
    throw new Error(
      "This order has no medicines to dispense."
    );
  }

  const inventoryChanges = [];

  // Validate every requested drug and its stock
  // before changing any inventory values.
  drugIds.forEach(function (drugId) {
    const inventoryInfo = findInventoryRow_(
      inventorySheet,
      drugId
    );

    const drugInfo = findDrugRow_(
      drugsSheet,
      drugId
    );

    if (!inventoryInfo || !drugInfo) {
      throw new Error(
        "Inventory record missing for drug " +
        drugId
      );
    }

    const inventoryMap = inventoryInfo.map;
    const drugMap = drugInfo.map;

    if (
      !inventoryMap.Stock_Quantity ||
      !drugMap.Stock_Quantity
    ) {
      throw new Error(
        "Stock Quantity column missing for " +
        drugId
      );
    }

    const stockCell = inventorySheet.getRange(
      inventoryInfo.row,
      inventoryMap.Stock_Quantity
    );

    const drugStockCell = drugsSheet.getRange(
      drugInfo.row,
      drugMap.Stock_Quantity
    );

    const originalStockValue =
      stockCell.getValue();

    const originalDrugStockValue =
      drugStockCell.getValue();

    const available = Number(
      originalStockValue
    );

    const drugAvailable = Number(
      originalDrugStockValue
    );

    const quantity =
      quantitiesByDrug[drugId];

    if (
      !Number.isSafeInteger(available) ||
      available < 0 ||
      !Number.isSafeInteger(drugAvailable) ||
      drugAvailable !== available
    ) {
      throw new Error(
        "Stock records need reconciliation for " +
        drugId + "."
      );
    }

    if (available < quantity) {
      throw new Error(
        "Insufficient stock for " +
        drugId +
        ". Available: " + available +
        ", Required: " + quantity
      );
    }

    const reorderLevel =
      inventoryMap.Reorder_Level
        ? Number(
            inventorySheet.getRange(
              inventoryInfo.row,
              inventoryMap.Reorder_Level
            ).getValue()
          ) || 0
        : 0;

    const statusCell =
      inventoryMap.Stock_Status
        ? inventorySheet.getRange(
            inventoryInfo.row,
            inventoryMap.Stock_Status
          )
        : null;

    const updatedCell =
      inventoryMap.Last_Updated
        ? inventorySheet.getRange(
            inventoryInfo.row,
            inventoryMap.Last_Updated
          )
        : null;

    inventoryChanges.push({
      drugId,
      quantity,
      available,
      remaining: available - quantity,
      reorderLevel,
      stockCell,
      drugStockCell,
      statusCell,
      updatedCell,
      originalStockValue,
      originalDrugStockValue,
      originalStatus: statusCell
        ? statusCell.getValue()
        : null,
      originalUpdated: updatedCell
        ? updatedCell.getValue()
        : null
    });
  });

  const now = new Date();

  try {
    inventoryChanges.forEach(function (item) {
      item.stockCell.setValue(
        item.remaining
      );

      item.drugStockCell.setValue(
        item.remaining
      );

      if (item.statusCell) {
        item.statusCell.setValue(
          calculateInventoryStatus_(
            item.remaining,
            item.reorderLevel
          )
        );
      }

      if (item.updatedCell) {
        item.updatedCell.setValue(now);
      }
    });

    // Write the dispensing marker and
    // order status in the same locked operation.
    dispensedCell.setValue(now);

    currentStatusCell.setValue(
      "Out for Delivery"
    );

    SpreadsheetApp.flush();

  } catch (error) {
    // Best-effort rollback if writing fails.
    const rollbackErrors = [];

    inventoryChanges
      .slice()
      .reverse()
      .forEach(function (item) {
        try {
          item.stockCell.setValue(
            item.originalStockValue
          );

          item.drugStockCell.setValue(
            item.originalDrugStockValue
          );

          if (item.statusCell) {
            item.statusCell.setValue(
              item.originalStatus
            );
          }

          if (item.updatedCell) {
            item.updatedCell.setValue(
              item.originalUpdated
            );
          }
        } catch (rollbackError) {
          rollbackErrors.push(
            String(rollbackError)
          );
        }
      });

    try {
      dispensedCell.setValue(
        previousDispensedAt
      );

      currentStatusCell.setValue(
        currentStatus
      );

      SpreadsheetApp.flush();
    } catch (rollbackError) {
      rollbackErrors.push(
        String(rollbackError)
      );
    }

    if (rollbackErrors.length) {
      throw new Error(
        "Dispensing failed and rollback was " +
        "incomplete. Check stock manually " +
        "before retrying. " +
        rollbackErrors.join("; ")
      );
    }

    throw error;
  }

  // An audit error must not cause a second
  // inventory deduction.
  try {
    logAudit_({
      userType: "Pharmacist",
      userId: "PHARMACIST",
      action: "ORDER DISPENSED",
      recordType: "Order",
      recordId: cleanOrderId,
      details:
        "Existing order dispatched. " +
        "Stock deducted for " +
        inventoryChanges.length +
        " distinct medicines."
    });
  } catch (auditError) {
    console.error(auditError);
  }

  return {
    order_id: cleanOrderId,
    status: "Out for Delivery",
    dispensed_at: now.toISOString(),
    items: inventoryChanges.map(function (item) {
      return {
        drug_id: item.drugId,
        quantity: item.quantity,
        stock_before: item.available,
        stock_after: item.remaining
      };
    })
  };
}
