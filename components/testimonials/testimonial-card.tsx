import { ArrowUpRight, ExternalLink } from "lucide-react";
import Image from "next/image";

import { DraftBadge } from "@/components/content/val";
import { relationshipLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RecommendationView } from "@/lib/views";

type TestimonialCardProps = {
  item: RecommendationView;
  /** The large quote in the asymmetric home layout. */
  large?: boolean;
  className?: string;
};

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: "LinkedIn recommendation",
  shopee: "Shopee",
  whatsapp: "WhatsApp",
  email: "Email",
  google: "Google",
  other: "Recommendation",
};

/** Relationship as shown: the entry's own label if set, else the standard one. */
export function relationshipText(item: RecommendationView): string {
  return item.relationshipLabel?.trim() || relationshipLabel[item.relationship] || "Other";
}

/** Platform label: custom description when "other", otherwise restrained platform name. */
export function platformText(item: RecommendationView): string {
  const key = item.platform || "linkedin";
  if (key === "other" && item.platformLabel?.trim()) return item.platformLabel.trim();
  return PLATFORM_LABELS[key] ?? "Recommendation";
}

/**
 * Multi-platform recommendation card (Phase 9 Workstream C):
 * - Keeps quote cards visually calm (removes false card-level hover lift on non-clickable <figure>).
 * - Gives linked contributor names an understated, always-discoverable LinkedIn affordance
 *   (subtle persistent underline + diagonal arrow shift on hover/focus + accessible context)
 *   that works identically across touch, keyboard, and pointer devices.
 */
function TestimonialCard({ item, large = false, className }: TestimonialCardProps) {
  const paragraphs = item.text.split(/\n{2,}/).filter((p) => p.trim() !== "");
  const linkedinUrl = item.linkedinUrl?.trim() || null;
  const sourceUrl = item.sourceUrl?.trim() || null;
  const headline = item.authorHeadline?.trim() || null;
  const organization = item.organization?.trim() || null;
  const avatar = item.avatar?.trim() || null;
  const evidenceImage = item.evidenceImage?.trim() || null;

  return (
    <figure
      data-platform={item.platform || "linkedin"}
      className={cn(
        "bg-panel border-green-dim flex h-full flex-col gap-5 border-2 p-6",
        large && "border-green shadow-pixel lg:p-10",
        className,
      )}
    >
      <blockquote
        className={cn(
          "flex flex-col gap-3",
          // The lead quote spans the full row; keep its lines readable (PRD 6: max 68ch).
          large ? "max-w-[68ch] text-lg text-white" : "text-muted",
        )}
      >
        {paragraphs.map((p, i) => (
          <p key={i}>
            {i === 0 ? (
              <span aria-hidden="true" className="text-green mr-1 font-mono">
                &ldquo;
              </span>
            ) : null}
            {p}
            {i === paragraphs.length - 1 ? (
              <span aria-hidden="true" className="text-green ml-1 font-mono">
                &rdquo;
              </span>
            ) : null}
          </p>
        ))}
      </blockquote>

      {evidenceImage ? (
        <details className="border-green-dim bg-bg border p-3">
          <summary className="text-meta text-green hover:text-amber cursor-pointer select-none">
            [ Screenshot evidence ]
          </summary>
          <div className="mt-3 flex flex-col gap-2">
            <div className="border-green-dim relative aspect-video w-full overflow-hidden border">
              <Image
                src={evidenceImage}
                alt={item.evidenceAlt?.trim() || `Screenshot evidence for ${item.authorName}`}
                fill
                sizes="(min-width: 1024px) 520px, 90vw"
                className="object-contain"
              />
            </div>
            <a
              href={evidenceImage}
              target="_blank"
              rel="noopener noreferrer"
              className="text-meta text-amber hover:text-yellow inline-flex items-center gap-1.5 self-start underline-offset-4 hover:underline"
            >
              [ Open full screenshot
              <ExternalLink aria-hidden="true" className="size-3.5" /> ]
            </a>
          </div>
        </details>
      ) : null}

      <figcaption className="border-green-dim/40 mt-auto flex items-start gap-3 border-t border-dashed pt-4">
        {avatar ? (
          <div className="border-green-dim relative size-11 shrink-0 overflow-hidden border-2">
            <Image
              src={avatar}
              alt={item.avatarAlt?.trim() || `Portrait of ${item.authorName}`}
              fill
              sizes="44px"
              className="object-cover"
            />
          </div>
        ) : null}

        <div className="flex min-w-0 flex-col gap-1">
          {linkedinUrl ? (
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-contributor-link=""
              className="group/author text-h3 hover:text-amber focus-visible:text-amber inline-flex min-h-11 max-w-full flex-wrap items-center gap-x-2 gap-y-0.5 self-start text-white transition-colors duration-(--dur-fast)"
            >
              <span className="border-green-dim group-hover/author:border-amber group-focus-visible/author:border-amber border-b border-dashed pb-0.5 transition-colors duration-(--dur-fast)">
                {item.authorName}
              </span>
              <span
                aria-hidden="true"
                className="text-meta text-green-dim group-hover/author:text-amber group-focus-visible/author:text-amber inline-flex items-center gap-0.5 text-xs transition-colors duration-(--dur-fast)"
              >
                <span>in</span>
                <ArrowUpRight className="size-3.5 transition-transform duration-(--dur-fast) group-hover/author:translate-x-0.5 group-hover/author:-translate-y-0.5 group-focus-visible/author:translate-x-0.5 group-focus-visible/author:-translate-y-0.5 motion-reduce:transform-none" />
              </span>
              <span className="sr-only"> (LinkedIn profile, opens in a new tab)</span>
            </a>
          ) : (
            <span className="text-h3 text-white">{item.authorName}</span>
          )}

          {headline || organization ? (
            <span className="text-sm">{[headline, organization].filter(Boolean).join(" · ")}</span>
          ) : null}

          <span className="text-meta text-muted flex flex-wrap items-center gap-2 pt-0.5 text-xs">
            <span>{relationshipText(item)}</span>
            <span aria-hidden="true">{"·"}</span>
            <span className="text-green-dim">{platformText(item)}</span>
            {sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber hover:text-yellow inline-flex items-center gap-1 underline underline-offset-4"
              >
                Source
                <ArrowUpRight aria-hidden="true" className="size-3" />
                <span className="sr-only"> for {item.authorName} (opens in a new tab)</span>
              </a>
            ) : null}
            <DraftBadge show={item.isDraft} />
          </span>
        </div>
      </figcaption>
    </figure>
  );
}

export { TestimonialCard };
