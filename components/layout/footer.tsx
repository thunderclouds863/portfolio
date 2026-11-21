import Link from "next/link";

import { Missing } from "@/components/content/missing";
import { footerNav, sectionNav } from "@/lib/nav";

// FR-FTR-01: copyright, secondary nav, social icons with accessible names,
// /privacy link, "Built with Next.js, deployed on Vercel".
function Footer() {
  return (
    <footer className="border-green-dim mt-auto border-t-2">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-12 md:grid-cols-12 md:px-6">
        <nav aria-label="Footer" className="md:col-span-5">
          <h2 className="text-label text-green mb-4">Index</h2>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
            {sectionNav.map((item) => (
              <li key={item.id}>
                <a
                  href={item.href}
                  className="text-muted hover:text-amber inline-flex min-h-8 items-center font-mono text-sm"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-4">
          <h2 className="text-label text-green mb-4">Pages</h2>
          <ul className="flex flex-col gap-1">
            {footerNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-muted hover:text-amber inline-flex min-h-8 items-center font-mono text-sm"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-3">
          <h2 className="text-label text-green mb-4">Links</h2>
          {/* TODO(content): email, LinkedIn and GitHub URLs (IN-10) → icon links with aria-labels */}
          <Missing what="email, LinkedIn, GitHub links (IN-10)" />
        </div>

        <div className="border-green-dim text-meta text-muted flex flex-col gap-1 border-t pt-6 md:col-span-12 md:flex-row md:justify-between">
          <p>&copy; 2026 Desi Armanda Sari</p>
          <p>Built with Next.js, deployed on Vercel</p>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
