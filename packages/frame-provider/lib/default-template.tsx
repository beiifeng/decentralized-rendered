import NotificationBanner from "./notification-banner";
import type { TemplateProps, TemplateWithComponent } from "./types";
import { getTemplateUrl } from "./utils";

export function DefaultTemplate<D extends Record<string, unknown>>(props: TemplateProps<D>) {
  return (
    <div id="default-template">
      <div style={{ marginRight: "auto", marginLeft: "auto", color: "#333" }}>
        <NotificationBanner notificationType={props.errorType} templateURL={getTemplateUrl(props.document)} />
        <pre
          style={{
            backgroundColor: "#f7f8fc",
            padding: "0.75rem 1.25rem",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
          }}
        >
          {JSON.stringify(props.document, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export const defaultTemplate: TemplateWithComponent<Record<string, unknown>> = {
  id: "default-template",
  label: "Default",
  template: DefaultTemplate,
};
