"use client";

import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import "react-quill-new/dist/quill.snow.css";

const QuillEditor = dynamic(() => import("react-quill-new"), { ssr: false });

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  id?: string;
  placeholder?: string;
  className?: string;
  modules?: Record<string, unknown>;
  readOnly?: boolean;
}

const controlNames: Record<string, string> = {
  bold: "Bold",
  italic: "Italic",
  underline: "Underline",
  strike: "Strikethrough",
  blockquote: "Quotation",
  "code-block": "Code block",
  link: "Insert link",
  image: "Insert image",
  video: "Insert video",
  formula: "Insert formula",
  clean: "Clear formatting",
  header: "Heading style",
  font: "Font",
  size: "Text size",
  color: "Text color",
  background: "Highlight color",
  align: "Text alignment",
  direction: "Text direction",
};

/** Keep the existing HTML contract while sharing accessible, theme-aware editor chrome. */
export function RichTextEditor({
  label,
  id,
  className,
  readOnly = false,
  ...props
}: RichTextEditorProps) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const labelControls = () => {
      const toolbar = element.querySelector<HTMLElement>(".ql-toolbar");
      if (toolbar) {
        toolbar.setAttribute("role", "toolbar");
        toolbar.setAttribute("aria-label", `Formatting for ${label}`);
      }
      const editor = element.querySelector<HTMLElement>(".ql-editor");
      if (editor) {
        editor.setAttribute("role", "textbox");
        editor.setAttribute("aria-label", label);
        editor.setAttribute("aria-multiline", "true");
        editor.setAttribute("aria-readonly", String(readOnly));
        if (id) editor.id = id;
      }
      element
        .querySelectorAll<HTMLElement>(
          ".ql-toolbar button, .ql-picker-label, .ql-picker-item",
        )
        .forEach((control) => {
          const classes = [
            ...control.classList,
            ...(control.parentElement?.classList || []),
          ];
          const kind = classes
            .map((name) => name.replace(/^ql-/, ""))
            .find(
              (name) =>
                controlNames[name] ||
                ["list", "indent", "script"].includes(name),
            );
          const value =
            control.getAttribute("value") || control.getAttribute("data-value");
          const name =
            kind === "list"
              ? value === "ordered"
                ? "Numbered list"
                : "Bulleted list"
              : kind === "indent"
                ? value === "-1"
                  ? "Decrease indent"
                  : "Increase indent"
                : kind === "script"
                  ? value === "sub"
                    ? "Subscript"
                    : "Superscript"
                  : kind
                    ? controlNames[kind]
                    : "Text formatting";
          const optionName = control.classList.contains("ql-picker-item")
            ? `${name}: ${value || "Default"}`
            : name;
          control.setAttribute("aria-label", optionName);
          control.setAttribute("title", name);
          if (control.tagName === "BUTTON") {
            control.setAttribute("type", "button");
            if (
              kind &&
              [
                "bold",
                "italic",
                "underline",
                "strike",
                "blockquote",
                "code-block",
                "list",
                "script",
              ].includes(kind)
            )
              control.setAttribute(
                "aria-pressed",
                String(control.classList.contains("ql-active")),
              );
          }
        });
      element
        .querySelectorAll<HTMLInputElement>(".ql-tooltip input")
        .forEach((input) =>
          input.setAttribute("aria-label", "Link or media URL"),
        );
    };
    labelControls();
    const observer = new MutationObserver(labelControls);
    observer.observe(element, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [label, id, readOnly]);

  return (
    <div
      ref={container}
      className={cn(
        "rich-text-editor overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
    >
      <QuillEditor {...props} readOnly={readOnly} theme="snow" />
      <style jsx global>{`
        .rich-text-editor .ql-toolbar.ql-snow {
          border: 0;
          border-bottom: 1px solid hsl(var(--border));
          background: hsl(var(--muted) / 0.4);
          padding: 0.65rem;
        }
        .rich-text-editor .ql-container.ql-snow {
          border: 0;
          font-family: var(--font-sans);
        }
        .rich-text-editor .ql-editor {
          min-height: 120px;
          padding: 1rem;
          color: hsl(var(--foreground));
          font-size: 0.9375rem;
          line-height: 1.65;
          overflow-wrap: anywhere;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
          font-style: normal;
        }
        .rich-text-editor .ql-snow .ql-stroke {
          stroke: hsl(var(--muted-foreground));
        }
        .rich-text-editor .ql-snow .ql-fill {
          fill: hsl(var(--muted-foreground));
        }
        .rich-text-editor .ql-snow .ql-picker {
          color: hsl(var(--muted-foreground));
        }
        .rich-text-editor .ql-snow .ql-picker-options,
        .rich-text-editor .ql-snow .ql-tooltip {
          border-color: hsl(var(--border));
          background: hsl(var(--popover));
          color: hsl(var(--popover-foreground));
          border-radius: 0.5rem;
          box-shadow: 0 4px 16px rgb(0 0 0 / 0.08);
        }
        .rich-text-editor .ql-toolbar.ql-snow button:hover .ql-stroke,
        .rich-text-editor .ql-toolbar.ql-snow button.ql-active .ql-stroke {
          stroke: hsl(var(--primary));
        }
        .rich-text-editor .ql-snow .ql-tooltip a {
          color: hsl(var(--primary));
        }
        .rich-text-editor .ql-snow .ql-tooltip input {
          border-color: hsl(var(--border));
          background: hsl(var(--background));
          color: hsl(var(--foreground));
        }
        .rich-text-editor .ql-toolbar button:focus-visible,
        .rich-text-editor .ql-picker-label:focus-visible {
          outline: 2px solid hsl(var(--ring));
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}

export function richTextHasContent(value: string): boolean {
  return Boolean(
    value
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;|&#160;/g, " ")
      .trim() || /<(img|video|iframe)\b/i.test(value),
  );
}
