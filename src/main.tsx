import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { ConfigProvider } from "./lib/config/ConfigProvider.tsx";
import { AuthProvider } from "./lib/auth/AuthProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <ConfigProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ConfigProvider>
);