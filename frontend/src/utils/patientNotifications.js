import {
  createNotification,
} from "../api";


export async function addPatientNotification({
  title,
  message,
  icon = "bell",
}) {
  const userId =
    localStorage.getItem(
      "user_id"
    );


  if (!userId) {
    return null;
  }


  try {
    const notification =
      await createNotification(
        userId,
        title,
        message,
        icon
      );


    window.dispatchEvent(
      new CustomEvent(
        "patient-notifications-updated"
      )
    );


    return notification;
  } catch (error) {
    console.error(
      "Unable to create notification:",
      error
    );

    return null;
  }
}