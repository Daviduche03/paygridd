import helmet from "helmet";
import { env } from "@/config/env";

function hostnameFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function getContentSecurityPolicyDirectives() {
  const imgSources = new Set<string>([
    "'self'",
    "data:",
    "blob:",
    "https://cdn.paygrid.xyz",
    "https://img.logo.dev",
    "https://*.googleusercontent.com",
  ]);

  const connectSources = new Set<string>(["'self'"]);
  const frameSources = new Set<string>(["'self'"]);

  for (const url of [env.R2_PUBLIC_URL, env.FRONTEND_URL]) {
    const host = hostnameFromUrl(url);
    if (host) {
      imgSources.add(`https://${host}`);
      connectSources.add(`https://${host}`);
    }
  }

  return {
    ...helmet.contentSecurityPolicy.getDefaultDirectives(),
    "script-src": [
      "'self'",
      "https://js.stripe.com",
    ],
    "frame-src": [
      ...frameSources,
      "https://js.stripe.com",
      "https://hooks.stripe.com",
    ],
    "img-src": [...imgSources],
    "connect-src": [
      ...connectSources,
      "https://*.supabase.co",
      "https://api.stripe.com",
      "https://merchant-ui-api.stripe.com",
      "https://r.stripe.com",
      "https://*.stripe.com",
      "https://*.stripe.network",
    ],
    "font-src": ["'self'", "https:", "data:", "https://fonts.gstatic.com"],
    "style-src": [
      "'self'",
      "https:",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
    ],
  };
}

export function applySecurityMiddleware(
  app: import("express").Express,
): void {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: getContentSecurityPolicyDirectives(),
      },
    }),
  );
}