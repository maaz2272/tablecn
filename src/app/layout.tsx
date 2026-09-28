import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tasks | tablecn-clone",
  description:
    "A MERN-flavored clone of tablecn.com: Next.js + Hono + Postgres + TanStack Table + shadcn/ui.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <NuqsAdapter>{children}</NuqsAdapter>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
