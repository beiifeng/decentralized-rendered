import type { Dispatcher, HostActions, PenpalAdapter } from "@beiifeng/trustvc-frame-provider";
import { connectToParent, ErrorCode } from "penpal";

export function penpalAdapter(options: { methods: Record<string, any>; timeout?: number }) {
  return connectToParent<{ dispatch: Dispatcher<HostActions> }>({
    methods: options.methods,
    timeout: options.timeout,
  }) as unknown as ReturnType<PenpalAdapter>;
}

penpalAdapter.ErrorCode = {
  ConnectionTimeout: ErrorCode.ConnectionTimeout,
};
