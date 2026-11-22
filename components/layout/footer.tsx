import Link from "next/link";

import { FallbackLinkIcon, linkIcons } from "@/components/content/link-icons";
import { Missing } from "@/components/content/missing";
import { getHomeData } from "@/lib/home-data";
import { footerNav, sectionNav } from "@/lib/nav";

// FR-FTR-01: copyright, secondary nav, social links with accessible names,
// /privacy link, "Built with Next.js, deployed on Vercel".
// The links come from the Published profile (same cached data as the home page).
async function Footer() {
  const { profile } = await getHomeData();
  const links = (profile?.links ?? []).flatMap((link) =>
    link.url ? [{ ...link, url: link.url }] : [],
  );
  return (
    <footer className="border-green-dim mt-auto border-t-2 print:hidden">
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
          {links.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {links.map((link) => {
                const Icon = linkIcons[link.icon] ?? FallbackLinkIcon;
                const external = !link.url.startsWith("mailto:");
                return (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="text-muted hover:text-amber inline-flex min-h-8 max-w-full items-center gap-2 font-mono text-sm"
                    >
                      <Icon aria-hidden="true" className="size-4 shrink-0" />
                      {/* Long labels (an email address) wrap instead of widening the page. */}
                      <span className="min-w-0 [overflow-wrap:anywhere]">{link.label}</span>
                      {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Missing what="email, LinkedIn, GitHub links (IN-10)" />
          )}
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
