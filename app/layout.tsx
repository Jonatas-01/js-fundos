import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Two faces, each with a job: Space Grotesk's flat terminals and wide caps
// carry the headings and the money figures, Inter does everything that has to
// be read in a paragraph.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const display = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "J&S Fundos",
  description: "Nossas economias compartilhadas, sem abrir dois aplicativos de banco.",
};

// One theme, so one browser-chrome colour — it matches the cream page ground.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fdf3e3",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${display.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
