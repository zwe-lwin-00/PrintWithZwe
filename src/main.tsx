import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider } from "@/context/ConfigProvider";
import { LocaleProvider } from "@/context/LocaleProvider";
import { ThemeProvider } from "@/context/ThemeProvider";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider>
      <LocaleProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </LocaleProvider>
    </ConfigProvider>
  </StrictMode>,
);