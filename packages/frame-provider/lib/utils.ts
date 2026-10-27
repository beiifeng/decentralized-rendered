import { FunctionComponent } from "react";
import { defaultTemplate } from "./default-template";
import { Attachment, TemplateRegistry, TemplateWithComponent, TemplateWithTypes } from "./types";

export const noop = (): void => void 0;

// Currently using https://stackoverflow.com/questions/326069/how-to-identify-if-a-webpage-is-being-loaded-inside-an-iframe-or-directly-into-t
export const inIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

export const isV2Document = (document: any): document is { $template: string | { name: string; url: string; type: string } } => {
  return !!document.$template;
};

export const isV3Document = (
  document: any,
): document is { "@context": unknown; openAttestationMetadata: { template: { name: string; url: string; type: string } } } => {
  return !!document["@context"] && !!document["openAttestationMetadata"];
};

export const isVCDocument = (document: any): document is { "@context": unknown; credentialSubject: unknown; renderMethod: any } => {
  return !!document["@context"] && !!document.credentialSubject && !!document.renderMethod;
};

const getTemplateName = (document: Record<string, unknown>): string => {
  if (isV2Document(document) && typeof document.$template === "object") {
    return document.$template.name;
  }
  if (isV3Document(document) && document.openAttestationMetadata.template) {
    return document.openAttestationMetadata.template.name;
  }
  if (isVCDocument(document)) {
    return ([document.renderMethod]?.flat()?.[0] as any)?.templateName;
  }
  return "";
};

export const isV2Attachment = (attachment: any): boolean => {
  return !!attachment.type;
};

export const getAttachmentMimeType = (attachment: any): string => {
  return isV2Attachment(attachment) ? attachment.type : attachment.mimeType;
};

const truePredicate = (): boolean => true;

// TODO this function is weird, returns current template + templates for attachments
export function documentTemplates<D extends Record<string, unknown>>(
  document: D,
  templateRegistry: TemplateRegistry<D>,
  attachmentToComponent: (attachment: Attachment, document: D) => FunctionComponent | null,
  setForceDefault?: boolean,
): TemplateWithTypes<D>[] {
  if (!document) return [];
  // Find the template in the template registry or use a default template
  const templateName = getTemplateName(document);
  const selectedTemplate: TemplateWithComponent<D>[] = setForceDefault
    ? [defaultTemplate as TemplateWithComponent<D>]
    : (templateName && templateRegistry[templateName]) || [defaultTemplate as TemplateWithComponent<D>];

  // Add type property to differentiate between custom template tabs VS attachments tab
  const tabsRenderedFromCustomTemplates: TemplateWithTypes<D>[] = selectedTemplate
    .map((template) => {
      return { ...template, type: "custom-template" };
    })
    .filter((template) => (template.predicate ? template.predicate({ document }) : truePredicate()));

  const attachments = isVCDocument(document)
    ? [(document as Record<string, any>)?.credentialSubject]
        .flat()
        ?.map((s) => s.attachments)
        ?.filter(Boolean)
        ?.flat()
    : isV2Document(document) || isV3Document(document)
      ? (document as any).attachments
      : [];
  const tabsRenderedFromAttachments = (attachments || ([] as Attachment[]))
    .map((attachment: Attachment, index: number) => {
      return {
        id: `attachment-${index}`,
        label: ((attachment as any).fileName ?? (attachment as any)?.filename) || "Unknown filename",
        type: ((attachment as any).type ?? (attachment as any).mimeType) || "Unknown filetype",
        template: attachmentToComponent(attachment, document),
      };
    })
    .filter((template: any) => template.template);

  return [...tabsRenderedFromCustomTemplates, ...tabsRenderedFromAttachments];
}
export const getTemplateUrl = (document: Record<string, unknown>): string | undefined => {
  if (isVCDocument(document)) {
    return [document.renderMethod]?.flat()?.[0]?.id;
  } else if (isV2Document(document)) {
    return typeof document.$template === "object" ? document.$template.url : undefined;
  } else if (isV3Document(document)) {
    return document.openAttestationMetadata?.template?.url;
  }
};
