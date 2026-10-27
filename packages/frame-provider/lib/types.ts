import { ComponentType } from "react";

export interface HostActionsPayload {
  UPDATE_HEIGHT: number;
  OBFUSCATE: string;
  UPDATE_TEMPLATES: Array<{ id: string; label: string; type: string }>;
}

export interface FrameActionsPayload {
  RENDER_DOCUMENT: {
    document: Record<string, unknown>;
    rawDocument?: Record<string, unknown>;
    useFallbackSource?: boolean;
    errorType?: string;
  };
  SELECT_TEMPLATE: string;
  GET_TEMPLATES: Record<string, unknown>;
  PRINT: void;
}

export type Action<A, T = keyof A> = T extends keyof A ? (A[T] extends void ? { type: T } : { type: T } & { payload: A[T] }) : never;

export type HostActions = Action<HostActionsPayload>;
export type FrameActions = Action<FrameActionsPayload>;

export type Dispatcher<A> = (action: A) => void;

export interface PenpalAdapter {
  (options: { methods: Record<string, unknown>; timeout?: number }): { promise: Promise<{ dispatch: Dispatcher<HostActions> }>; destroy: () => void };
  ErrorCode: {
    ConnectionTimeout: string;
  };
}

export interface Attachment {
  fileName?: string;
  /** @deprecated Use `fileName` instead */
  filename?: string;
  type?: string;
  mimeType?: string;
}

export interface TemplateProps<D extends Record<string, unknown>> {
  document: D;
  wrappedDocument?: Record<string, unknown>;
  handleObfuscation: (field: string) => void;
  errorType?: string;
}
export interface Template {
  id: string;
  label: string;
}
export interface TemplateWithComponent<D extends Record<string, unknown>> extends Template {
  template: ComponentType<TemplateProps<D>>;
  predicate?: ({ document }: { document: D }) => boolean;
}
export interface TemplateWithTypes<D extends Record<string, unknown>> extends TemplateWithComponent<D> {
  type: string;
}
export interface TemplateRegistry<D extends Record<string, unknown>> {
  [key: string]: TemplateWithComponent<D>[];
}
