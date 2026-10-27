import { HostProvider, type FrameActions, type HostActions, type HostActionsPayload } from "@beiifeng/decentralized-host-provider";
import clsx from "clsx";
import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { RawDocument } from "./interface";

type TemplateEntry = HostActionsPayload["UPDATE_TEMPLATES"][0];

const CertHostBase: React.ForwardRefRenderFunction<{ print: () => void }, { data: RawDocument | null; rendererUrl: string }> = (props, ref) => {
  const { rendererUrl } = props;
  const dispatchFrameRef = useRef<(action: FrameActions) => void>(null);
  const [height, setHeight] = useState<number>(0);
  const [templates, setTemplates] = useState<TemplateEntry[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const timeoutTimerRef = useRef<number | null>(null);

  useImperativeHandle(ref, () => ({
    print: () => {
      doPrint();
    },
  }));

  useEffect(() => {
    if (props.data) {
      timeoutTimerRef.current = window.setTimeout(() => {
        setLoading(false);
        setErrorMsg("Timeout, please check your network connection or template source.");
      }, 28 * 1000);

      if (dispatchFrameRef.current) {
        dispatchFrameRef.current({
          type: "RENDER_DOCUMENT",
          payload: { document: props.data },
        });
      }

      return () => {
        if (timeoutTimerRef.current) {
          clearTimeout(timeoutTimerRef.current);
        }
      };
    }
  }, [props.data]);

  const onConnectionChange = useCallback(
    (dispatchFrame: ((action: FrameActions) => void) | null) => {
      if (dispatchFrame && timeoutTimerRef.current) {
        clearTimeout(timeoutTimerRef.current);
        timeoutTimerRef.current = null;
      }
      dispatchFrameRef.current = dispatchFrame;
      if (dispatchFrameRef.current && props.data) {
        dispatchFrameRef.current({
          type: "RENDER_DOCUMENT",
          payload: {
            document: props.data as any,
          },
        });
      }
    },
    [props.data],
  );

  const handleDispatchHost = useCallback((action: HostActions) => {
    setLoading(false);
    // When the page loaded, we should clean error message.
    setErrorMsg("");
    if (action.type === "UPDATE_HEIGHT") {
      setHeight(action.payload);
    }
    if (action.type === "UPDATE_TEMPLATES") {
      const templates = action.payload || [];
      setTemplates(templates);
      setSelectedTemplate(templates[0].id);
    }
  }, []);

  const doPrint = () => {
    if (dispatchFrameRef.current) {
      const hasPrintTab = templates.filter((template) => template.id === "print").length > 0;
      if (!hasPrintTab) {
        dispatchFrameRef.current({ type: "PRINT" });
      } else {
        // To support print all function
        const lastSelected = selectedTemplate;
        dispatchFrameRef.current({ type: "SELECT_TEMPLATE", payload: "print" });
        new Promise((resolve) => setTimeout(resolve, 500)).then(() => {
          dispatchFrameRef.current?.({ type: "PRINT" });
          dispatchFrameRef.current?.({ type: "SELECT_TEMPLATE", payload: lastSelected });
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-full py-6">
      {templates.length > 0 && (
        <div className="inline-flex opc-tabs">
          {templates
            .filter((x) => x.id !== "print")
            .map((template) => (
              <div key={template.id} className={clsx("opc-tab", selectedTemplate === template.id ? "opc-tab-selected" : " ")}>
                <button
                  className="px-2 py-1"
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    dispatchFrameRef.current?.({ type: "SELECT_TEMPLATE", payload: template.id });
                  }}
                  aria-selected={selectedTemplate === template.id}
                  aria-label={template.label}
                  type="button"
                >
                  {template.label}
                </button>
              </div>
            ))}
          <div className="ml-auto mr-4">
            <button
              className="px-4 py-1 rounded-sm bg-blue-600 text-white cursor-pointer hover:bg-blue-700 active:bg-blue-500"
              onClick={doPrint}
              aria-label="Print"
              type="button"
              disabled={loading}
            >
              {loading ? "Loading..." : "Print"}
            </button>
          </div>
        </div>
      )}
      {!errorMsg && rendererUrl && (
        <div className="flex-auto overflow-auto scrollbar-stable">
          <div className="border border-gray-200 rounded-b-sm p-4">
            <HostProvider
              source={rendererUrl}
              dispatch={handleDispatchHost}
              onConnected={onConnectionChange}
              style={{
                border: 0,
                margin: 0,
                padding: 0,
                width: "100%",
                height: `${height ? height + 18 : 0}px`,
                overflowX: "hidden",
              }}
            />
            {loading && (
              <div className="w-full flex items-center justify-center" style={{ height: `calc(100dvh - var(--spacing) * 12 - 34px)` }}>
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span className="text-gray-500">Loading...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {errorMsg && <div>{errorMsg}</div>}
    </div>
  );
};

export const CertHost = React.forwardRef(CertHostBase);
