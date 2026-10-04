import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rutea MDP",
  description: "Gestión y optimización de rutas de reparto en Mar del Plata",
  manifest: "/manifest.webmanifest"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
