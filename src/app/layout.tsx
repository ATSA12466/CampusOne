import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { themeInitScript } from "@/config/theme";
import { pageMetadata } from "@/config/metadata";
import "./globals.css";

const text = localFont({
  src: "./fonts/manrope-latin-variable.woff2",
  variable: "--font-text",
  weight: "200 800",
  display: "swap",
  adjustFontFallback: false,
});
const extended = localFont({
  src: "./fonts/manrope-latin-ext-variable.woff2",
  variable: "--font-text-extended",
  weight: "200 800",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
const editorial = localFont({
  src: "./fonts/fraunces-latin-variable.woff2",
  variable: "--font-editorial",
  weight: "100 900",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});
const description =
  "Your campus, connected. A home for GCTU academics, student communities, events and everyday campus life.";
export const metadata: Metadata = {
  ...pageMetadata("CampusOne — Your campus, connected", description),
  title: { default: "CampusOne — Your campus, connected", template: "%s | CampusOne" },
  description,
  applicationName: "CampusOne",
  robots: { index: false, follow: false }, // Student/demo content is not an indexable public directory.
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en-GH"
      suppressHydrationWarning
      className={`${text.variable} ${extended.variable} ${editorial.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
