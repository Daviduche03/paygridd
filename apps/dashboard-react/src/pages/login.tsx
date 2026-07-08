"use client";

import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LoginVideoBackground } from "@/components/login-video-background";
import { OAuthSignIn } from "@/components/oauth-sign-in";
import { Cookies } from "@/utils/constants";
import { setAuthToken } from "@/utils/session";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const waitlistParam = searchParams.get("waitlist");
  const error = searchParams.get("error");
  const returnTo = searchParams.get("return_to");
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) return;
    setAuthToken(token);
    navigate(returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/overview", {
      replace: true,
    });
  }, [token, returnTo, navigate]);

  const preferred = typeof document !== "undefined"
    ? document.cookie.replace(new RegExp(`(?:(?:^|.*;\\s*)${Cookies.PreferredSignInProvider}\\s*=\\s*([^;]*).*$)|^.*$`), "$1")
    : undefined;
  const showQueueNotice = waitlistParam === "1";

  const preferredSignInOption = (
    <OAuthSignIn
      provider="google"
      showLastUsed={!preferred || preferred === "google"}
    />
  );

  return (
    <div className="min-h-screen bg-background flex relative">
      <div className="fixed top-0 left-0 right-0 z-50 w-full">
        <nav className="w-full pointer-events-none">
          <div className="relative py-3 xl:py-4 px-4 sm:px-4 md:px-4 lg:px-4 xl:px-6 2xl:px-8 flex items-center">
            <Link
              to="/"
              className="flex items-center gap-2 hover:opacity-80 active:opacity-80 transition-opacity duration-200 pointer-events-auto"
            >
              <img src="/images/logo.png" alt="PayGrid" className="h-10 w-auto" />
            </Link>
          </div>
        </nav>
      </div>

      <LoginVideoBackground />

      <div className="hidden lg:block w-px bg-border my-2" />

      <div className="w-full lg:flex-1 flex flex-col justify-center items-center p-8 lg:p-12 pb-2">
        <div className="w-full max-w-md flex flex-col h-full">
          <div className="space-y-8 flex-1 flex flex-col justify-center">
            {error && (
              <div className="text-center space-y-2">
                <p className="font-sans text-sm text-red-500">{error}</p>
              </div>
            )}

            {showQueueNotice ? (
              <div className="text-center space-y-2">
                <h1 className="text-lg lg:text-xl mb-4 font-serif">
                  You're on the waitlist
                </h1>
                <p className="font-sans text-sm text-[#878787]">
                  PayGrid is not accepting new sign-ups right now. You've been
                  added to our queue and we'll email you as soon as a spot opens
                  up.
                </p>
              </div>
            ) : (
              <>
                <div className="text-center space-y-2">
                  <h1 className="text-lg lg:text-xl mb-4 font-serif">
                    Welcome to PayGrid
                  </h1>
                  <p className="font-sans text-sm text-[#878787]">
                    Sign in or create an account
                  </p>
                </div>

                <div className="space-y-3 flex items-center justify-center w-full">
                  {preferredSignInOption}
                </div>
              </>
            )}
          </div>

          <div className="text-center mt-auto">
            <p className="font-sans text-xs text-[#878787]">
              By signing in you agree to our{" "}
              <Link
                to="https://paygrid.xyz/terms"
                className="text-[#878787] hover:text-foreground transition-colors underline"
              >
                Terms of service
              </Link>{" "}
              &{" "}
              <Link
                to="https://paygrid.xyz/policy"
                className="text-[#878787] hover:text-foreground transition-colors underline"
              >
                Privacy policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
