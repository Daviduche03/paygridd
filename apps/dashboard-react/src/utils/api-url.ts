export function getApiUrl(): string {
  const configured = import.meta.env.VITE_API_URL as string | undefined;
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  return "";
}
