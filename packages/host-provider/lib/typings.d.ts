declare module "penpal-v4" {
  export interface ConnectToChildOptions {
    iframe: HTMLIFrameElement;
    methods: {
      [key: string]: (...args: any[]) => any;
    };
    timeout?: number;
    debug?: boolean;
  }
  export interface ConnectToChildReturn {
    promise: Promise<any>;
    destroy: () => void;
  }
  export function connectToChild(options: ConnectToChildOptions): ConnectToChildReturn;
}
