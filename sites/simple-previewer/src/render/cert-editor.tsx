import { lazy, Suspense, useRef } from "react";
import type { RawDocument } from "./interface";

const CertEditorLazy = lazy(() => import("./cert-editor.lazy"));

export type CertEditorProps = {
  show: boolean;
  data: RawDocument | null;
};
export default function CertEditor({ show, data }: CertEditorProps) {
  const loadedRef = useRef(false);
  if (show && !loadedRef.current) {
    loadedRef.current = true;
  }
  if (!loadedRef.current) {
    return null;
  }
  return (
    <Suspense fallback={<div className="h-[90vh] max-h-[90vh] flex items-center justify-center">Loading editor...</div>}>
      <CertEditorLazy data={data} />
    </Suspense>
  );
}
