import Markdoc, { type Node } from "@markdoc/markdoc";

import { Missing } from "@/components/content/missing";
import { DraftBadge, Val, isFilled } from "@/components/content/val";
import { MarkdocContent } from "@/components/markdoc/markdoc-content";
import { TerminalFrame } from "@/components/ui/terminal-frame";
import { formatYearMonth } from "@/lib/format";
import type { EducationView, ProfileView } from "@/lib/views";

import { Section } from "./section";

type AboutProps = { profile: ProfileView | null; education: EducationView | undefined };

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-green-dim/40 flex flex-col gap-1 border-b border-dashed pb-3 last:border-b-0 last:pb-0">
      <dt className="text-meta text-green-dim">{label}</dt>
      <dd className="text-white">{children}</dd>
    </div>
  );
}

/** The About body is cached as Markdoc AST JSON (see lib/views.ts); rebuild the document node. */
function documentFromJson(json: string): Node {
  const parsed = Markdoc.Ast.fromJSON(json);
  return Array.isArray(parsed) ? new Markdoc.Ast.Node("document", {}, parsed) : parsed;
}

// FR-ABT-01: two short paragraphs + facts panel in a terminal frame.
function About({ profile, education }: AboutProps) {
  const range =
    education && formatYearMonth(education.start) && formatYearMonth(education.end)
      ? `${formatYearMonth(education.start)} – ${formatYearMonth(education.end)}`
      : null;

  return (
    <Section id="about" number="01" title="About">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="flex max-w-[68ch] flex-col gap-4 lg:col-span-7 [&_p+p]:mt-4">
          <DraftBadge show={!!profile?.isDraft} className="self-start" />
          {!profile ? (
            <Missing what="About text (IN-01)" />
          ) : profile.aboutTodo ? (
            <Missing what={profile.aboutTodo} />
          ) : (
            <MarkdocContent node={documentFromJson(profile.aboutAst)} />
          )}
        </div>

        <TerminalFrame as="aside" title="about.txt" aria-label="Facts" className="lg:col-span-5">
          <dl className="flex flex-col gap-3">
            <Fact label="education">
              {education ? (
                <>
                  {education.degree} {education.major}, {education.institution}
                  <span className="text-meta text-muted block">
                    {range ?? <Missing what="study dates" />}
                    {isFilled(education.gpa) ? ` · GPA ${education.gpa}` : null}
                  </span>
                </>
              ) : (
                <Missing what="education entry (IN-03)" />
              )}
            </Fact>
            <Fact label="location">
              <Val value={profile?.location} what="location (IN-10)" />
            </Fact>
            {profile && profile.preferredLocations.length > 0 ? (
              <Fact label="open to work in">{profile.preferredLocations.join(" / ")}</Fact>
            ) : null}
            {education && education.focusAreas.length > 0 ? (
              <Fact label="focus areas">{education.focusAreas.join(", ")}</Fact>
            ) : null}
          </dl>
        </TerminalFrame>
      </div>
    </Section>
  );
}

export { About };
