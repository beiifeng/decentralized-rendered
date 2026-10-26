import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { CertRender } from "./render";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CertRender />
  </StrictMode>,
);
