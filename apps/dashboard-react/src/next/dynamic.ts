import { lazy } from "react";

export default function dynamic(
  importFn: () => Promise<any>,
  options?: { ssr?: boolean },
) {
  return lazy(() =>
    importFn().then((mod: any) => {
      if (typeof mod === "function") {
        return { default: mod };
      }
      if (mod && typeof mod === "object" && "default" in mod) {
        return mod;
      }
      return { default: mod };
    }),
  );
}
