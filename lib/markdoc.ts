import Markdoc, { Tag, type Config, type Node, type ValidationError } from "@markdoc/markdoc";

import { hasTodo, todoMessage } from "./schema";

/*
 * Markdoc rendering contract — PRD 18.3 / FR-CMS-05.
 * Only these tags are allowed; Markdoc.validate reports any other tag as an
 * error, so unknown components fail validation (and the content gate).
 * Tag names match the Keystatic content components in keystatic.config.ts.
 */

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function nonEmptyAttribute(name: string) {
  return (node: Node): ValidationError[] => {
    const value = node.attributes[name];
    if (typeof value === "string" && value.trim() !== "") return [];
    return [
      {
        id: "attribute-empty",
        level: "error",
        message: `'${name}' must not be empty on ${node.tag}`,
      },
    ];
  };
}

const imageAttributes = {
  src: { type: String, required: true },
  alt: { type: String, required: true },
  caption: { type: String },
} as const;

function inlineText(node: Node): string {
  const parts: string[] = [];
  for (const child of node.walk()) {
    if (child.type === "text" && typeof child.attributes.content === "string") {
      parts.push(child.attributes.content);
    }
  }
  return parts.join("").trim();
}

/**
 * Published case studies: drop the parts that are still empty instead of showing
 * placeholders (owner decision: "hide until filled"). Removes top-level paragraphs
 * that are entirely a TODO(content) note, then any heading whose section is left
 * with nothing in it. A TODO anywhere else (a list item, inside a sentence) is
 * kept, so the content gate still rejects it.
 */
export function pruneTodoSections(doc: Node): Node {
  const children = doc.children;
  const removed = children.map((child) => child.type === "paragraph" && hasTodo(inlineText(child)));
  const level = (child: Node) =>
    child.type === "heading" ? Number(child.attributes.level ?? 2) : Infinity;
  // From the end, so a sub-heading is decided before the heading above it.
  for (let i = children.length - 1; i >= 0; i -= 1) {
    const heading = children[i]!;
    if (heading.type !== "heading") continue;
    let empty = true;
    for (let j = i + 1; j < children.length && level(children[j]!) > level(heading); j += 1) {
      if (!removed[j]) {
        empty = false;
        break;
      }
    }
    if (empty) removed[i] = true;
  }
  return new Markdoc.Ast.Node(
    "document",
    doc.attributes,
    children.filter((_, i) => !removed[i]),
  );
}

export const markdocConfig: Config = {
  nodes: {
    // Draft preview only: a TODO(content) paragraph renders as a MISSING marker.
    // Published bodies never contain TODO (the content gate rejects them).
    paragraph: {
      render: "p",
      transform(node, config) {
        const text = inlineText(node);
        if (hasTodo(text)) {
          return new Tag("p", {}, [new Tag("Missing", { what: todoMessage(text) }, [])]);
        }
        return new Tag("p", node.transformAttributes(config), node.transformChildren(config));
      },
    },
    heading: {
      render: "Heading",
      children: ["inline"],
      attributes: {
        id: { type: String },
        level: { type: Number, required: true, default: 2 },
      },
      transform(node, config) {
        const attributes = node.transformAttributes(config);
        const children = node.transformChildren(config);
        const id = (attributes.id as string | undefined) ?? slugify(inlineText(node));
        return new Tag("Heading", { ...attributes, id }, children);
      },
    },
  },
  tags: {
    Callout: {
      render: "Callout",
      attributes: {
        tone: { type: String, default: "note", matches: ["note", "warning"] },
      },
    },
    Figure: {
      render: "Figure",
      selfClosing: true,
      attributes: imageAttributes,
      validate: nonEmptyAttribute("alt"),
    },
    Diagram: {
      render: "Diagram",
      selfClosing: true,
      attributes: imageAttributes,
      validate: nonEmptyAttribute("alt"),
    },
    Steps: { render: "Steps" },
    Step: { render: "Step", attributes: { title: { type: String } } },
  },
};

/** Validation errors that should block rendering/publishing. */
export function validateMarkdoc(node: Node): ValidationError[] {
  return Markdoc.validate(node, markdocConfig)
    .map((e) => e.error)
    .filter((e) => e.level === "error" || e.level === "critical");
}

export type TocHeading = { id: string; level: 2 | 3; title: string };

/** H2/H3 headings for the case-study table of contents (FR-PD-02, FR-CMS-05). */
export function extractHeadings(node: Node): TocHeading[] {
  const headings: TocHeading[] = [];
  for (const child of node.walk()) {
    if (child.type !== "heading") continue;
    const level = child.attributes.level;
    if (level !== 2 && level !== 3) continue;
    const title = inlineText(child);
    const id = typeof child.attributes.id === "string" ? child.attributes.id : slugify(title);
    headings.push({ id, level, title });
  }
  return headings;
}

/** Every human-readable string in a document: text plus tag attributes (alt, caption, title). */
export function collectText(node: Node): string[] {
  const out: string[] = [];
  for (const child of [node, ...node.walk()]) {
    if (child.type === "text" && typeof child.attributes.content === "string") {
      out.push(child.attributes.content);
    }
    if (child.type === "tag") {
      for (const value of Object.values(child.attributes)) {
        if (typeof value === "string") out.push(value);
      }
    }
  }
  return out;
}

/** src of every Figure/Diagram, for the image-exists check. */
export function collectImageSources(node: Node): string[] {
  const out: string[] = [];
  for (const child of node.walk()) {
    if (child.type === "tag" && (child.tag === "Figure" || child.tag === "Diagram")) {
      const src = child.attributes.src;
      if (typeof src === "string") out.push(src);
    }
  }
  return out;
}

/** Rebuilds a document node from cached AST JSON (cache entries must be serializable). */
export function nodeFromJson(json: string): Node {
  const parsed = Markdoc.Ast.fromJSON(json);
  return Array.isArray(parsed) ? new Markdoc.Ast.Node("document", {}, parsed) : parsed;
}
