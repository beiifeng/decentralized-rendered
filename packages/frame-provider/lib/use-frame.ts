import { useEffect, useState } from "react";
import type { Dispatch, FrameActions, HostActions, PenpalAdapter } from "./types";

const TIMEOUT = 5000;

export type UseFrameProps = {
  penpalAdapter: PenpalAdapter;
  dispatch: Dispatch<FrameActions>;
  onConnected: (hostDispatcher: Dispatch<HostActions> | null) => void;
};

export function useFrame(props: UseFrameProps) {
  const { penpalAdapter, dispatch, onConnected } = props;
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected" | "timeout">("disconnected");

  useEffect(() => {
    if (status === "disconnected") {
      const connection = penpalAdapter({
        methods: {
          dispatch,
        },
        timeout: TIMEOUT,
      });

      connection.promise
        .then((host: { dispatch: Dispatch<HostActions> }) => {
          setStatus("connected");
          onConnected(host.dispatch);
        })
        .catch((error: any) => {
          if (error.code === penpalAdapter.ErrorCode.ConnectionTimeout) {
            setStatus("timeout");
          } else {
            setStatus("disconnected");
          }
          onConnected(null);
        });

      return () => {
        connection.destroy();
        setStatus("disconnected");
        onConnected(null);
      };
    }
  }, [status, penpalAdapter, dispatch, onConnected]);

  return [status === "connected"] as const;
}
