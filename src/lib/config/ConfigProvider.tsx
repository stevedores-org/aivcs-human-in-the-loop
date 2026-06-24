import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { loadRuntimeConfig, type RuntimeConfig } from "./runtime-config";

type ConfigContextValue = {
  config: RuntimeConfig | null;
  isLoading: boolean;
  error: Error | null;
};

const ConfigContext = createContext<ConfigContextValue>({
  config: null,
  isLoading: true,
  error: null,
});

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<RuntimeConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadRuntimeConfig()
      .then((loaded) => {
        setConfig(loaded);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      });
  }, []);

  return (
    <ConfigContext.Provider value={{ config, isLoading, error }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useRuntimeConfig(): ConfigContextValue {
  return useContext(ConfigContext);
}
