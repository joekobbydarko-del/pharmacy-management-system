const STORAGE_KEY = "patient_notifications";

export function getPatientNotifications() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addPatientNotification({
  title,
  message,
  icon = "bell",
}) {
  const current = getPatientNotifications();

  const notification = {
    id: `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    title,
    message,
    icon,
    time: new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date()),
    read: false,
    createdAt: new Date().toISOString(),
  };

  const updated = [
    notification,
    ...current,
  ].slice(0, 30);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updated)
  );

  window.dispatchEvent(
    new CustomEvent(
      "patient-notifications-updated"
    )
  );

  return notification;
}