import { useEffect, useRef, useState, type CSSProperties } from "react";
import ConnectionFailureTemplate from "./connection-failure.template";
import type { Dispatch, FrameActions, HostActions } from "./types";
import { useHost } from "./use-host";

export type HostProviderProps = {
  source: string | undefined;
  dispatch: Dispatch<HostActions>;
  onConnected: (frameDispatcher: Dispatch<FrameActions> | null) => void;
  className?: string;
  style?: CSSProperties;
  id?: string;
  title?: string;
  /**
   * custom iframe sandbox properties to apply, will override default
   */
  sandbox?: string;
  /**
   * Use a fallback renderer when the frame fails to load
   * @default false
   */
  useFallbackRenderer?: boolean;
};

const DEFAULT_RENDERER_URL = `https://generic-templates.tradetrust.io`;

export default function HostProvider(props: HostProviderProps) {
  const {
    id,
    title,
    style,
    className,
    dispatch,
    onConnected,
    sandbox = "allow-scripts allow-same-origin allow-modals allow-popups",
    useFallbackRenderer = false,
  } = props;
  const [source, setSource] = useState(props.source ?? DEFAULT_RENDERER_URL);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [connected, timeout] = useHost({ source, iframeRef: iframeRef, dispatch, onConnected });

  useEffect(() => {
    if (useFallbackRenderer && timeout) {
      // What's the meaning of this?
      setSource(DEFAULT_RENDERER_URL);
    }
  }, [useFallbackRenderer, timeout]);

  return (
    <>
      {timeout && !useFallbackRenderer ? (
        <ConnectionFailureTemplate source={source} />
      ) : (
        <iframe
          id={id ?? "iframe"}
          ref={iframeRef}
          title={title ?? "Decentralized Rendered Certificate"}
          src={source}
          style={connected ? style : { opacity: 0, visibility: "hidden" }}
          className={className}
          sandbox={sandbox}
        />
      )}
    </>
  );
}
