"use client";

import { MenuIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { navCta, sectionNav } from "@/lib/nav";

const DESKTOP_QUERY = "(min-width: 768px)";

// FR-NAV-04 / PRD 8.7: full-screen overlay below 768px. Radix provides the
// focus trap, Esc, scroll lock, aria-expanded and aria-controls on the trigger.
function MobileMenu() {
  const [open, setOpen] = useState(false);
  // Active section when the menu opened (FR-NAV-02 indicator inside the overlay).
  const [activeId, setActiveId] = useState<string | null>(null);

  function onOpenChange(next: boolean) {
    if (next) setActiveId(document.documentElement.dataset.activeSection ?? null);
    setOpen(next);
  }
  const router = useRouter();
  // Section id to focus once the menu has closed ("Navigating → Closed: restore focus").
  const pendingTarget = useRef<string | null>(null);

  // "Closed → Closed: viewport ≥ 768px" — close if the viewport grows past the breakpoint.
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function onSectionLink(event: MouseEvent<HTMLAnchorElement>, id: string, href: string) {
    const target = document.getElementById(id);
    if (!target) {
      // Not on the home page: let the router navigate to "/#id" after closing.
      pendingTarget.current = null;
      setOpen(false);
      event.preventDefault();
      router.push(href);
      return;
    }
    // Same page: close first (releases the scroll lock), then scroll and focus.
    event.preventDefault();
    pendingTarget.current = id;
    setOpen(false);
  }

  function onCloseAutoFocus(event: Event) {
    const id = pendingTarget.current;
    pendingTarget.current = null;
    if (!id) return; // default: Radix returns focus to the trigger
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    window.history.pushState(null, "", `#${id}`);
    target.scrollIntoView(); // honours CSS scroll-behavior (off under reduced motion)
    const heading = target.matches("h1, h2") ? target : target.querySelector<HTMLElement>("h2");
    const focusable = heading ?? target;
    if (!focusable.hasAttribute("tabindex")) focusable.setAttribute("tabindex", "-1");
    focusable.focus({ preventScroll: true });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="secondary" size="icon" className="md:hidden" aria-label="Open menu">
          <MenuIcon aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent onCloseAutoFocus={onCloseAutoFocus}>
        <div className="border-green-dim flex h-(--nav-height) shrink-0 items-center justify-between border-b-2 px-4">
          <SheetTitle>Menu</SheetTitle>
          <SheetClose asChild>
            <Button variant="secondary" size="icon" aria-label="Close menu">
              <XIcon aria-hidden="true" />
            </Button>
          </SheetClose>
        </div>
        <SheetDescription>Site sections and CV link</SheetDescription>
        <nav aria-label="Mobile" className="flex flex-1 flex-col px-4 py-8">
          <ul className="flex flex-col gap-2">
            {sectionNav.map((item) => (
              <li key={item.id}>
                <a
                  href={item.href}
                  onClick={(e) => onSectionLink(e, item.id, item.href)}
                  aria-current={activeId === item.id ? "true" : undefined}
                  className="text-green hover:text-amber aria-[current=true]:text-amber flex min-h-12 items-center font-mono text-lg decoration-2 underline-offset-8 aria-[current=true]:underline"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Button asChild>
              <a href={navCta.href} onClick={() => setOpen(false)}>
                {navCta.label}
              </a>
            </Button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export { MobileMenu };
