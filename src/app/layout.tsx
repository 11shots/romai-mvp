import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ROME AI - Analyseur d'automatisation des métiers",
  description: "Analysez le potentiel d'automatisation des métiers du référentiel ROME",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
