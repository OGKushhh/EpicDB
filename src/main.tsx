import "@fontsource-variable/outfit/index.css";
import "@fontsource-variable/fira-code/index.css";
import "~/index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "~/App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
