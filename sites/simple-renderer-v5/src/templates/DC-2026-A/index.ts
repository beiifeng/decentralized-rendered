import { lazy } from "react";

const Certificate = lazy(() => import("./certificate"));

export default [
  {
    id: "certificate",
    label: "Certificate",
    template: Certificate,
  },
];
