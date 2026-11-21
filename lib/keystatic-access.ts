// FR-CMS-02/03: local storage writes to the filesystem, so the admin UI and
// API are only available in development unless GitHub storage is configured.
export function isKeystaticEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE === "github"
  );
}
