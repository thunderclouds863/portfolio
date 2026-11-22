import { About } from "@/components/sections/about";
import { Approach } from "@/components/sections/approach";
import { Capabilities } from "@/components/sections/capabilities";
import { Contact } from "@/components/sections/contact";
import { Experience } from "@/components/sections/experience";
import { Hero } from "@/components/sections/hero";
import { Projects } from "@/components/sections/projects";
import { Stack } from "@/components/sections/stack";
import { Testimonials } from "@/components/sections/testimonials";
import { getHomeData } from "@/lib/home-data";

// Home — PRD section 4 order: Hero, About, Capabilities, Experience, Projects,
// Approach, Stack, Contact. Testimonials (PRD 17, FR-TST-01) sit after Projects
// and only take a section number when there is something to show.
// All copy comes from content/ via Keystatic.
export default async function Home() {
  const data = await getHomeData();
  const hasTestimonials = data.recommendations.length > 0;
  const n = (base: number) => String(hasTestimonials ? base + 1 : base).padStart(2, "0");

  return (
    <>
      <Hero profile={data.profile} settings={data.settings} />
      <About profile={data.profile} education={data.education[0]} />
      <Capabilities settings={data.settings} projects={data.projects} />
      <Experience experience={data.experience} education={data.education} />
      <Projects projects={data.featuredProjects} />
      <Testimonials items={data.recommendations} number="05" />
      <Approach settings={data.settings} number={n(5)} />
      <Stack skills={data.skills} projects={data.projects} number={n(6)} />
      <Contact profile={data.profile} settings={data.settings} number={n(7)} />
    </>
  );
}
