import { LogIn, ShieldAlert } from "lucide-react";
import { useAuth } from "../../lib/auth/AuthProvider";
import { useRuntimeConfig } from "../../lib/config/ConfigProvider";
import { Button } from "./ui/button";

export function LoginGate() {
  const { config, isLoading: configLoading, error: configError } = useRuntimeConfig();
  const { login, isLoading, error } = useAuth();

  const displayError = error ?? configError;

  if (configLoading || isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <p className="text-muted-foreground" style={{ fontSize: "14px" }}>
          Loading session…
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h1 className="text-foreground" style={{ fontSize: "18px", fontWeight: 600 }}>
              Sign in to AIVCS
            </h1>
            <p className="text-muted-foreground" style={{ fontSize: "13px" }}>
              Human-in-the-loop review console
            </p>
          </div>
        </div>

        <p className="mb-6 text-muted-foreground" style={{ fontSize: "13px", lineHeight: 1.5 }}>
          Authenticate with your organization SSO to access live pull requests, agent intent
          threads, and audit data from <code className="text-foreground">{config?.apiUrl ?? "api.aivcs.io"}</code>.
        </p>

        {displayError ? (
          <div
            className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive"
            style={{ fontSize: "12px" }}
          >
            {displayError.message}
          </div>
        ) : null}

        <Button className="w-full gap-2" onClick={() => void login()}>
          <LogIn size={16} />
          Continue with SSO
        </Button>
      </div>
    </div>
  );
}
