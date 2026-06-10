import type { Metadata } from "next";
import { ClientProviders } from "@/components/client-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AEGIS AI",
    template: "%s | AEGIS AI",
  },
  description:
    "Confidential asset infrastructure for tokenized finance with private transfers, selective disclosure, and audit-ready workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
