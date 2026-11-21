// Decorative CRT scanlines. Styles in app/globals.css (.scanlines):
// opacity 0.05, pointer-events none, hidden under reduced motion and in print.
function ScanlineOverlay() {
  return <div aria-hidden="true" data-testid="scanlines" className="scanlines" />;
}

export { ScanlineOverlay };
