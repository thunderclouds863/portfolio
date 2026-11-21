import Markdoc, { type Node } from "@markdoc/markdoc";
import Image from "next/image";
import React, { type ReactNode } from "react";

import { markdocConfig, validateMarkdoc } from "@/lib/markdoc";
import { cn } from "@/lib/utils";

// React components for the whitelisted Markdoc tags (PRD 18.3).
// Case-study typography is refined in Phase 5.

function Heading({ level, id, children }: { level: 2 | 3; id: string; children: ReactNode }) {
  const Tag = level === 2 ? "h2" : "h3";
  return (
    <Tag
      id={id}
      tabIndex={-1}
      className={cn(level === 2 ? "text-display-2 text-green mt-12" : "text-h3 mt-8 text-white")}
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

function Figure({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="my-8">
      <div className="bg-panel border-green-dim relative aspect-video border-2">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1200px) 800px, 100vw"
          className="object-contain"
        />
      </div>
      {caption ? <figcaption className="text-meta text-muted mt-2">{caption}</figcaption> : null}
    </figure>
  );
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

const components = { Heading, Callout, Figure, Diagram: Figure, Steps, Step };

/** Validates then renders a Markdoc document. Invalid content throws (never renders). */
export function MarkdocContent({ node }: { node: Node }) {
  const errors = validateMarkdoc(node);
  if (errors.length > 0) {
    throw new Error(`Invalid Markdoc content: ${errors.map((e) => e.message).join("; ")}`);
  }
  const renderable = Markdoc.transform(node, markdocConfig);
  return <>{Markdoc.renderers.react(renderable, React, { components })}</>;
}
