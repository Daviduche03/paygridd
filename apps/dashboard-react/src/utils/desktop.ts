export function isDesktopApp() {
  return false;
}

export function getDesktopSchemeUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}
