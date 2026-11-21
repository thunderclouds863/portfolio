import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Desi Armanda Sari",
  description: "TODO(content): meta description from confirmed headline (IN-01)",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
