import Link from "next/link";

import { Reveal } from "@/components/motion/reveal";
import { TestimonialCard } from "@/components/testimonials/testimonial-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RecommendationView } from "@/lib/views";

import { Section } from "./section";

const MAX_ON_HOME = 6; // FR-TST-01

// FR-TST-01: up to 6 items, asymmetric (one large quote, smaller ones beside it),
// newest first, link to /testimonials. Hidden entirely when there is nothing to show.
// The "Write a testimonial" button (site submissions, source B) arrives with the
// Supabase + LinkedIn sign-in setup.
function Testimonials({ items, number }: { items: RecommendationView[]; number: string }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, MAX_ON_HOME);

  return (
    <Section id="testimonials" number={number} title="Testimonials">
      <Reveal stagger className="grid gap-6 lg:grid-cols-12">
        {shown.map((item, index) => (
          <TestimonialCard
            key={item.slug}
            item={item}
            large={index === 0}
            className={cn(index === 0 ? "lg:col-span-7 lg:row-span-2" : "lg:col-span-5")}
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
