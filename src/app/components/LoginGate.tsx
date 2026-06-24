import { useState } from "react";
import { LogIn, ShieldAlert, Github, ChevronRight, Sparkles } from "lucide-react";
import { useAuth } from "../../lib/auth/AuthProvider";
import { useRuntimeConfig } from "../../lib/config/ConfigProvider";
import { Button } from "./ui/button";

export function LoginGate() {
  const { config, isLoading: configLoading, error: configError } = useRuntimeConfig();
  const { login, loginMock, isLoading, error } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"preset" | "custom">("preset");
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<"google" | "github">("google");

  const displayError = error ?? configError;

  const PRESETS = [
    {
      name: "Jane Taylor",
      email: "jane.taylor@stevedores.dev",
      role: "Principal QA Lead",
      avatar: "JT",
      provider: "google" as const,
      color: "from-violet-500 to-indigo-500",
    },
    {
      name: "Marcus Vance",
      email: "marcus.vance@stevedores.dev",
      role: "Security Engineer",
      avatar: "MV",
      provider: "github" as const,
      color: "from-emerald-500 to-teal-500",
    },
    {
      name: "Devon Carter",
      email: "devon.carter@stevedores.dev",
      role: "SRE & DevOps Lead",
      avatar: "DC",
      provider: "github" as const,
      color: "from-amber-500 to-orange-500",
    },
  ];

  if (configLoading || isLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#030712] text-foreground">
        <div className="relative flex items-center justify-center mb-4">
          <div className="absolute h-12 w-12 rounded-full border-t-2 border-primary border-r-2 animate-spin" />
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
        </div>
        <p className="text-muted-foreground/80 tracking-wide font-medium animate-pulse" style={{ fontSize: "13px" }}>
          Authenticating with AIVCS...
        </p>
      </div>
    );
  }

  const handlePresetLogin = (preset: typeof PRESETS[0]) => {
    loginMock(preset.provider, preset.name, preset.email);
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customEmail.trim()) return;
    loginMock(selectedProvider, customName.trim(), customEmail.trim());
  };

  return (
    <div className="relative flex h-screen w-screen items-center justify-center bg-[#030712] px-6 overflow-hidden">
      {/* Immersive background decoration */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-violet-500/10 blur-[120px] pointer-events-none" />
      
      {/* Background cyber grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.06] bg-black/40 backdrop-blur-xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-white/[0.1]">
        {/* Decorative Top Glow Line */}
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <div className="mb-8 flex items-center gap-4.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <ShieldAlert size={22} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-foreground tracking-tight" style={{ fontSize: "20px", fontWeight: 700 }}>
              Sign in to AIVCS
            </h1>
            <p className="text-muted-foreground/60 mt-0.5" style={{ fontSize: "13px" }}>
              Human-in-the-loop review console
            </p>
          </div>
        </div>

        {displayError ? (
          <div
            className="mb-5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-red-400 border-l-4 border-l-red-500"
            style={{ fontSize: "12.5px", lineHeight: 1.4 }}
          >
            <div className="font-semibold text-red-300">Authentication Error</div>
            {displayError.message}
          </div>
        ) : null}

        {config?.useMocks ? (
          /* Mock Mode SSO Preview */
          <div>
            <div className="flex rounded-lg bg-white/[0.03] p-1 border border-white/[0.05] mb-6">
              <button
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === "preset"
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("preset")}
              >
                Demo Profiles
              </button>
              <button
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === "custom"
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("custom")}
              >
                Custom Identity
              </button>
            </div>

            {activeTab === "preset" ? (
              <div className="space-y-3">
                <p className="text-muted-foreground/60 mb-3 px-1" style={{ fontSize: "12px" }}>
                  Select a team member profile to login and review simulated AI pull requests:
                </p>
                {PRESETS.map((preset) => (
                  <button
                    key={preset.email}
                    onClick={() => handlePresetLogin(preset)}
                    className="w-full flex items-center gap-3.5 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.04] hover:border-white/[0.08] p-3 text-left transition-all duration-200 group active:scale-[0.98]"
                  >
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${preset.color} flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0`}>
                      {preset.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground/90 group-hover:text-primary transition-colors flex items-center gap-1.5">
                        {preset.name}
                        <span className="text-[10px] font-mono px-1.5 py-px rounded bg-white/5 border border-white/5 text-muted-foreground/75 font-normal capitalize">
                          {preset.provider}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground/65 mt-0.5 truncate">{preset.role} · {preset.email}</div>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            ) : (
              <form onSubmit={handleCustomLogin} className="space-y-4">
                <div>
                  <label className="block text-muted-foreground/70 mb-1.5 px-0.5" style={{ fontSize: "12px" }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] focus:bg-white/[0.02] focus:border-primary px-3.5 py-2 text-xs text-foreground outline-none transition-all placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground/70 mb-1.5 px-0.5" style={{ fontSize: "12px" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="e.g. sarah.connor@sky.net"
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] focus:bg-white/[0.02] focus:border-primary px-3.5 py-2 text-xs text-foreground outline-none transition-all placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground/70 mb-2 px-0.5" style={{ fontSize: "12px" }}>
                    Identity Provider
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedProvider("google")}
                      className={`flex items-center justify-center gap-2 py-2 border rounded-lg text-xs font-semibold transition-all ${
                        selectedProvider === "google"
                          ? "border-primary/50 bg-primary/10 text-primary shadow-sm"
                          : "border-white/[0.08] bg-white/[0.01] text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                      }`}
                    >
                      <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.96 5.96 0 018.01 12.553a5.96 5.96 0 015.98-5.968c1.55 0 2.946.595 4.02 1.553l3.078-3.078C19.224 3.324 16.711 2 13.99 2 8.473 2 4 6.514 4 12.032s4.473 10.031 9.99 10.031c5.76 0 10.122-4.048 10.122-10.122 0-.648-.065-1.282-.181-1.888l-11.691.232z"/>
                      </svg>
                      Google
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedProvider("github")}
                      className={`flex items-center justify-center gap-2 py-2 border rounded-lg text-xs font-semibold transition-all ${
                        selectedProvider === "github"
                          ? "border-primary/50 bg-primary/10 text-primary shadow-sm"
                          : "border-white/[0.08] bg-white/[0.01] text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                      }`}
                    >
                      <Github size={14} />
                      GitHub
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full gap-2 mt-2 h-9 text-xs font-semibold">
                  <LogIn size={14} />
                  Authorize & Sign In
                </Button>
              </form>
            )}
          </div>
        ) : (
          /* Live Production OIDC SSO Flow */
          <div className="space-y-4">
            <p className="text-muted-foreground/75 mb-6 leading-relaxed" style={{ fontSize: "13.5px" }}>
              Authenticate with your organization SSO to access live pull requests, agent intent
              threads, and audit data from <code className="text-foreground font-mono bg-white/5 border border-white/5 rounded px-1">{config?.apiUrl ?? "api.aivcs.io"}</code>.
            </p>

            <div className="space-y-3">
              <Button
                type="button"
                className="w-full h-10 gap-2.5 bg-white text-black hover:bg-neutral-200 transition-all font-semibold text-xs rounded-xl"
                onClick={() => void login()}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.35v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.13z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </Button>

              <Button
                type="button"
                className="w-full h-10 gap-2.5 bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 transition-all font-semibold text-xs rounded-xl"
                onClick={() => void login()}
              >
                <Github size={16} />
                Sign in with GitHub
              </Button>
            </div>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-white/[0.04] text-center">
          <p className="text-[11px] text-muted-foreground/35 tracking-wider uppercase font-mono">
            AIVCS Secure Identity Protocol v1.4
          </p>
        </div>
      </div>
    </div>
  );
}
