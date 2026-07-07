export function getUrl() {
  const configured = import.meta.env.VITE_APP_URL as string | undefined;
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  if (import.meta.env.PROD) {
    return "https://app.paygrid.xyz";
  }

  return "http://localhost:3001";
}