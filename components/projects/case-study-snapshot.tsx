import type { ReactNode } from "react";

import { Missing } from "@/components/content/missing";
import { Val, isFilled } from "@/components/content/val";
import { Tag } from "@/components/ui/tag";
import { TerminalFrame } from "@/components/ui/terminal-frame";
import { capabilityLabel, projectTypeLabel, scopeLabel } from "@/lib/format";
import type { ProjectView } from "@/lib/views";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-green-dim/40 grid gap-1 border-b border-dashed pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[10rem_1fr]">
      <dt className="text-meta text-green-dim">{label}</dt>
      <dd className="text-white">{children}</dd>
    </div>
  );
}

// Case-study template item 1 (PRD section 3): role, team size, duration, type,
// stack, status — plus the required contribution scope.
function CaseStudySnapshot({ project }: { project: ProjectView }) {
  return (
    <TerminalFrame as="section" title="snapshot.txt" aria-label="Project snapshot">
      <dl className="flex flex-col gap-3">
        <Row label="role">
          <Val value={project.role} what="your role (IN-05)" />
        </Row>
        <Row label="contribution">
          {project.contribution === "unset" ? (
            <Missing what="contribution scope (IN-05)" />
          ) : (
            <span className="text-yellow">{scopeLabel[project.contribution]}</span>
          )}
        </Row>
        {/* Team size is optional: a Published project without one skips the row
            ("hide until filled"); drafts show the gap. */}
        {project.teamSize ? (
          <Row label="team size">{project.teamSize}</Row>
        ) : project.isDraft ? (
          <Row label="team size">
            <Missing what="team size (IN-05)" />
          </Row>
        ) : null}
        <Row label="period">
          <Val value={project.period} what="period (IN-05)" />
        </Row>
        <Row label="type">{projectTypeLabel[project.type] ?? project.type}</Row>
        <Row label="capabilities">
          {project.capabilities.length > 0 ? (
            project.capabilities.map((c) => capabilityLabel[c] ?? c).join(", ")
          ) : (
            <Missing what="capabilities (IN-05)" />
          )}
        </Row>
        <Row label="stack">
          {project.stack.length > 0 ? (
            <ul aria-label="Stack" className="flex flex-wrap gap-2">
              {project.stack.map((s) => (
                <li key={s}>
                  <Tag>{s}</Tag>
                </li>
              ))}
            </ul>
          ) : (
            <Missing what="stack (IN-05)" />
          )}
        </Row>
        {project.outcomes.length > 0 ? (
          <Row label="outcomes">
            <ul className="flex flex-col gap-2">
              {project.outcomes.map((o) => (
                <li key={o.statement}>
                  <Val value={o.statement} what="outcome" />
                  {/* PRD 14: a number without evidence must not read as a proven fact. */}
                  {o.verified && isFilled(o.evidence) ? (
                    <span className="text-meta text-muted block">evidence: {o.evidence}</span>
                  ) : (
                    <span className="text-meta text-muted block" data-outcome-unverified="">
                      self-reported
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Row>
        ) : null}
      </dl>
    </TerminalFrame>
  );
}

export { CaseStudySnapshot };
