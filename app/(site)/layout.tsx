import { SiteChrome } from "@/components/layout/site-chrome";

import "../globals.css";

// Public site layout. Global styles live here (not in the root layout) so the
// Keystatic admin at /keystatic is not styled by them.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return <SiteChrome>{children}</SiteChrome>;
}
