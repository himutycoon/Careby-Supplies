import type { Metadata, Viewport } from "next";
import { Fraunces } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/components/shop/cart-provider";
import { ToastProvider } from "@/components/shared/toast";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  title: "CareBy Supplies",
  description:
    "Building materials for trade and homeowners across the GTA. Photograph a room, get the material list and price, delivered to site.",
  // Lets iOS render it full-screen when saved to the home screen.
  appleWebApp: { capable: true, title: "CareBy", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

/**
 * viewportFit "cover" is what makes env(safe-area-inset-*) report real
 * values on notched iPhones — without it the insets are always 0 and
 * the fixed bottom tab bar sits under the home indicator.
 *
 * maximumScale is left at the browser default: capping it would block
 * pinch-zoom, which is an accessibility failure.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider>
            <CartProvider>
              <TooltipProvider>{children}</TooltipProvider>
            </CartProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
