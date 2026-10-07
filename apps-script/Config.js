/**
 * DR. EVANS PHARMACY
 * SYSTEM CONFIGURATION
 */

const CONFIG = {
  APP_NAME: "Dr. Evans Pharmacy",
  TIMEZONE: "Africa/Accra",
  CURRENCY: "GHS",

  PROPERTIES: {
    SPREADSHEET_ID: "SPREADSHEET_ID",
    WEB_APP_URL: "WEB_APP_URL",
    TOKEN_SECRET: "TOKEN_SECRET",
    PAYSTACK_SECRET: "PAYSTACK_TEST_SECRET_KEY",
    ARKESEL_API_KEY: "ARKESEL_API_KEY"
  },

  SHEETS: {
    Patients: [
      "Patient_ID",
      "Full_Name",
      "Phone",
      "Location",
      "Condition",
      "Customer_Type",
      "Preferred_Contact",
      "Patient_Email",
      "Doctor_Email"
    ],

    Drugs: [
      "Drug_ID",
      "Drug_Name",
      "Category",
      "Cost_Price",
      "Monthly_Price",
      "One_Time_Price",
      "Stock_Quantity",
      "Reorder_Level"
    ],

    Orders: [
      "Order_ID",
      "Order_Date",
      "Patient_ID",
      "Customer_Type",
      "Payment_Status",
      "Order_Status"
    ],

    Order_Items: [
      "Order_Item_ID",
      "Order_ID",
      "Drug_ID",
      "Quantity",
      "Unit_Price",
      "Total_Amount",
      "Cost_Total",
      "Profit"
    ],

    Payments: [
      "Payment_ID",
      "Order_ID",
      "Patient_ID",
      "Payment_Date",
      "Amount_Paid",
      "Payment_Method",
      "Network_Provider",
      "Transaction_Reference",
      "Provider_Reference",
      "Provider_Status",
      "Payment_Confirmed",
      "Confirmed_By",
      "Confirmation_Date",
      "Payment_Status"
    ],

    Inventory: [
      "Inventory_ID",
      "Drug_ID",
      "Drug_Name",
      "Stock_Quantity",
      "Reorder_Level",
      "Stock_Status",
      "Last_Updated"
    ],

    Refills: [
      "Refill_ID",
      "Patient_ID",
      "Drug_ID",
      "Last_Refill_Date",
      "Refill_Frequency_Days",
      "Next_Refill_Date",
      "Reminder_Status",
      "Reminder_Sent",
      "Reminder_Sent_Date",
      "Patient_Response",
      "Confirmation_Date",
      "Confirmation_Status",
      "Generated_Order_ID"
    ],

    Invoices_Receipts: [
      "Invoice_ID",
      "Order_ID",
      "Invoice_Date",
      "Invoice_Amount",
      "Invoice_Status",
      "Receipt_ID",
      "Receipt_Date",
      "Receipt_Status",
      "Invoice_Link",
      "Receipt_PDF_Link"
    ],

    Payment_Settings: [
      "Setting",
      "Value"
    ],

    Audit_Log: [
      "Log_ID",
      "Timestamp",
      "User_Type",
      "User_ID",
      "Action",
      "Record_Type",
      "Record_ID",
      "Details"
    ],

    SMS_Log: [
      "SMS_ID",
      "Timestamp",
      "Patient_ID",
      "Phone",
      "Message_Type",
      "Message_Text",
      "Provider_Message_ID",
      "Delivery_Status"
    ],

    Call_Log: [
      "Call_ID",
      "Timestamp",
      "Patient_ID",
      "Phone",
      "Preferred_Contact",
      "Call_Type",
      "Call_Message",
      "Provider_Call_ID",
      "Call_Status"
    ],

    Dashboard: null
  },

  REQUIRED_PAYMENT_SETTINGS: [
    "Pharmacy_Name",
    "Pharmacy_MoMo_Number",
    "Bank_Name",
    "Bank_Account_Name",
    "Bank_Account_Number",
    "Currency",
    "Payment_Mode",
    "SMS_Provider",
    "Voice_Provider",
    "Receipt_Requires_Confirmation"
  ],

  STATUS: {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    PAID: "Paid",
    COMPLETED: "Completed",
    FAILED: "Failed",
    GENERATED: "Generated"
  }
};