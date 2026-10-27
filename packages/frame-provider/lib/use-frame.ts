import { useEffect, useState } from "react";
import type { Dispatcher, FrameActions, HostActions, PenpalAdapter } from "./types";

const TIMEOUT = 5000;

export type UseFrameProps = {
  penpalAdapter: PenpalAdapter;
  dispatch: Dispatcher<FrameActions>;
  onConnected: (hostDispatcher: Dispatcher<HostActions> | null) => void;
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
        .then((host: { dispatch: Dispatcher<HostActions> }) => {
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
    }
  }, [status, penpalAdapter, dispatch, onConnected]);

  return [status === "connected"] as const;
}
