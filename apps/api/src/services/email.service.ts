import { env } from "@/config/env";
import { logger } from "@/utils/logger";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

async function sendViaSmtp(payload: EmailPayload, from: string) {
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
  await transporter.sendMail({
    from,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  });
}

export const emailService = {
  async send(payload: EmailPayload): Promise<{ sent: boolean; provider?: string }> {
    const from = env.FROM_EMAIL;
    if (!from) {
      if (env.NODE_ENV === "development") {
        logger.info(`[EMAIL LOG] No email provider configured. Would send. Subject: "${payload.subject}" To: ${payload.to}`);
        return { sent: true };
      }
      throw new Error("FROM_EMAIL is not configured. Set FROM_EMAIL and SMTP_HOST/SMTP_USER/SMTP_PASS to send emails.");
    }

    const hasSmtp = env.SMTP_HOST && env.SMTP_USER;

    if (hasSmtp) {
      try {
        await sendViaSmtp(payload, from);
        logger.info(`Email sent via SMTP to ${payload.to}: ${payload.subject}`);
        return { sent: true, provider: "smtp" };
      } catch (error) {
        logger.error(`Failed to send email via SMTP to ${payload.to}: ${error}`);
        throw error;
      }
    }

    if (env.NODE_ENV === "production") {
      throw new Error("No email provider configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and FROM_EMAIL to send emails.");
    }

    logger.info(`[EMAIL LOG] No email provider configured. Would send. Subject: "${payload.subject}" To: ${payload.to}`);
    return { sent: true };
  },

  async sendInvoiceNotification(params: {
    to: string;
    customerName: string;
    businessName: string;
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    paymentUrl: string;
  }) {
    const { to, customerName, businessName, invoiceNumber, amount, dueDate, paymentUrl } = params;
    return this.send({
      to,
      subject: `Invoice ${invoiceNumber} from ${businessName}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f6f8fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f8fa; padding: 32px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 32px 32px 0;">
              <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 4px;">Invoice ${invoiceNumber}</h1>
              <p style="color: #64748b; font-size: 14px; margin: 0 0 24px;">From <strong>${businessName}</strong></p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                    <p style="margin: 0; font-size: 12px; color: #64748b;">Amount Due</p>
                    <p style="margin: 4px 0 0; font-size: 24px; font-weight: 700;">₦${amount}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                    <p style="margin: 0; font-size: 12px; color: #64748b;">Due Date</p>
                    <p style="margin: 4px 0 0; font-size: 14px;">${dueDate}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px;">
              <a href="${paymentUrl}" style="display: inline-block; padding: 12px 24px; background-color: #18181b; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">View Invoice & Pay</a>
              <p style="margin: 12px 0 0; font-size: 12px; color: #94a3b8;">You can pay via bank transfer using the payment details on the invoice page.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">PayGrid — Programmable Accounts Receivable</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });
  },

  async sendPaymentConfirmation(params: {
    to: string;
    customerName: string;
    businessName: string;
    invoiceNumber: string;
    amount: string;
    paidAt: string;
  }) {
    const { to, customerName, businessName, invoiceNumber, amount, paidAt } = params;
    return this.send({
      to,
      subject: `Payment Received — Invoice ${invoiceNumber}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f6f8fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f8fa; padding: 32px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 32px 32px 0;">
              <div style="width: 48px; height: 48px; background-color: #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; font-size: 24px;">&#10003;</div>
              <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 4px;">Payment Confirmed</h1>
              <p style="color: #64748b; font-size: 14px; margin: 0 0 24px;">Invoice <strong>${invoiceNumber}</strong> has been paid.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                    <p style="margin: 0; font-size: 12px; color: #64748b;">Amount Paid</p>
                    <p style="margin: 4px 0 0; font-size: 20px; font-weight: 700;">₦${amount}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                    <p style="margin: 0; font-size: 12px; color: #64748b;">Paid At</p>
                    <p style="margin: 4px 0 0; font-size: 14px;">${paidAt}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <p style="margin: 0; font-size: 12px; color: #64748b;">Customer</p>
                    <p style="margin: 4px 0 0; font-size: 14px;">${customerName}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">PayGrid — Programmable Accounts Receivable</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });
  },

  async sendMemberInvite(params: {
    to: string;
    businessName: string;
    invitedByName: string;
    inviteUrl: string;
  }) {
    const { to, businessName, invitedByName, inviteUrl } = params;
    return this.send({
      to,
      subject: `You've been invited to join ${businessName} on PayGrid`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f6f8fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f8fa; padding: 32px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 32px 32px 0;">
              <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 4px;">You're Invited</h1>
              <p style="color: #64748b; font-size: 14px; margin: 0 0 24px;"><strong>${invitedByName}</strong> has invited you to join <strong>${businessName}</strong> on PayGrid.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 24px;">
              <p style="font-size: 14px; color: #475569; margin: 0 0 16px;">PayGrid helps businesses manage invoices, virtual accounts, and payment reconciliation. Join your team to get started.</p>
              <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #18181b; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">Accept Invitation</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">If you weren't expecting this invitation, you can safely ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });
  },
};
