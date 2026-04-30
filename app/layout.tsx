import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Design Critique AI",
  description: "Upload a UI screenshot and get structured AI design critique."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
