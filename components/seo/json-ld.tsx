/**
 * Structured data. The only allowed use of dangerouslySetInnerHTML (PRD 9
 * conventions): typed, trusted data, with "<" escaped so content can never
 * close the script element.
 */
function JsonLd({ data }: { data: Record<string, unknown> | null }) {
  if (!data) return null;
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export { JsonLd };
