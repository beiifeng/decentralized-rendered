export interface HostActionsPayload {
  UPDATE_HEIGHT: number;
  OBFUSCATE: string;
  UPDATE_TEMPLATES: Array<{ id: string; label: string; type: string }>;
}

export interface FrameActionsPayload {
  RENDER_DOCUMENT: {
    document: Record<string, unknown>;
    rawDocument?: Record<string, unknown>;
  };
  SELECT_TEMPLATE: string;
  GET_TEMPLATES: Record<string, unknown>;
  PRINT: void;
}

export type Action<A, T = keyof A> = T extends keyof A ? (A[T] extends void ? { type: T } : { type: T } & { payload: A[T] }) : never;

export type HostActions = Action<HostActionsPayload>;
export type FrameActions = Action<FrameActionsPayload>;

export type Dispatch<A> = (action: A) => void;
