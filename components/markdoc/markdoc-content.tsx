import Markdoc, { type Node } from "@markdoc/markdoc";
import React, { type ReactNode } from "react";

import { Missing } from "@/components/content/missing";
import { markdocConfig, validateMarkdoc } from "@/lib/markdoc";
import { cn } from "@/lib/utils";

import { ZoomableFigure } from "./zoomable-figure";

// React components for the whitelisted Markdoc tags (PRD 18.3).
// Body typography (p, lists, links) is styled by the .case-body rules in globals.css.

function Heading({ level, id, children }: { level: 2 | 3; id: string; children: ReactNode }) {
  const Tag = level === 2 ? "h2" : "h3";
  return (
    <Tag
      id={id}
      tabIndex={-1}
      className={cn(
        level === 2 ? "text-display-2 text-green mt-14 mb-4" : "text-h3 mt-8 mb-2 text-white",
      )}
    >
      {children}
    </Tag>
  );
}

function Callout({ tone, children }: { tone: "note" | "warning"; children: ReactNode }) {
  return (
    <aside
      className={cn(
        "bg-panel my-6 border-l-4 p-4",
        tone === "warning" ? "border-yellow" : "border-green",
      )}
    >
      <p className={cn("text-label mb-2", tone === "warning" ? "text-yellow" : "text-green")}>
        {tone === "warning" ? "Warning" : "Note"}
      </p>
      {children}
    </aside>
  );
}

function Figure(props: { src: string; alt: string; caption?: string }) {
  return <ZoomableFigure {...props} kind="Figure" />;
}

function Diagram(props: { src: string; alt: string; caption?: string }) {
  return <ZoomableFigure {...props} kind="Diagram" />;
}

function Steps({ children }: { children: ReactNode }) {
  return <ol className="my-6 flex flex-col gap-4">{children}</ol>;
}

function Step({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <li className="border-green-dim border-l-2 pl-4">
      {title ? <p className="text-h3 text-white">{title}</p> : null}
      {children}
    </li>
  );
}

const components = { Heading, Callout, Figure, Diagram, Steps, Step, Missing };

/** Validates then renders a Markdoc document. Invalid content throws (never renders). */
export function MarkdocContent({ node }: { node: Node }) {
  const errors = validateMarkdoc(node);
  if (errors.length > 0) {
    throw new Error(`Invalid Markdoc content: ${errors.map((e) => e.message).join("; ")}`);
  }
  const renderable = Markdoc.transform(node, markdocConfig);
  return <>{Markdoc.renderers.react(renderable, React, { components })}</>;
}
