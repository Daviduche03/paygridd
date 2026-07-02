"use client";

export default function MfaSetupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 p-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">Set up two-factor authentication</h1>
          <p className="text-sm text-muted-foreground">
            Scan the QR code with your authenticator app
          </p>
        </div>
        <div className="flex justify-center">
          <div className="size-48 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
            QR Code
          </div>
        </div>
      </div>
    </div>
  );
}
