import clsx from "clsx";
import React, { useState } from "react";
import CertEditor from "./cert-editor";
import { CertHost } from "./cert-host";
import { CertSelector } from "./cert-selector";
import type { RawDocument } from "./interface";

const HideSelector: React.FC<{ onChange: (checked: boolean) => void }> = ({ onChange }) => {
  const id = React.useId();
  const [hideAfterRender, setHideAfterRender] = useState<boolean>(() => {
    return localStorage.getItem("hideAfterRender") === "true";
  });
  const toggleHideAfterRender = () => {
    const newValue = !hideAfterRender;
    setHideAfterRender(newValue);
    localStorage.setItem("hideAfterRender", JSON.stringify(newValue));
  };
  React.useEffect(() => {
    onChange(hideAfterRender);
  }, [hideAfterRender, onChange]);

  return (
    <div className="inline-flex items-center">
      <input type="checkbox" id={id} name="hideAfterRender" className="w-4 h-4" checked={hideAfterRender} onChange={toggleHideAfterRender} />
      <label htmlFor={id} className="ml-2 text-gray-500">
        Hide after render
      </label>
    </div>
  );
};

export const CertRender: React.FC = () => {
  const [rawDocument, setRawDocument] = useState<RawDocument | null>(null);
  const [rendererUrl, setRendererUrl] = useState<string>("");
  const [updateTimestamp, setUpdateTimestamp] = useState<number>(() => Date.now());

  const [hideSelector, setHideSelector] = useState<boolean>(false);
  const [hideEditor, setHideEditor] = useState<boolean>(true);

  const willHideSelectorRef = React.useRef<boolean>(false);
  const handleHideSelectorChange = React.useCallback((checked: boolean) => {
    willHideSelectorRef.current = checked;
  }, []);

  const onData = (rawDocument: RawDocument, rendererUrl: string) => {
    setRawDocument(rawDocument);
    setRendererUrl(rendererUrl);
    setUpdateTimestamp(Date.now());
    if (willHideSelectorRef.current) {
      setHideSelector(true);
    }
  };

  return (
    <div className="w-dvw h-dvh relative">
      <div className="flex size-full relative">
        <div className={clsx(hideSelector ? "w-0" : "w-[300px]")}>
          <div className={clsx(hideSelector ? "hidden" : "p-6 pr-0 inline-flex flex-col gap-2", "h-full")}>
            <CertSelector onRender={onData} />
            <HideSelector onChange={handleHideSelectorChange} />
          </div>
        </div>
        <div className="flex-auto inline-flex">
          <div className="relative inline-flex items-center">
            <button
              type="button"
              className="absolute cursor-pointer bg-gray-100 px-0.5 py-4 rounded-r-sm m-auto hover:bg-gray-200 hover:px-1 hover:py-5"
              onClick={() => setHideSelector((prev) => !prev)}
              aria-label="Toggle selector"
            >
              {hideSelector ? ">" : "<"}
            </button>
          </div>
          <div className="px-6 flex-auto">
            <CertHost key={updateTimestamp} data={rawDocument} rendererUrl={rendererUrl} />
          </div>
        </div>
      </div>
      <div className={clsx(hideEditor ? "" : "absolute inset-0 bg-[rgba(128,128,128,.1411764706)]")}></div>
      <div className={clsx("absolute bottom-0 left-0 right-0 flex flex-col bg-white")}>
        <div className="relative inline-flex justify-center">
          <button
            type="button"
            className="editor-toggle-btn absolute bottom-0"
            aria-expanded={!hideEditor}
            onClick={() => setHideEditor((prev) => !prev)}
            aria-label="Toggle editor"
          >
            {hideEditor ? "<" : ">"}
          </button>
        </div>
        <div className={clsx("flex-auto", hideEditor ? "invisible absolute bottom-0 left-0 right-0" : "visible")}>
          <CertEditor show={!hideEditor} data={rawDocument} />
        </div>
      </div>
    </div>
  );
};
