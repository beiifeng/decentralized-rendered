import { useEffect, useRef, type PropsWithChildren } from "react";

export type DomListenerProps = {
  /**
   * Function called on DOM modification or window resize with the new document height as first parameter and `resize`|`domChange` as second parameter depending on the origin of the update.
   */
  onUpdate: (height: number, event: "resize" | "domChange") => void;
};

export default function DomListener(props: PropsWithChildren<DomListenerProps>) {
  const observerRef = useRef<MutationObserver | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef<(height: number, event: "resize" | "domChange") => void>(props.onUpdate);
  callbackRef.current = props.onUpdate;
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      callbackRef.current(document.documentElement.offsetHeight, "resize");
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    observerRef.current = new MutationObserver(() => {
      callbackRef.current(document.documentElement.offsetHeight, "domChange");
    });
    if (rootRef.current) {
      observerRef.current.observe(rootRef.current, { attributes: true, childList: true, subtree: true, characterData: true });
      // need an initial trigger, make it run on next tick :shrug:
      timerRef.current = window.setTimeout(() => {
        callbackRef.current(document.documentElement.offsetHeight, "domChange");
      }, 0);
    }
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return <div ref={rootRef}>{props.children}</div>;
}
