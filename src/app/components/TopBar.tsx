import { Search, Bell, ChevronDown, Building2, LogOut } from "lucide-react";
import { useAuth } from "../../lib/auth/AuthProvider";

export function TopBar() {
  const { userLabel, logout, isAuthenticated } = useAuth();
  const initials = userLabel
    ? userLabel
        .split(/[@.\s]/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "U"
    : "U";

  return (
    <header className="h-11 shrink-0 flex items-center gap-3 px-4 border-b border-border bg-card">
      {/* Search */}
      <div className="flex-1 flex items-center gap-2 bg-secondary border border-border rounded px-3 py-1.5 max-w-96">
        <Search size={12} className="text-muted-foreground" />
        <input
          placeholder="Search repositories, agents, commits..."
          className="bg-transparent text-foreground placeholder:text-muted-foreground outline-none flex-1"
          style={{ fontSize: "12px" }}
        />
      </div>

      <div className="flex-1" />

      {/* Workspace selector */}
      <button className="flex items-center gap-2 bg-secondary border border-border rounded px-3 py-1.5 text-foreground hover:bg-input transition-colors" style={{ fontSize: "12px" }}>
        <Building2 size={12} className="text-muted-foreground" />
        <span>Active Corp Workspace</span>
        <ChevronDown size={11} className="text-muted-foreground" />
      </button>

      {/* Notifications */}
      <button
        type="button"
        aria-label="Notifications"
        className="relative p-1.5 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell size={15} />
        <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-primary border border-card" />
      </button>

      {/* User */}
      <button
        type="button"
        onClick={isAuthenticated ? logout : undefined}
        className="flex items-center gap-2 cursor-pointer group"
        title={isAuthenticated ? "Sign out" : undefined}
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0">
          <span className="text-white" style={{ fontSize: "10px", fontWeight: 700 }}>{initials}</span>
        </div>
        <div className="hidden sm:block text-left">
          <div style={{ fontSize: "12px" }} className="text-foreground leading-none">
            {userLabel ?? "Guest"}
          </div>
        </div>
        {isAuthenticated ? (
          <LogOut size={11} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        ) : (
          <ChevronDown size={11} className="text-muted-foreground" />
        )}
      </button>
    </header>
  );
}
