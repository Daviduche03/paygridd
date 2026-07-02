"use client";

export default function OAuthAuthorizePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">Authorize Application</h1>
          <p className="text-sm text-muted-foreground">
            An application is requesting access to your account
          </p>
        </div>
      </div>
    </div>
  );
}
