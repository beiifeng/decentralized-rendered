import { type editor } from "monaco-editor";
import { useEffect, useRef, useState } from "react";
import type { RawDocument } from "./interface";

import * as monaco from "monaco-editor/editor/editor.api";
import "monaco-editor/features/find/register";
import "monaco-editor/features/hover/register";
import "monaco-editor/features/inlineCompletions/register";
import "monaco-editor/features/inPlaceReplace/register";
import "monaco-editor/features/longLinesHelper/register";
import "monaco-editor/features/semanticTokens/register";
import "monaco-editor/features/suggest/register";
import "monaco-editor/features/wordHighlighter/register";
import * as json from "monaco-editor/languages/features/json/register";

export type CertEditorLazyProps = {
  data: RawDocument | null;
};
export default function CertEditorLazy({ data }: CertEditorLazyProps) {
  const editorElRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!editorElRef.current) {
      return;
    }

    try {
      const schemaStr = localStorage.getItem("CONF_SCHEMA");
      if (schemaStr) {
        json.jsonDefaults.setDiagnosticsOptions({
          validate: true,
          schemas: [{ uri: `${location.origin}/schema.json`, fileMatch: ["*"], schema: JSON.parse(schemaStr) }],
        });
      }
    } catch {
      console.log("Failed to parse CONF_SCHEMA");
    }

    const varList = (localStorage.getItem("CONF_REFS") || "")
      .split("\n")
      .map((x) => x.trim())
      .filter((x) => /^\{[A-Za-z0-9_.]+\}$/.test(x))
      .map<{ label: string }>((label) => ({ label }));
    const tokenMatcher = new RegExp(varList.map((x) => x.label.replace(/\./g, "\\.")).join("|"), "g");

    const providers: monaco.IDisposable[] = [];
    providers.push(
      monaco.languages.registerCompletionItemProvider("json", {
        provideCompletionItems: function (model, position) {
          const line = model.getLineContent(position.lineNumber);
          if (!line.match(/^\s*"\w+":\s"[^"]+"/)) {
            return { suggestions: [] };
          }
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };
          return {
            suggestions: varList.map((x) => ({
              label: x.label,
              kind: monaco.languages.CompletionItemKind.Variable,
              range: range,
              insertText: x.label.substring(1),
            })),
          };
        },
        triggerCharacters: ["{"],
      }),
    );
    providers.push(
      monaco.languages.registerDocumentRangeSemanticTokensProvider("json", {
        getLegend: function () {
          return { tokenTypes: ["variable"], tokenModifiers: [] };
        },
        provideDocumentRangeSemanticTokens: function (model, range) {
          const lines = model.getLinesContent().slice(range.startLineNumber - 1, range.endLineNumber);
          const data: number[] = [];

          let prevLine = range.startLineNumber - 1;
          let prevChar = 0;

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            for (let match; (match = tokenMatcher.exec(line));) {
              data.push(i - prevLine, prevLine === i ? match.index - prevChar : match.index, match[0].length, 0, -1);
              prevLine = i;
              prevChar = match.index;
            }
          }
          return {
            data: new Uint32Array(data),
          };
        },
      }),
    );

    monaco.editor.defineTheme("ocTheme", {
      base: "vs-dark",
      inherit: true,
      colors: {},
      rules: [{ token: "variable", foreground: "#26b933" }],
    });

    const codeEditor = monaco.editor.create(editorElRef.current, {
      language: "json",
      theme: "ocTheme",
      scrollBeyondLastLine: false,
      find: {
        addExtraSpaceOnTop: false,
      },
      renderWhitespace: "all",
      tabSize: 2,
      formatOnPaste: true,
      formatOnType: true,
      tabCompletion: "on",
      "semanticHighlighting.enabled": true,
    });
    codeEditor.addAction({
      id: "cert-editor.save",
      label: "Save",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: (_editor) => {
        const content = _editor.getValue();
        if (content) {
          // save to file, file extension could be .json
          const blob = new Blob([content], { type: "application/json; charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `certificate-${Date.now()}.json`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000); // eslint-disable-line @eslint-react/web-api-no-leaked-timeout
        }
      },
    });
    setEditor(codeEditor);

    return () => {
      codeEditor.dispose();
      while (providers.length) {
        providers.pop()?.dispose();
      }
      setEditor(null);
    };
  }, []);

  useEffect(() => {
    const handleWindowResize = () => {
      if (editor) {
        editor.layout();
      }
    };
    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [editor]);

  useEffect(() => {
    if (editor && data) {
      editor.setValue(JSON.stringify(data, null, 2));
    }
  }, [editor, data]);

  return <div ref={editorElRef} className="h-[90vh] max-h-[90vh] m-2"></div>;
}
