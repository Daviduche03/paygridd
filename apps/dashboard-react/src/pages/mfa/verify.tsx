"use client";

export default function MfaVerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">Two-factor authentication</h1>
          <p className="text-sm text-muted-foreground">
            Enter the code from your authenticator app
          </p>
        </div>
      </div>
    </div>
  );
}
