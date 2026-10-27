import { connect as connectV8, WindowMessenger as WindowMessengerV8 } from "penpal";
import { connectToChild as connectToChildV4 } from "penpal-v4";
import { connectToChild as connectToChildV6 } from "penpal-v6";
import { connect as connectV7, WindowMessenger as WindowMessengerV7 } from "penpal-v7";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { Dispatcher, FrameActions, HostActions, HostActionsPayload } from "./types";

const TIMEOUT = 5000;

export type UseHostProps = {
  source: string;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  dispatch: Dispatcher<HostActions>;
  onConnected: (frameDispatcher: Dispatcher<FrameActions> | null) => void;
};

export function useHost(props: UseHostProps) {
  const { source, iframeRef, dispatch, onConnected } = props;
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected" | "timeout">("disconnected");
  const templatesRef = useRef<HostActionsPayload["UPDATE_TEMPLATES"]>([]);

  const dispatchProxy = useMemo(() => {
    return (action: HostActions) => {
      if (action.type === "UPDATE_TEMPLATES") {
        templatesRef.current = action.payload;
      }
      return dispatch(action);
    };
  }, [dispatch]);

  const methods = useMemo(
    () => ({
      dispatch: dispatchProxy,
      updateHeight: (height: number) => dispatchProxy({ type: "UPDATE_HEIGHT", payload: height }),
      updateTemplates: (templates: HostActionsPayload["UPDATE_TEMPLATES"]) => dispatchProxy({ type: "UPDATE_TEMPLATES", payload: templates }),
      handleObfuscation: (field: string) => dispatchProxy({ type: "OBFUSCATE", payload: field }),
    }),
    [dispatchProxy],
  );

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow && status === "disconnected" && source) {
      const connectionV8 = connectV8({
        messenger: new WindowMessengerV8({ remoteWindow: iframe.contentWindow!, allowedOrigins: [new URL(source).origin] }),
        methods,
        timeout: TIMEOUT,
      });
      const connectionV7 = connectV7({
        messenger: new WindowMessengerV7({ remoteWindow: iframe.contentWindow!, allowedOrigins: [new URL(source).origin] }),
        methods,
        timeout: TIMEOUT,
      });
      const connectionV6 = connectToChildV6({
        iframe: iframe,
        methods,
        timeout: TIMEOUT,
      });
      const connectionV4 = connectToChildV4({
        iframe: iframe,
        methods,
        timeout: TIMEOUT,
      });

      Promise.any([connectionV8.promise, connectionV7.promise, connectionV6.promise, connectionV4.promise])
        .then((child: any) => {
          setStatus("connected");
          const frameDispatcher = (action: FrameActions) => {
            if (child.dispatch) {
              child.dispatch(action);
            } else {
              if (action.type === "RENDER_DOCUMENT" && child.renderDocument) {
                child.renderDocument(action.payload.document, action.payload.rawDocument);
              } else if (action.type === "SELECT_TEMPLATE" && child.selectTemplateTab) {
                const index = templatesRef.current.findIndex((template) => template.id === action.payload);
                if (index === -1) {
                  console.error(`Unable to find the index associated with the label ${action.payload}`);
                }
                child.selectTemplateTab(index);
              } else if (action.type === "PRINT" && child.print) {
                child.print();
              }
            }
          };
          onConnected(frameDispatcher);
        })
        .catch((err: AggregateError) => {
          console.error("Failed to connect to frame");
          if (err.errors.map((e) => e.code).some((c) => c === "CONNECTION_TIMEOUT" || c === "ConnectionTimeout")) {
            setStatus("timeout");
          } else {
            setStatus("disconnected");
          }
        });
    }
  }, [source, iframeRef, methods, onConnected, status]);

  return [status === "connected", status === "timeout"] as const;
}
