/**
 * Browser notification helpers for Hegemon.
 */

/** Ask for browser notification permission. Returns true if granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    return false;
  }
  if (Notification.permission === "granted") {
    return true;
  }
  if (Notification.permission === "denied") {
    return false;
  }
  const result = await Notification.requestPermission();
  return result === "granted";
}

/** Send a browser notification if permission has been granted. */
export function sendNotification(
  title: string,
  body: string,
  icon?: string,
): Notification | null {
  if (!("Notification" in window)) {
    return null;
  }
  if (Notification.permission !== "granted") {
    return null;
  }
  return new Notification(title, { body, icon });
}
