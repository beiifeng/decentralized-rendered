import clsx from "clsx";
import React, { type ChangeEvent, useEffect, useRef, useState } from "react";
import getData from "../utils/get-data";

export type CertSelectorProps = {
  onRender: (rawDocument: any, rendererUrl: string) => void;
  onChange?: (rawDocument: any) => void;
};

const CertSelectorBase: React.FC<CertSelectorProps> = (props: CertSelectorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rendererUrlRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (rendererUrlRef.current) {
      rendererUrlRef.current.value = JSON.parse(localStorage.getItem("overrideRendererUrl") || '""');
    }
  }, []);

  const onOverrideRendererUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    try {
      localStorage.setItem("overrideRendererUrl", JSON.stringify(e.target.value));
    } catch (e: any) {
      console.warn("Error on store template url", e);
    }
  };

  const clearValidate = () => {
    setErrorMsg("");
  };

  const setValidate = (msg: string) => {
    setErrorMsg(msg);
  };

  const readFileText = (file: File | undefined) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = (ev: ProgressEvent<FileReader>) => {
        const text = ev.target?.result as string;
        if (textareaRef.current) {
          textareaRef.current.value = text;
          clearValidate();
        }
      };
      reader.readAsText(file);
    }
  };

  const onChooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target?.files?.[0];
    readFileText(file);
  };

  const onRenderClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!textareaRef.current) {
      return;
    }
    const text = textareaRef.current.value;
    if (!text) {
      setValidate("Please enter content before render!");
      e.stopPropagation();
      return;
    }
    let rendererUrl = "";
    if (rendererUrlRef.current) {
      rendererUrl = rendererUrlRef.current.value.trim();
      if (rendererUrl) {
        try {
          rendererUrl = new URL(rendererUrl).href;
        } catch {
          // If the URL is invalid, we will not set it
        }
      }
    }
    try {
      let rawDocument = JSON.parse(text);
      if (rawDocument.$template || rawDocument.data?.$template) {
        // OA 2.0
        rawDocument = getData(rawDocument);
      }
      if (!rendererUrl) {
        if (rawDocument["@context"]) {
          // TrustVC
          if (Array.isArray(rawDocument.renderMethod)) {
            rendererUrl = rawDocument.renderMethod[0].id;
          } else {
            rendererUrl = rawDocument.renderMethod?.id;
          }
        } else if (rawDocument.$template) {
          // OA 1.5 or 2.0
          if (rawDocument.$template) {
            if (typeof rawDocument.$template !== "string" && rawDocument.$template.url) {
              // OA 2.0
              rendererUrl = rawDocument.$template.url;
            } else {
              // OA 1.5
              rendererUrl = "https://legacy.opencerts.io/";
            }
          }
        }
      }
      props.onRender(rawDocument, rendererUrl);
    } catch {
      setValidate("Invalid OpenCerts data format.");
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className="">
        <input
          type="file"
          className="w-full rounded-sm cursor-pointer bg-gray-100 file:bg-gray-200 file:px-2 file:py-1 file:cursor-pointer text-sm"
          aria-label="Choose an opencerts file"
          accept=".opencert,.json,.txt,.oa,.tt"
          onChange={onChooseFile}
        />
      </div>
      <div className="flex-auto flex flex-col">
        <textarea
          ref={textareaRef}
          className={clsx("flex-auto border border-gray-300 rounded-sm p-1 leading-5 text-sm rounded-r-none", errorMsg ? "border-red-500 outline-red-500" : "")}
          aria-label="Content"
          aria-invalid={errorMsg ? "true" : "false"}
          placeholder="Please enter raw document or wrapped document."
          onInput={() => clearValidate()}
          name="rawDocument"
          spellCheck="false"
        ></textarea>
        {errorMsg && <div className="text-red-500 text-sm mt-1">{errorMsg}</div>}
      </div>
      <div>
        <button
          type="button"
          className="w-full p-1 bg-blue-600 rounded-sm text-white cursor-pointer hover:bg-blue-700 active:bg-blue-500"
          onClick={onRenderClick}
        >
          Render
        </button>
      </div>
      <div>
        <label>
          <span className="text-sm">Override renderer url</span>
          <input
            type="text"
            ref={rendererUrlRef}
            className="border border-gray-300 rounded-sm w-full mt-1 px-1"
            name="overrideRendererUrl"
            onChange={onOverrideRendererUrlChange}
          />
        </label>
      </div>
    </div>
  );
};

export const CertSelector = React.memo(CertSelectorBase);
