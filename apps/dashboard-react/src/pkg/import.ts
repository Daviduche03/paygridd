export function formatAmountValue(value: string) {
  const cleaned = value.replace(/[^0-9.,\-]/g, "");
  const num = parseFloat(cleaned.replace(/,/g, ""));
  return Number.isNaN(num) ? 0 : num;
}

export function formatDate(value: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}
