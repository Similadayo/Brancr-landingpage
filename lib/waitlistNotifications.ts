import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.WAITLIST_FROM_EMAIL ?? "Brancr <waitlist@brancr.com>";
const notificationEmails = process.env.WAITLIST_NOTIFICATION_EMAIL?.split(",").map((email) => email.trim()).filter(Boolean);

const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

type WaitlistNotificationPayload = {
  name: string;
  email: string;
  timestamp: string;
};

export async function notifyWaitlistSignup(payload: WaitlistNotificationPayload) {
  if (!resendClient || !notificationEmails?.length) {
    if (!resendClient) {
      console.warn("Resend client not configured. Set RESEND_API_KEY to enable waitlist notifications.");
    }

    if (!notificationEmails?.length) {
      console.warn("WAITLIST_NOTIFICATION_EMAIL not configured. Unable to send waitlist notifications.");
    }

    return;
  }

  try {
    await resendClient.emails.send({
      from: resendFromEmail,
      to: notificationEmails,
      subject: `New Waitlist Signup: ${payload.name}`,
      text: `A new person has joined the Brancr waitlist.\n\nName: ${payload.name}\nEmail: ${payload.email}\nJoined: ${new Date(payload.timestamp).toLocaleString()}\n`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #111827;">New Waitlist Signup</h2>
          <p>A new person has joined the Brancr waitlist.</p>
          <ul>
            <li><strong>Name:</strong> ${payload.name}</li>
            <li><strong>Email:</strong> ${payload.email}</li>
            <li><strong>Joined:</strong> ${new Date(payload.timestamp).toLocaleString()}</li>
          </ul>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send waitlist notification email:", error);
  }
}
