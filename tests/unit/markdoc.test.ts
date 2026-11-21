import Markdoc from "@markdoc/markdoc";
import { describe, expect, it } from "vitest";

import {
  collectImageSources,
  collectText,
  extractHeadings,
  slugify,
  validateMarkdoc,
} from "@/lib/markdoc";

const parse = (source: string) => Markdoc.parse(source);

describe("Markdoc whitelist", () => {
  it("accepts the whitelisted components", () => {
    const doc = parse(`
## Section

{% Callout tone="warning" %}
Careful.
{% /Callout %}

{% Figure src="/images/projects/x/a.png" alt="A screenshot" caption="Caption" /%}

{% Diagram src="/images/projects/x/b.svg" alt="A process map" /%}

{% Steps %}
{% Step title="First" %}
Do this.
{% /Step %}
{% /Steps %}
`);
    expect(validateMarkdoc(doc)).toEqual([]);
  });

  it("rejects unknown components", () => {
    const errors = validateMarkdoc(parse(`{% Script src="x.js" /%}`));
    expect(errors.length).toBeGreaterThan(0);
  });

  it("rejects a Figure without alt text", () => {
    expect(validateMarkdoc(parse(`{% Figure src="/a.png" /%}`)).length).toBeGreaterThan(0);
    expect(validateMarkdoc(parse(`{% Figure src="/a.png" alt="" /%}`)).length).toBeGreaterThan(0);
  });

  it("rejects an invalid Callout tone", () => {
    const doc = parse(`{% Callout tone="party" %}\nHi\n{% /Callout %}`);
    expect(validateMarkdoc(doc).length).toBeGreaterThan(0);
  });
});

describe("headings and text", () => {
  const doc = parse(`## As-is analysis\n\nText.\n\n### Pain points\n\n#### Too deep\n`);

  it("extracts H2/H3 headings with stable ids for the table of contents", () => {
    expect(extractHeadings(doc)).toEqual([
      { id: "as-is-analysis", level: 2, title: "As-is analysis" },
      { id: "pain-points", level: 3, title: "Pain points" },
    ]);
  });

  it("slugify is stable", () => {
    expect(slugify("Solution design (to-be)")).toBe("solution-design-to-be");
  });

  it("collects text including tag attributes, for the TODO gate", () => {
    const texts = collectText(parse(`Hello\n\n{% Figure src="/a.png" alt="TODO alt" /%}`));
    expect(texts).toEqual(expect.arrayContaining(["Hello", "TODO alt"]));
  });

  it("collects Figure and Diagram sources, for the image-exists check", () => {
    const sources = collectImageSources(
      parse(`{% Figure src="/a.png" alt="a" /%}\n\n{% Diagram src="/b.svg" alt="b" /%}`),
    );
    expect(sources).toEqual(["/a.png", "/b.svg"]);
  });
});
