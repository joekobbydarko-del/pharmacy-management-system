const API_BASE_URL =
  "http://127.0.0.1:8000";


async function apiRequest(
  endpoint,
  options = {}
) {
  const token =
    localStorage.getItem(
      "access_token"
    );

  const headers = {
    "Content-Type":
      "application/json",

    ...(options.headers || {}),
  };


  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }


  const response =
    await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        ...options,
        headers,
      }
    );


  const data =
    await response
      .json()
      .catch(() => null);


  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      (
        "Something went wrong. " +
        "Please try again."
      );


    throw new Error(
      Array.isArray(message)
        ? message
            .map(
              (item) =>
                item.msg
            )
            .join(", ")
        : message
    );
  }


  return data;
}


/* =========================================================
   AUTHENTICATION
========================================================= */

export async function signup(
  fullName,
  email,
  password
) {
  return apiRequest(
    "/signup",
    {
      method: "POST",

      body: JSON.stringify({
        full_name: fullName,
        email,
        password,
      }),
    }
  );
}


export async function login(
  email,
  password
) {
  const data =
    await apiRequest(
      "/login",
      {
        method: "POST",

        body: JSON.stringify({
          email,
          password,
        }),
      }
    );


  if (data.access_token) {
    localStorage.setItem(
      "access_token",
      data.access_token
    );
  }


  if (data.user_id) {
    localStorage.setItem(
      "user_id",
      String(data.user_id)
    );
  }


  if (data.role) {
    localStorage.setItem(
      "user_role",
      data.role
    );
  }


  if (data.full_name) {
    localStorage.setItem(
      "user_name",
      data.full_name
    );
  }


  if (data.email) {
    localStorage.setItem(
      "user_email",
      data.email
    );
  }


  return data;
}


export function logout() {
  localStorage.removeItem(
    "access_token"
  );

  localStorage.removeItem(
    "user_id"
  );

  localStorage.removeItem(
    "user_role"
  );

  localStorage.removeItem(
    "user_name"
  );

  localStorage.removeItem(
    "user_email"
  );
}


export function isLoggedIn() {
  return Boolean(
    localStorage.getItem(
      "access_token"
    )
  );
}


/* =========================================================
   CURRENT USER
========================================================= */

export async function getMe() {
  return apiRequest("/me");
}


/* =========================================================
   MEDICINE ORDERS
========================================================= */

export async function createMedicineOrder(
  userId,
  medicineName,
  quantity,
  notes = null
) {
  return apiRequest(
    "/orders",
    {
      method: "POST",

      body: JSON.stringify({
        user_id:
          Number(userId),

        medicine_name:
          medicineName,

        quantity:
          Number(quantity),

        notes,
      }),
    }
  );
}


export async function getUserOrders(
  userId
) {
  return apiRequest(
    `/orders/${userId}`
  );
}


/* =========================================================
   PRESCRIPTIONS
========================================================= */

export async function getUserPrescriptions(
  userId
) {
  return apiRequest(
    `/prescriptions/${userId}`
  );
}


/* =========================================================
   REFILL REQUESTS
========================================================= */

export async function createRefillRequest(
  userId,
  prescriptionId,
  notes = null
) {
  return apiRequest(
    "/refill-requests",
    {
      method: "POST",

      body: JSON.stringify({
        user_id:
          Number(userId),

        prescription_id:
          Number(
            prescriptionId
          ),

        notes,
      }),
    }
  );
}


export async function getUserRefillRequests(
  userId
) {
  return apiRequest(
    `/refill-requests/${userId}`
  );
}


/* =========================================================
   APPOINTMENTS
========================================================= */

export async function createAppointment(
  userId,
  appointmentType,
  appointmentDate,
  appointmentTime,
  note = null
) {
  return apiRequest(
    "/appointments",
    {
      method: "POST",

      body: JSON.stringify({
        user_id:
          Number(userId),

        appointment_type:
          appointmentType,

        appointment_date:
          appointmentDate,

        appointment_time:
          appointmentTime,

        note,
      }),
    }
  );
}


export async function getUserAppointments(
  userId
) {
  return apiRequest(
    `/appointments/${userId}`
  );
}


/* =========================================================
   PHARMACIST MESSAGES
========================================================= */

export async function createPharmacistMessage(
  userId,
  subject,
  message
) {
  return apiRequest(
    "/pharmacist-messages",
    {
      method: "POST",

      body: JSON.stringify({
        user_id:
          Number(userId),

        subject,

        message,
      }),
    }
  );
}


export async function getUserPharmacistMessages(
  userId
) {
  return apiRequest(
    `/pharmacist-messages/${userId}`
  );
}
/* =========================================================
   TECHNICAL SUPPORT
========================================================= */

export async function createSupportRequest(
  userId,
  subject,
  message
) {
  return apiRequest(
    "/support-requests",
    {
      method: "POST",

      body: JSON.stringify({
        user_id:
          Number(userId),

        subject,

        message,
      }),
    }
  );
}


export async function getUserSupportRequests(
  userId
) {
  return apiRequest(
    `/support-requests/${userId}`
  );
}
/* =========================================================
   NOTIFICATIONS
========================================================= */

export async function createNotification(
  userId,
  title,
  message,
  icon = "bell"
) {
  return apiRequest(
    "/notifications",
    {
      method: "POST",

      body: JSON.stringify({
        user_id:
          Number(userId),

        title,

        message,

        icon,
      }),
    }
  );
}


export async function getUserNotifications(
  userId
) {
  return apiRequest(
    `/notifications/${userId}`
  );
}


export async function markNotificationRead(
  notificationId
) {
  return apiRequest(
    `/notifications/${notificationId}/read`,
    {
      method: "PATCH",
    }
  );
}


export async function markAllNotificationsRead(
  userId
) {
  return apiRequest(
    `/notifications/${userId}/read-all`,
    {
      method: "PATCH",
    }
  );
}


export async function clearUserNotifications(
  userId
) {
  return apiRequest(
    `/notifications/${userId}`,
    {
      method: "DELETE",
    }
  );
}
/* =========================================================
   LAB RESULTS
========================================================= */

export async function getUserLabResults(
  userId
) {
  return apiRequest(
    `/lab-results/${userId}`
  );
}
/* =========================================================
   STORAGE HELPERS
========================================================= */

export function getStoredUser() {
  return {
    userId:
      localStorage.getItem(
        "user_id"
      ),

    name:
      localStorage.getItem(
        "user_name"
      ),

    email:
      localStorage.getItem(
        "user_email"
      ),

    role:
      localStorage.getItem(
        "user_role"
      ),

    token:
      localStorage.getItem(
        "access_token"
      ),
  };
}
/* =========================================================
   REMINDERS
========================================================= */

export async function getUserReminders(
  userId
) {
  return apiRequest(
    `/reminders/${userId}`
  );
}


export async function markReminderComplete(
  reminderId
) {
  return apiRequest(
    `/reminders/${reminderId}/complete`,
    {
      method: "PATCH",
    }
  );
}