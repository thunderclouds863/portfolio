import Link from "next/link";

import { Reveal } from "@/components/motion/reveal";
import { TestimonialCard } from "@/components/testimonials/testimonial-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RecommendationView } from "@/lib/views";

import { Section } from "./section";

const MAX_ON_HOME = 6; // FR-TST-01

// FR-TST-01: up to 6 items, asymmetric, newest first, link to /testimonials.
// Hidden entirely when there is nothing to show. Composition: a full-width lead
// quote with the rest in two columns beneath it, so it does not repeat the
// Capabilities layout (one large block beside two stacked ones; PRD 14).
// The "Write a testimonial" button (site submissions, source B) arrives with the
// Supabase + LinkedIn sign-in setup.
function Testimonials({ items, number }: { items: RecommendationView[]; number: string }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, MAX_ON_HOME);

  return (
    <Section id="testimonials" number={number} title="Recommendations">
      <Reveal stagger direction="scale" className="grid gap-6 lg:grid-cols-12">
        {shown.map((item, index) => (
          <TestimonialCard
            key={item.slug}
            item={item}
            large={index === 0}
            className={cn(index === 0 ? "lg:col-span-12" : "lg:col-span-6")}
          />
        ))}
      </Reveal>
      <div className="mt-10">
        <Button asChild variant="secondary">
          <Link href="/testimonials">[ All testimonials ]</Link>
        </Button>
      </div>
    </Section>
  );
}

export { Testimonials };
