import type { Metadata } from "next";
import { Suspense } from "react";

import { Missing } from "@/components/content/missing";
import { Reveal } from "@/components/motion/reveal";
import {
  RelationshipChips,
  RelationshipFilter,
  type RelationshipOption,
} from "@/components/testimonials/relationship-filter";
import { TestimonialCard, relationshipText } from "@/components/testimonials/testimonial-card";
import { getHomeData } from "@/lib/home-data";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Testimonials",
  description: "LinkedIn recommendations for Desi Armanda Sari, published with permission.",
  path: "/testimonials",
});

// FR-TST-02: all testimonials, filterable by relationship (state in the URL).
// Source A only for now (LinkedIn recommendations); site submissions (source B)
// and the "Write a testimonial" flow arrive with the Supabase + LinkedIn setup.
export default async function TestimonialsPage() {
  const { recommendations } = await getHomeData();
  const options: RelationshipOption[] = [];
  for (const item of recommendations) {
    const existing = options.find((o) => o.value === item.relationship);
    if (existing) existing.count += 1;
    else options.push({ value: item.relationship, label: relationshipText(item), count: 1 });
  }

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 py-16 md:px-6 md:py-24">
      <header className="flex flex-col gap-4">
        <p className="text-meta text-green-dim">{"> cat ./testimonials"}</p>
        <h1 className="text-display-1 text-green glow">Testimonials</h1>
      </header>

      {recommendations.length === 0 ? (
        <Missing what="published LinkedIn recommendations with permission (IN-08)" />
      ) : (
        <>
          <Suspense
            fallback={
              <RelationshipChips active="all" options={options} total={recommendations.length} />
            }
          >
            <RelationshipFilter options={options} total={recommendations.length} />
          </Suspense>
          <Reveal as="ul" stagger data-testimonial-list="" className="grid gap-6 md:grid-cols-2">
            {recommendations.map((item) => (
              <li key={item.slug} data-relationship={item.relationship}>
                <TestimonialCard item={item} />
              </li>
            ))}
          </Reveal>
        </>
      )}
    </div>
  );
}
