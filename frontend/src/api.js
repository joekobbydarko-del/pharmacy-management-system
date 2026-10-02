const API_BASE_URL = "http://127.0.0.1:8000";

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("access_token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      "Something went wrong. Please try again.";

    throw new Error(
      Array.isArray(message)
        ? message.map((item) => item.msg).join(", ")
        : message
    );
  }

  return data;
}


/* ================================
   AUTHENTICATION
================================ */

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

  if (data.access_token) {
    localStorage.setItem("access_token", data.access_token);
  }

  if (data.user_id) {
    localStorage.setItem("user_id", String(data.user_id));
  }

  if (data.role) {
    localStorage.setItem("user_role", data.role);
  }

  if (data.full_name) {
    localStorage.setItem("user_name", data.full_name);
  }

  if (data.email) {
    localStorage.setItem("user_email", data.email);
  }

  return data;
}


export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_id");
  localStorage.removeItem("user_role");
  localStorage.removeItem("user_name");
  localStorage.removeItem("user_email");
}


export function isLoggedIn() {
  return Boolean(localStorage.getItem("access_token"));
}


/* ================================
   CURRENT USER
================================ */

export async function getMe() {
  return apiRequest("/me");
}


/* ================================
   MEDICINE ORDERS
================================ */

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


/* ================================
   PRESCRIPTIONS
================================ */

export async function getUserPrescriptions(userId) {
  return apiRequest(`/prescriptions/${userId}`);
}


/* ================================
   REFILL REQUESTS
================================ */

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


/* ================================
   STORAGE HELPERS
================================ */

export function getStoredUser() {
  return {
    userId: localStorage.getItem("user_id"),
    name: localStorage.getItem("user_name"),
    email: localStorage.getItem("user_email"),
    role: localStorage.getItem("user_role"),
    token: localStorage.getItem("access_token"),
  };
}