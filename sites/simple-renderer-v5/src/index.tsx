import { FrameProvider } from "@beiifeng/trustvc-frame-provider";
import penpalAdapter from "@beiifeng/trustvc-penpal-v5-adapter";
import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { registry } from "./templates";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<div style={{ width: "100%", height: "100%", textAlign: "center" }}>Loading...</div>}>
      <FrameProvider templateRegistry={registry} penpalAdapter={penpalAdapter} />
    </Suspense>
  </StrictMode>,
);
