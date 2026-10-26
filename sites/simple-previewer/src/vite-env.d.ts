/// <reference types="vite/client" />

/* eslint-disable */
// https://github.com/Aaronius/penpal/releases/tag/v4.0.0 check TypeScript Declarations
declare module "penpal-v4" {
  interface ConnectToChildOptions {
    methods: {
      [key: string]: Function;
    };
    iframe: HTMLIFrameElement | null;
    timeout: number;
  }
  interface ConnectToChildReturn {
    promise: Promise<{ [key: string]: Function }>;
  }
  export const connectToChild: (options: ConnectToChildOptions) => ConnectToChildReturn;
}
