import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Contact Shiva | Software Engineer",
  description:
    "Contact Shiva Mani Goundar about software engineering, cloud integrations, AI, cybersecurity, and technology projects.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
