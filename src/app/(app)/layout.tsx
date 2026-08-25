import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { fontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Potato Corner — Barthilas US Horde",
  description: "Semi-hardcore Mythic progression guild on Barthilas-US.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The font variables go on <html> so they are in scope above the Season
    // theme class, which is set further down on the page wrapper.
    <html lang="en" suppressHydrationWarning className={fontVariables}>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
