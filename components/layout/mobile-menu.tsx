"use client";

import { MenuIcon, XIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";

import { ProjectsNavIndicator } from "@/components/projects/project-discovery";
import { navCta, sectionNav } from "@/lib/nav";
import type { ProjectPublishRef } from "@/lib/project-discovery";
import { cn } from "@/lib/utils";

import { scrollToSection, setPendingSectionTarget } from "./active-section";

const DESKTOP_QUERY = "(min-width: 1024px)";

/** Button size, vertical step between orbit items, how far the arc bows left. */
const BUTTON_PX = 56;
const STEP_PX = 46;
const BOW_PX = 16;
/** Approximate chip box, for drawing the orbit line through the chips' middles. */
const CHIP_W = 104;
const CHIP_H = 44;

type OrbitItem = { key: string; href: string; label: string; id?: string; primary?: boolean };

const ITEMS: readonly OrbitItem[] = [
  ...sectionNav.map((item) => ({ key: item.id, href: item.href, label: item.label, id: item.id })),
  { key: "cv", href: navCta.href, label: navCta.label, primary: true },
];

/**
 * Offset of item i from the button's bottom-right corner (chips share that
 * anchor): stacked upwards above the button, the middle of the arc bowing left.
 */
function orbitPosition(i: number, n: number) {
  const t = n > 1 ? i / (n - 1) : 0;
  return {
    x: -Math.round(BOW_PX * Math.sin(Math.PI * t)),
    y: -(BUTTON_PX + 10 + i * STEP_PX),
  };
}

/** The dashed orbit: from the button centre through the middle of every chip. */
const SVG_W = BOW_PX + CHIP_W + 20;
const SVG_H = BUTTON_PX + 10 + ITEMS.length * STEP_PX;
const ORBIT_D = [
  `M${SVG_W - BUTTON_PX / 2} ${SVG_H - BUTTON_PX / 2}`,
  ...ITEMS.map((_, i) => {
    const p = orbitPosition(i, ITEMS.length);
    return `L${SVG_W + p.x - CHIP_W / 2} ${SVG_H + p.y - CHIP_H / 2}`;
  }),
].join(" ");

const buttonClass =
  "bg-panel border-green text-green shadow-pixel hover:border-amber hover:text-amber fixed right-[calc(1.25rem+env(safe-area-inset-right))] bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-[210] inline-flex size-14 items-center justify-center border-2 lg:hidden";

/**
 * Mobile navigation (owner override 4, docs/decisions/0002): a square pixel
 * button fixed in the bottom-right corner opens the sections as an "orbit", an
 * arc of links launched from the button. Radix Dialog provides the focus trap,
 * Esc, scroll lock, aria-expanded/aria-controls and focus return. Links >= 44px.
 * Under reduced motion the items appear without the launch animation.
 */
function MobileMenu({
  discoveryProjects = [],
}: {
  discoveryProjects?: readonly ProjectPublishRef[];
}) {
  const [open, setOpen] = useState(false);
  // Active section when the menu opened (FR-NAV-02 indicator inside the menu).
  const [activeId, setActiveId] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  // Section id to focus once the menu has closed ("Navigating -> Closed: restore focus").
  const pendingTarget = useRef<string | null>(null);

  function onOpenChange(next: boolean) {
    if (next) setActiveId(document.documentElement.dataset.activeSection ?? null);
    setOpen(next);
  }

  // Close if the viewport grows past the breakpoint.
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function onSectionLink(event: MouseEvent<HTMLAnchorElement>, id: string, href: string) {
    event.preventDefault();
    if (!href.startsWith("/#")) {
      pendingTarget.current = null;
      setOpen(false);
      router.push(href);
      return;
    }
    // Check pathname (not document.getElementById): under Next.js 16 Cache Components,
    // `/` stays mounted inside a hidden <Activity> tree when viewing detail routes.
    if (pathname !== "/") {
      pendingTarget.current = null;
      setPendingSectionTarget(id);
      setOpen(false);
      router.push(href, { scroll: false });
      return;
    }
    // Same page: close first (releases the scroll lock), then scroll and focus.
    pendingTarget.current = id;
    setOpen(false);
  }

  function onCloseAutoFocus(event: Event) {
    const id = pendingTarget.current;
    pendingTarget.current = null;
    if (!id) return; // default: Radix returns focus to the trigger
    const target = document.getElementById(id);
    if (!target || target.getClientRects().length === 0) return;
    event.preventDefault();
    const nextHash = `#${id}`;
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, "", nextHash);
    }
    scrollToSection(id, { smooth: true });
    const heading = target.matches("h1, h2") ? target : target.querySelector<HTMLElement>("h2");
    const focusable = heading ?? target;
    if (!focusable.hasAttribute("tabindex")) focusable.setAttribute("tabindex", "-1");
    focusable.focus({ preventScroll: true });
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Trigger className={buttonClass} aria-label="Open menu">
        <MenuIcon aria-hidden="true" />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        {/* Radix applies the body scroll lock inside Overlay, so it must be rendered. */}
        <DialogPrimitive.Overlay className="orbit-overlay fixed inset-0 z-[200]" />
        <DialogPrimitive.Content
          onCloseAutoFocus={onCloseAutoFocus}
          className="fixed inset-0 z-[205] overflow-hidden"
        >
          <DialogPrimitive.Title className="sr-only">Menu</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Site sections and CV link
          </DialogPrimitive.Description>

          {/* Decorative orbit line along the arc. */}
          <svg
            aria-hidden="true"
            className="orbit-path text-green-dim pointer-events-none fixed right-[calc(1.25rem+env(safe-area-inset-right))] bottom-[calc(1.25rem+env(safe-area-inset-bottom))]"
            width={SVG_W}
            height={SVG_H}
          >
            <path
              d={ORBIT_D}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="4 6"
            />
          </svg>

          <nav aria-label="Mobile">
            <ul>
              {ITEMS.map((item, i) => {
                const p = orbitPosition(i, ITEMS.length);
                const style = {
                  "--orbit-x": `${p.x}px`,
                  "--orbit-y": `${p.y}px`,
                  "--orbit-delay": `${i * 35}ms`,
                } as CSSProperties;
                const current = !!item.id && activeId === item.id;
                return (
                  <li
                    key={item.key}
                    className="orbit-item fixed right-[calc(1.25rem+env(safe-area-inset-right))] bottom-[calc(1.25rem+env(safe-area-inset-bottom))]"
                    style={style}
                  >
                    <a
                      href={item.href}
                      onClick={
                        item.id
                          ? (e) => onSectionLink(e, item.id!, item.href)
                          : () => setOpen(false)
                      }
                      aria-current={current ? "true" : undefined}
                      className={cn(
                        "shadow-pixel flex min-h-11 min-w-24 items-center justify-end border-2 px-2 font-mono text-xs whitespace-nowrap",
                        item.primary
                          ? "bg-amber border-amber text-bg"
                          : "bg-panel border-green text-green hover:border-amber hover:text-amber aria-[current=true]:border-amber aria-[current=true]:text-amber",
                      )}
                    >
                      {item.label}
                      {item.id === "projects" ? (
                        <ProjectsNavIndicator projects={discoveryProjects} />
                      ) : null}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <DialogPrimitive.Close className={buttonClass} aria-label="Close menu">
            <XIcon aria-hidden="true" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export { MobileMenu };
