import { About } from "@/components/sections/about";
import { Approach } from "@/components/sections/approach";
import { Capabilities } from "@/components/sections/capabilities";
import { Contact } from "@/components/sections/contact";
import { Experience } from "@/components/sections/experience";
import { Hero } from "@/components/sections/hero";
import { Projects } from "@/components/sections/projects";
import { Stack } from "@/components/sections/stack";
import { getHomeData } from "@/lib/home-data";

// Home — PRD section 4 order: Hero, About, Capabilities, Experience, Projects,
// Approach, Stack, Contact. All copy comes from content/ via Keystatic.
export default async function Home() {
  const data = await getHomeData();

  return (
    <>
      <Hero profile={data.profile} settings={data.settings} />
      <About profile={data.profile} education={data.education[0]} />
      <Capabilities settings={data.settings} projects={data.projects} />
      <Experience experience={data.experience} education={data.education} />
      <Projects projects={data.featuredProjects} />
      <Approach settings={data.settings} />
      <Stack skills={data.skills} projects={data.projects} />
      <Contact profile={data.profile} settings={data.settings} />
    </>
  );
}
