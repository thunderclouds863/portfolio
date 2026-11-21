// FR-NAV-05: first focusable element, visible on focus.
function SkipLink() {
  return (
    <a
      href="#main"
      className="text-label bg-amber text-bg sr-only z-500 px-4 py-3 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
    >
      Skip to content
    </a>
  );
}

export { SkipLink };
