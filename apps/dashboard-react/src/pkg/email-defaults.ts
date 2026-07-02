export const DEFAULT_EMAIL_BUTTON_TEXT = "View Invoice";

export function defaultEmailSubject(invoiceNumber?: string) {
  return invoiceNumber ? `Invoice ${invoiceNumber}` : "Invoice";
}

export function defaultEmailHeading(customerName?: string) {
  return customerName ? `Hi ${customerName}` : "Hi";
}

export function defaultEmailBody() {
  return "Your invoice is ready. Click the button below to view and pay.";
}
