import { type FunctionComponent, type PropsWithChildren, useCallback, useRef, useState } from "react";
import DomListener from "./dom-listener";
import noAttachmentFactory from "./no-attachment.factory";
import type { Attachment, Dispatcher, FrameActions, HostActions, PenpalAdapter, TemplateRegistry } from "./types";
import { useFrame } from "./use-frame";
import { documentTemplates, noop } from "./utils";

export type FrameProviderProps<D extends Record<string, unknown>> = {
  templateRegistry: TemplateRegistry<D>;
  penpalAdapter: PenpalAdapter;
  attachmentToComponent?: (attachment: Attachment, document: D) => FunctionComponent | null;
};

export default function FrameProvider<D extends Record<string, unknown>>(props: PropsWithChildren<FrameProviderProps<D>>) {
  const { templateRegistry, attachmentToComponent = noAttachmentFactory, penpalAdapter } = props;

  const [document, setDocument] = useState<D>();
  const [useFallbackSource, setUseFallbackSource] = useState<boolean>(false);
  const [errorType, setErrorType] = useState<string>();

  const [rawDocument, setRawDocument] = useState<Record<string, unknown>>();
  const [templateName, setTemplateName] = useState<string>();
  const hostDispatcherRef = useRef<Dispatcher<HostActions>>(noop);

  const templates = document ? documentTemplates(document, templateRegistry as TemplateRegistry<D>, attachmentToComponent, useFallbackSource) : [];
  const templateSelected = templates.find((template) => template.id === templateName) || templates[0] || {};
  const Template = templateSelected.template;

  const onConnected = useCallback((postMessage: Dispatcher<HostActions> | null) => {
    hostDispatcherRef.current = postMessage || noop;
  }, []);

  // actions received by the parent hosting the component
  const dispatch = useCallback(
    (action: FrameActions): any => {
      if (action.type === "RENDER_DOCUMENT") {
        setDocument(action.payload.document as D);
        if (action.payload.rawDocument) {
          setRawDocument(action.payload.rawDocument as any);
        }
        setUseFallbackSource(!!action.payload.useFallbackSource);
        if (action.payload.errorType) {
          setErrorType(action.payload.errorType);
        }
        const run = async (): Promise<void> => {
          const templates = documentTemplates(
            action.payload.document as D,
            templateRegistry as TemplateRegistry<D>,
            attachmentToComponent,
            action.payload.useFallbackSource,
          ).map((template) => ({
            id: template.id,
            label: template.label,
            type: template.type,
          }));
          hostDispatcherRef.current({ type: "UPDATE_TEMPLATES", payload: templates });
        };
        run();
      } else if (action.type === "SELECT_TEMPLATE") {
        setTemplateName(action.payload);
      } else if (action.type === "GET_TEMPLATES") {
        const templates = documentTemplates(action.payload as D, templateRegistry as TemplateRegistry<D>, attachmentToComponent, useFallbackSource).map(
          (template) => ({
            id: template.id,
            label: template.label,
            type: template.type,
          }),
        );
        hostDispatcherRef.current({ type: "UPDATE_TEMPLATES", payload: templates });
        return templates; // react-native expect to get the result directly
      } else if (action.type === "PRINT") {
        window.print();
      } else {
        throw new Error(`Action ${JSON.stringify(action)} is not handled`);
      }
    },
    [templateRegistry, attachmentToComponent, useFallbackSource],
  );

  const [connected] = useFrame({ dispatch, onConnected, penpalAdapter });

  return (
    <DomListener onUpdate={(height) => hostDispatcherRef.current({ type: "UPDATE_HEIGHT", payload: height })}>
      {document && connected && (
        <div className="frameless-tabs" id="rendered-certificate">
          <Template
            document={document}
            wrappedDocument={rawDocument}
            handleObfuscation={(field) => {
              hostDispatcherRef.current({ type: "OBFUSCATE", payload: field });
            }}
            errorType={errorType}
          />
        </div>
      )}
    </DomListener>
  );
}
