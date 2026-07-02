import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { OAuthSignIn } from "@/components/oauth-sign-in";
import { setAuthToken } from "@/utils/session";

function resolveReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const returnTo = searchParams.get("return_to");

  useEffect(() => {
    if (!token) return;
    setAuthToken(token);
    navigate(resolveReturnTo(returnTo), { replace: true });
  }, [token, returnTo, navigate]);

  if (token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Signing you in...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">Verify your email</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email to receive a verification link
          </p>
        </div>
        <OAuthSignIn provider="google" />
      </div>
    </div>
  );
}
