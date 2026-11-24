// Navigation labels and anchors — PRD section 4 (home section order and nav labels).
export type NavItem = { id: string; href: string; label: string };

export const sectionNav: readonly NavItem[] = [
  { id: "about", href: "/#about", label: "./about" },
  { id: "capabilities", href: "/#capabilities", label: "./skills" },
  { id: "experience", href: "/#experience", label: "./experience" },
  { id: "education", href: "/#education", label: "./education" },
  { id: "projects", href: "/#projects", label: "./projects" },
  { id: "testimonials", href: "/testimonials", label: "Recommendations" },
  { id: "approach", href: "/#approach", label: "./approach" },
  { id: "stack", href: "/#stack", label: "./stack" },
  { id: "contact", href: "/#contact", label: "./contact" },
];

export const navCta = { href: "/cv", label: "[ CV ]" } as const;

export const footerNav: readonly { href: string; label: string }[] = [
  { href: "/projects", label: "Projects" },
  { href: "/testimonials", label: "Recommendations" },
  { href: "/cv", label: "CV" },
  { href: "/privacy", label: "Privacy" },
];
