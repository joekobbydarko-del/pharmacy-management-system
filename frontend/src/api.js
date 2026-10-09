const API_BASE_URL = `http://${window.location.hostname}:8000`;

// ============================================================
// STORAGE HELPERS
// ============================================================

export function getStoredToken() {
  return localStorage.getItem("access_token") || "";
}

export function getStoredUserId() {
  const value = localStorage.getItem("user_id");
  if (!value) return null;

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function getStoredUserRole() {
  return localStorage.getItem("user_role") || "";
}

export function getStoredUserName() {
  return localStorage.getItem("user_name") || "";
}

export function getStoredUserEmail() {
  return localStorage.getItem("user_email") || "";
}

export function isLoggedIn() {
  return Boolean(getStoredToken());
}

export function clearAuthStorage() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_id");
  localStorage.removeItem("user_role");
  localStorage.removeItem("user_name");
  localStorage.removeItem("user_email");
  localStorage.removeItem("token");
  localStorage.removeItem("role");
}

// ============================================================
// CORE API REQUEST
// ============================================================

async function apiRequest(endpoint, options = {}) {
  const token = getStoredToken();

  const headers = {
    ...(options.headers || {}),
  };

  const hasBody =
    options.body !== undefined &&
    options.body !== null;

  const isFormData =
    typeof FormData !== "undefined" &&
    options.body instanceof FormData;

  if (
    hasBody &&
    !isFormData &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        ...options,
        headers,
      }
    );
  } catch (error) {
    throw new Error(
      "Unable to connect to Dr. Evans Pharmacy.",
      { cause: error }
    );
  }

  let data;
  const contentType =
    response.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const responseText = await response.text();
      data = responseText || null;
    }
  } catch {
    data = null;
  }

  const publicAuthEndpoints = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ];

  const isPublicAuthRequest =
    publicAuthEndpoints.some((path) =>
      endpoint.startsWith(path)
    );

  if (
    response.status === 401 &&
    !isPublicAuthRequest
  ) {
    clearAuthStorage();

    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }

    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  if (!response.ok) {
    let message = "Something went wrong.";

    if (typeof data?.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data?.detail)) {
      message = data.detail
        .map((item) => item?.msg)
        .filter(Boolean)
        .join(", ");
    } else if (typeof data?.message === "string") {
      message = data.message;
    } else if (
      typeof data === "string" &&
      data
    ) {
      message = data;
    }

    throw new Error(message);
  }

  return data;
}

// ============================================================
// AUTHENTICATION
// ============================================================

export async function signup(fullName, email, password) {
  return apiRequest("/signup", {
    method: "POST",
    body: JSON.stringify({
      full_name: fullName,
      email,
      password,
    }),
  });
}

export async function login(email, password) {
  const data = await apiRequest("/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const token = data?.access_token || data?.token;

  if (token) {
    localStorage.setItem("access_token", token);
  }

  const userId = data?.user_id ?? data?.id;

  if (userId !== undefined && userId !== null) {
    localStorage.setItem("user_id", String(userId));
  }

  const role = data?.role || "patient";
  localStorage.setItem("user_role", String(role));

  const userName =
    data?.full_name ||
    data?.user_name ||
    data?.name;

  if (userName) {
    localStorage.setItem("user_name", userName);
  }

  if (data?.email) {
    localStorage.setItem("user_email", data.email);
  }

  return data;
}

export function logout() {
  clearAuthStorage();
}

// ============================================================
// CURRENT USER / PROFILE
// ============================================================

export async function getMe() {
  return apiRequest("/me");
}

export async function updateMe(fullName) {
  return apiRequest("/me", {
    method: "PATCH",
    body: JSON.stringify({
      full_name: fullName,
    }),
  });
}

export async function changePassword(
  currentPassword,
  newPassword,
  confirmPassword
) {
  return apiRequest("/me/password", {
    method: "PATCH",
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    }),
  });
}

// ============================================================
// PASSWORD RESET
// ============================================================

export async function forgotPassword(email) {
  return apiRequest("/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token, newPassword) {
  return apiRequest("/reset-password", {
    method: "POST",
    body: JSON.stringify({
      token,
      new_password: newPassword,
    }),
  });
}

// ============================================================
// PATIENT MEDICINE ORDERS
// ============================================================

export async function createMedicineOrder(
  userId,
  medicineName,
  quantity,
  notes = null
) {
  return apiRequest("/orders", {
    method: "POST",
    body: JSON.stringify({
      user_id: Number(userId),
      medicine_name: medicineName,
      quantity: Number(quantity),
      notes,
    }),
  });
}

export async function getUserOrders(userId) {
  return apiRequest(`/orders/${userId}`);
}

// ============================================================
// PRESCRIPTIONS
// ============================================================

export async function getUserPrescriptions(userId) {
  return apiRequest(`/prescriptions/${userId}`);
}

// ============================================================
// REFILL REQUESTS
// ============================================================

export async function createRefillRequest(
  userId,
  prescriptionId,
  notes = null
) {
  return apiRequest("/refill-requests", {
    method: "POST",
    body: JSON.stringify({
      user_id: Number(userId),
      prescription_id: Number(prescriptionId),
      notes,
    }),
  });
}

export async function getUserRefillRequests(userId) {
  return apiRequest(`/refill-requests/${userId}`);
}

// ============================================================
// PATIENT APPOINTMENTS
// ============================================================

export async function createAppointment(
  userId,
  appointmentType,
  appointmentDate,
  appointmentTime,
  note = null
) {
  return apiRequest("/appointments", {
    method: "POST",
    body: JSON.stringify({
      user_id: Number(userId),
      appointment_type: appointmentType,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      note,
    }),
  });
}

export async function getUserAppointments(userId) {
  return apiRequest(`/appointments/${userId}`);
}

// ============================================================
// PHARMACIST MESSAGES
// ============================================================

export async function createPharmacistMessage(
  userId,
  subject,
  message
) {
  return apiRequest("/pharmacist-messages", {
    method: "POST",
    body: JSON.stringify({
      user_id: Number(userId),
      subject,
      message,
    }),
  });
}

export async function getUserPharmacistMessages(userId) {
  return apiRequest(`/pharmacist-messages/${userId}`);
}

// ============================================================
// TECHNICAL SUPPORT
// ============================================================

export async function createSupportRequest(
  userId,
  subject,
  message
) {
  return apiRequest("/support-requests", {
    method: "POST",
    body: JSON.stringify({
      user_id: Number(userId),
      subject,
      message,
    }),
  });
}

export async function getUserSupportRequests(userId) {
  return apiRequest(`/support-requests/${userId}`);
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export async function createNotification(
  userId,
  title,
  message,
  icon = "bell"
) {
  return apiRequest("/notifications", {
    method: "POST",
    body: JSON.stringify({
      user_id: Number(userId),
      title,
      message,
      icon: icon || "bell",
    }),
  });
}

export async function getUserNotifications(userId) {
  return apiRequest(`/notifications/${userId}`);
}

export async function markNotificationRead(notificationId) {
  return apiRequest(`/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsRead(userId) {
  return apiRequest(`/notifications/${userId}/read-all`, {
    method: "PATCH",
  });
}

export async function clearUserNotifications(userId) {
  return apiRequest(`/notifications/${userId}`, {
    method: "DELETE",
  });
}

// ============================================================
// LAB RESULTS
// ============================================================

export async function getUserLabResults(userId) {
  return apiRequest(`/lab-results/${userId}`);
}

// ============================================================
// REMINDERS
// ============================================================

export async function getUserReminders(userId) {
  return apiRequest(`/reminders/${userId}`);
}

export async function markReminderComplete(reminderId) {
  return apiRequest(`/reminders/${reminderId}/complete`, {
    method: "PATCH",
  });
}

// ============================================================
// ADMIN DASHBOARD
// ============================================================

export async function getAdminDashboard() {
  return apiRequest("/admin/dashboard");
}

// ============================================================
// ADMIN APPOINTMENTS
// ============================================================

export async function getAdminAppointments() {
  return apiRequest("/admin/appointments");
}

export async function approveAdminAppointment(appointmentId) {
  return apiRequest(
    `/admin/appointments/${appointmentId}/approve`,
    { method: "PATCH" }
  );
}

export async function rejectAdminAppointment(appointmentId) {
  return apiRequest(
    `/admin/appointments/${appointmentId}/reject`,
    { method: "PATCH" }
  );
}

export async function rescheduleAdminAppointment(
  appointmentId,
  appointmentDate,
  appointmentTime
) {
  return apiRequest(
    `/admin/appointments/${appointmentId}/reschedule`,
    {
      method: "PATCH",
      body: JSON.stringify({
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
      }),
    }
  );
}

export async function completeAdminAppointment(appointmentId) {
  return apiRequest(
    `/admin/appointments/${appointmentId}/complete`,
    { method: "PATCH" }
  );
}

// ============================================================
// ADMIN PATIENTS
// ============================================================

export async function getAdminPatients() {
  return apiRequest("/admin/patients");
}

export async function getAdminPatient(patientId) {
  return apiRequest(`/admin/patients/${patientId}`);
}

export async function updateAdminPatientStatus(
  patientId,
  isActive
) {
  return apiRequest(
    `/admin/patients/${patientId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        is_active: Boolean(isActive),
      }),
    }
  );
}

// ============================================================
// ADMIN INVENTORY
// ============================================================

export async function getAdminInventory() {
  return apiRequest("/admin/inventory");
}

export async function syncAdminInventory() {
  return apiRequest("/admin/inventory/sync", {
    method: "POST",
  });
}

// ============================================================
// PHARMACIST ORDERS — GOOGLE SHEETS
// ============================================================

export async function getAdminOrders() {
  return apiRequest("/admin/orders");
}

export async function getAdminOrder(orderId) {
  const id = String(orderId ?? "").trim();

  if (!id) {
    throw new Error("Order ID is required.");
  }

  return apiRequest(
    `/admin/orders/${encodeURIComponent(id)}`
  );
}

export async function updateAdminOrderStatus(
  orderId,
  status
) {
  const id = String(orderId ?? "").trim();
  const nextStatus = String(status ?? "").trim();

  if (!id) {
    throw new Error("Order ID is required.");
  }

  if (!nextStatus) {
    throw new Error("Order status is required.");
  }

  return apiRequest(
    `/admin/orders/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status: nextStatus,
      }),
    }
  );
}

// ============================================================
// ADMIN POS — INTERNAL DISPENSING ENGINE
// ============================================================

export async function getAdminPOSProducts() {
  return apiRequest("/admin/pos/products");
}

export async function checkoutAdminPOS(payload) {
  return apiRequest("/admin/pos/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAdminPOSSales() {
  return apiRequest("/admin/pos/sales");
}

// ============================================================
// ADMIN SALES
// ============================================================

export async function getAdminSalesSummary() {
  return apiRequest("/admin/sales/summary");
}

export async function getAdminSalesTransactions() {
  return apiRequest("/admin/sales/transactions");
}

export async function getAdminTopProducts() {
  return apiRequest("/admin/sales/top-products");
}

export async function getAdminDailySales() {
  return apiRequest("/admin/sales/daily");
}

// ============================================================
// ADMIN PURCHASES
// ============================================================

export async function getAdminPurchaseDrugs() {
  return apiRequest("/admin/purchases/drugs");
}

export async function getAdminPurchases() {
  return apiRequest("/admin/purchases");
}

export async function createAdminPurchase(payload) {
  return apiRequest("/admin/purchases", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ============================================================
// ADMIN SUPPLIERS
// ============================================================

export async function getAdminSuppliers() {
  return apiRequest("/admin/suppliers");
}

export async function createAdminSupplier(payload) {
  return apiRequest("/admin/suppliers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminSupplierStatus(
  supplierId,
  isActive
) {
  return apiRequest(
    `/admin/suppliers/${supplierId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        is_active: Boolean(isActive),
      }),
    }
  );
}

// ============================================================
// ADMIN REPORTS
// ============================================================

export async function getAdminReportsOverview() {
  return apiRequest("/admin/reports/overview");
}

export async function getAdminReportsSales() {
  return apiRequest("/admin/reports/sales");
}

export async function getAdminReportsPurchases() {
  return apiRequest("/admin/reports/purchases");
}

export async function getAdminReportsInventory() {
  return apiRequest("/admin/reports/inventory");
}

export async function getAdminReportsTopProducts() {
  return apiRequest("/admin/reports/top-products");
}

// ============================================================
// ADMIN ALERTS
// ============================================================

export async function getAdminAlerts() {
  return apiRequest("/admin/alerts");
}

// ============================================================
// ADMIN REFILL ACTIONS
// ============================================================

export async function reviewAdminRefill(refillId, note) {
  return apiRequest("/admin/alerts/refills/review", {
    method: "POST",
    body: JSON.stringify({
      refill_id: String(refillId || "").trim(),
      note: String(note || "").trim(),
    }),
  });
}

export async function rescheduleAdminRefill(
  refillId,
  newRefillDate,
  note
) {
  return apiRequest("/admin/alerts/refills/reschedule", {
    method: "POST",
    body: JSON.stringify({
      refill_id: String(refillId || "").trim(),
      new_refill_date: String(newRefillDate || "").trim(),
      note: String(note || "").trim(),
    }),
  });
}

export async function cancelAdminRefillByPatient(
  refillId,
  reason
) {
  return apiRequest("/admin/alerts/refills/patient-cancel", {
    method: "POST",
    body: JSON.stringify({
      refill_id: String(refillId || "").trim(),
      reason: String(reason || "").trim(),
    }),
  });
}

export async function clinicallyDeclineAdminRefill(
  refillId,
  reason,
  note = ""
) {
  return apiRequest("/admin/alerts/refills/clinical-decline", {
    method: "POST",
    body: JSON.stringify({
      refill_id: String(refillId || "").trim(),
      reason: String(reason || "").trim(),
      note: String(note || "").trim(),
    }),
  });
}