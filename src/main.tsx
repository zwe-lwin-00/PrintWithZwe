import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider } from "@/context/ConfigProvider";
import { ThemeProvider } from "@/context/ThemeProvider";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ConfigProvider>
  </StrictMode>,
);