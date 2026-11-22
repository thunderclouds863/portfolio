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

/** Relationship as shown: the entry's own label if set, else the standard one. */
export function relationshipText(item: RecommendationView): string {
  return item.relationshipLabel?.trim() || relationshipLabel[item.relationship] || "Other";
}

/**
 * A testimonial (PRD 17). Source A = LinkedIn recommendation, published word
 * for word with a "LinkedIn recommendation" label. No rating, no stars, no date
 * (owner's decision). Paragraphs in the text are kept.
 */
function TestimonialCard({ item, large = false, className }: TestimonialCardProps) {
  const paragraphs = item.text.split(/\n{2,}/).filter((p) => p.trim() !== "");
  return (
    <figure
      className={cn(
        "bg-panel border-green-dim flex h-full flex-col gap-5 border-2 p-6",
        large && "border-green shadow-pixel lg:p-10",
        className,
      )}
    >
      <blockquote
        className={cn("flex flex-col gap-3", large ? "text-lg text-white" : "text-muted")}
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
      <figcaption className="mt-auto flex flex-col gap-1">
        <span className="text-h3 text-green">{item.authorName}</span>
        <span className="text-sm">{item.authorHeadline}</span>
        <span className="text-meta text-muted flex flex-wrap items-center gap-2">
          {relationshipText(item)}
          <span aria-hidden="true">{"·"}</span>
          <span className="border-green-dim text-green border px-1.5">LinkedIn recommendation</span>
          <DraftBadge show={item.isDraft} />
        </span>
      </figcaption>
    </figure>
  );
}

export { TestimonialCard };
