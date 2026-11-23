import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Missing } from "@/components/content/missing";
import { ZoomableFigure } from "@/components/markdoc/zoomable-figure";
import { Reveal } from "@/components/motion/reveal";
import { PipelineProgress, TimelineTrack } from "@/components/motion/scroll-progress";
import { PixelIcon } from "@/components/pixel/pixel-icon";
import { pixelIcons, type PixelIconName } from "@/components/pixel/pixel-icons";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusChip } from "@/components/ui/status-chip";
import { Tag } from "@/components/ui/tag";
import { TerminalFrame } from "@/components/ui/terminal-frame";
import { Textarea } from "@/components/ui/textarea";
import { contrastRatio } from "@/lib/contrast";
import { colorTokens } from "@/lib/tokens";

export const metadata: Metadata = {
  title: "Styleguide",
  robots: { index: false, follow: false },
};

// Dev-only route (PRD 15.3 Phase 1). Production returns 404 unless the build
// sets ENABLE_STYLEGUIDE=1 (used only by the Playwright run).
function isEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.ENABLE_STYLEGUIDE === "1";
}

const BG = colorTokens.find((t) => t.name === "bg")!.hex;
const PANEL = colorTokens.find((t) => t.name === "panel")!.hex;
const swatchClass: Record<string, string> = {
  bg: "bg-bg",
  panel: "bg-panel",
  green: "bg-green",
  "green-dim": "bg-green-dim",
  muted: "bg-muted",
  amber: "bg-amber",
  white: "bg-white",
  yellow: "bg-yellow",
  red: "bg-red",
};

// Example option labels from FR-CF-01 (inquiry types), not personal content.
const inquiryTypes = ["Job opportunity", "Freelance project", "Collaboration", "Other"];

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`sg-${title}`} className="border-green-dim border-t-2 pt-8">
      <h2 id={`sg-${title}`} className="text-label text-green mb-6">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function StyleguidePage() {
  if (!isEnabled()) notFound();

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-12 px-4 py-12 md:px-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-display-1 text-green glow">Styleguide</h1>
        <p className="max-w-[68ch]">
          Every primitive and state from PRD section 6. Development only; returns 404 in production.
        </p>
      </header>

      <Block title="Colour tokens">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {colorTokens.map((t) => (
            <li key={t.name} className="border-green-dim flex gap-3 border-2 p-3">
              <span
                aria-hidden="true"
                className={`${swatchClass[t.name]} border-green-dim size-12 shrink-0 border`}
              />
              <div className="text-meta">
                <p className="text-white">
                  {t.prdName} <span className="text-muted">{t.hex}</span>
                </p>
                <p className="text-muted">{t.use}</p>
                {t.kind !== "surface" ? (
                  <p className="text-muted" data-testid={`contrast-${t.name}`}>
                    {contrastRatio(t.hex, BG).toFixed(1)}:1 on bg ·{" "}
                    {contrastRatio(t.hex, PANEL).toFixed(1)}:1 on panel
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Typography">
        <div className="flex flex-col gap-6">
          <p className="text-display-1 text-green glow">Hero H1 display</p>
          <p className="text-display-2 text-green">H2 section title</p>
          <p className="text-h3 text-white">H3 IBM Plex Sans 600</p>
          <p className="max-w-[68ch]">
            Body text in IBM Plex Sans 400 at 16px with 1.7 line height, set in the muted token and
            capped at 68 characters per line. <strong className="text-white">Emphasis</strong> uses
            the white token sparingly.
          </p>
          <p className="text-label text-green">Label / button</p>
          <p className="text-meta text-muted">Meta · JetBrains Mono · 2026-11 · v1.2</p>
        </div>
      </Block>

      <Block title="Section header">
        <SectionHeader number="01" title="About" />
      </Block>

      <Block title="Buttons">
        <div className="flex flex-wrap items-center gap-6">
          <Button>[ View projects ]</Button>
          <Button variant="secondary">[ Download CV ]</Button>
          <Button disabled>[ Disabled ]</Button>
          <Button variant="secondary" disabled>
            [ Disabled ]
          </Button>
          <Button size="compact">[ CV ]</Button>
          <Button variant="secondary" size="icon" aria-label="Icon button example">
            <PixelIcon name="arrow" size={16} />
          </Button>
          <Button asChild variant="secondary">
            <a href="#sg-Buttons">[ Link as button ]</a>
          </Button>
        </div>
        <p className="text-meta text-muted mt-4">
          Hover and keyboard focus: tab to a button to see the amber focus ring; hover lifts the
          primary button with an amber pixel shadow.
        </p>
      </Block>

      <Block title="Tags and status">
        <div className="flex flex-wrap items-center gap-3">
          <Tag>Tag</Tag>
          <Tag>Example</Tag>
          <Tag>Label</Tag>
          <StatusChip>Open to Opportunities &amp; Collaboration</StatusChip>
        </div>
      </Block>

      <Block title="Terminal frame">
        <div className="grid gap-8 md:grid-cols-12">
          <TerminalFrame title="about.txt" className="md:col-span-7">
            <p>
              Default frame, 2px border. Title bar is decorative and hidden from screen readers.
            </p>
          </TerminalFrame>
          <TerminalFrame title="contact.sh" thick className="md:col-span-5">
            <p>Thick frame, 4px border, for primary blocks.</p>
          </TerminalFrame>
        </div>
      </Block>

      <Block title="Form controls">
        <form className="grid max-w-2xl gap-6" aria-label="Form controls example">
          <Field label="Name" required>
            {(p) => <Input {...p} name="name" autoComplete="name" />}
          </Field>
          <Field label="Email" required error="Enter a valid email address.">
            {(p) => <Input {...p} name="email" type="email" defaultValue="not-an-email" />}
          </Field>
          <Field label="Disabled input">
            {(p) => <Input {...p} disabled defaultValue="Read only" />}
          </Field>
          <Field label="Inquiry type" hint="Example options from FR-CF-01.">
            {(p) => (
              <Select name="type">
                <SelectTrigger {...p}>
                  <SelectValue placeholder="Choose a type" />
                </SelectTrigger>
                <SelectContent>
                  {inquiryTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>
          <Field label="Message" hint="20 to 2000 characters.">
            {(p) => <Textarea {...p} name="message" />}
          </Field>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Checkbox id="sg-consent" />
              <label htmlFor="sg-consent">Unchecked checkbox</label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox id="sg-checked" defaultChecked />
              <label htmlFor="sg-checked">Checked checkbox</label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox id="sg-invalid" aria-invalid aria-describedby="sg-invalid-error" />
              <label htmlFor="sg-invalid">Invalid checkbox</label>
            </div>
            <p id="sg-invalid-error" className="text-red text-sm">
              Please confirm to continue.
            </p>
          </div>
        </form>
      </Block>

      <Block title="Dialog">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">[ Open dialog ]</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog example</DialogTitle>
            <DialogDescription>
              Used for the diagram lightbox in Phase 5. Esc or the close button dismisses it.
            </DialogDescription>
          </DialogContent>
        </Dialog>
      </Block>

      <Block title="Pixel icons">
        <ul className="text-green flex flex-wrap items-end gap-8">
          {(Object.keys(pixelIcons) as PixelIconName[]).map((name) => (
            <li key={name} className="flex flex-col items-center gap-2">
              <PixelIcon name={name} size={32} />
              <span className="text-meta text-muted">{name}</span>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Motion">
        <div className="flex flex-col gap-16">
          <p className="text-meta text-muted max-w-[68ch]">
            Scroll-linked demos (desktop, no reduced motion): the timeline line draws and the
            pipeline fills as this block scrolls past. Lists reveal with an 80ms stagger.
          </p>
          <TimelineTrack>
            <Reveal as="ol" stagger className="flex flex-col gap-10" aria-label="Timeline demo">
              {["Entry A", "Entry B", "Entry C", "Entry D"].map((label) => (
                <li key={label} className="relative pl-10">
                  <span
                    aria-hidden="true"
                    className="bg-green-dim absolute top-1.5 left-0 size-3"
                  />
                  <p className="text-h3 text-white">{label}</p>
                  <p className="text-meta text-muted">Sample timeline entry</p>
                </li>
              ))}
            </Reveal>
          </TimelineTrack>
          <PipelineProgress steps={6}>
            <ol
              aria-label="Pipeline demo"
              className="relative grid gap-6 md:grid-cols-3 lg:grid-cols-6"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <li key={n} data-step={n - 1} className="group flex gap-4 lg:flex-col">
                  <span
                    aria-hidden="true"
                    className="bg-bg border-green text-label text-green group-data-[active]:border-amber group-data-[active]:text-amber flex size-12 items-center justify-center border-2"
                  >
                    {String(n).padStart(2, "0")}
                  </span>
                  <p className="text-h3 text-white">Step {n}</p>
                </li>
              ))}
            </ol>
          </PipelineProgress>
        </div>
      </Block>

      <Block title="Lightbox">
        <div className="max-w-2xl">
          <ZoomableFigure
            src="/images/styleguide/sample-diagram.svg"
            alt="Sample flowchart: Input, then Process, then Output"
            caption="Sample diagram (styleguide only)"
            kind="Diagram"
          />
        </div>
      </Block>

      <Block title="Missing content marker">
        <Missing what="example of an unconfirmed field" />
      </Block>
    </div>
  );
}
