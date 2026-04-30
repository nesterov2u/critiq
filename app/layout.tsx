import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Critiq",
  description: "Загрузите скриншот интерфейса и получите структурированную AI-критику дизайна."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
