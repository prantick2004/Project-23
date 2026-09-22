import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "nit Solution | Smart CCTV & Workforce Management",
  description:
    "nit Solution — CCTV employee monitoring, attendance, and multi-store management platform. Frontend demo build.",
  icons: { icon: "/logo/favicon.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
