import { AlertTriangle } from "lucide-react";
import { useRuntimeConfig } from "../../lib/config/ConfigProvider";

export function DemoBanner() {
  const { config } = useRuntimeConfig();
  if (!config?.demoMode && !config?.useMocks) return null;

  return (
    <div
      className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 border-b border-amber-500/30 bg-amber-500/10 text-amber-100"
      style={{ fontSize: "12px" }}
    >
      <AlertTriangle size={14} className="shrink-0" />
      <span>
        Demo mode — data is mocked or read-only. Connect SSO and live API for production reviews.
      </span>
    </div>
  );
}
