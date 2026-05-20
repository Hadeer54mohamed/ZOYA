import { cookies, headers } from "next/headers";
import Script from "next/script";
import { Cormorant_Garamond, Geist } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import { ThemeProvider } from "./context/ThemeContext";
import LayoutShell from "./components/LayoutShell";
import IntroRoot from "./components/IntroRoot";
import { getNavbarSearchProducts } from "../sanity/lib/products";
import { HERO_BG_DESKTOP, HERO_BG_MOBILE } from "./lib/heroImages";
import { getSiteUrl } from "../lib/siteUrl";

const siteUrl = getSiteUrl();

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ZØYA — Wear Your Identity",
    template: "%s · ZØYA",
  },
  description:
    "ZØYA — premium streetwear. Shop limited drops, express your identity. Cairo-based fashion brand.",
  keywords: ["ZOYA", "streetwear", "fashion", "Egypt", "limited drops"],
  authors: [{ name: "ZØYA" }],
  creator: "ZØYA",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "ZØYA",
    title: "ZØYA — Wear Your Identity",
    description: "Shop limited drops. Crafted for presence. Designed to stand out.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZØYA — Wear Your Identity",
    description: "Shop limited drops. Crafted for presence. Designed to stand out.",
  },
  alternates: { canonical: "/" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const THEME_INIT_SCRIPT = `(function(){try{var d=document.documentElement;var m=document.cookie.match(/(?:^|; )zoya-theme=([^;]*)/);var v=m?decodeURIComponent(m[1]):'';var mode=(v==='light'||v==='dark'||v==='system')?v:'system';var dark=mode==='dark'||(mode==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(mode==='light')dark=false;if(dark){d.classList.add('dark');d.style.colorScheme='dark';}else{d.classList.remove('dark');d.style.colorScheme='light';}}catch(e){}})();`;

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("zoya-theme")?.value;
  const theme =
    themeCookie === "light" || themeCookie === "dark" || themeCookie === "system"
      ? themeCookie
      : "system";
  const isDark = theme === "dark";

  const products = await getNavbarSearchProducts();
  const headersList = await headers();
  const isHome = headersList.get("x-zoya-pathname") === "/";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${cormorant.variable} h-full antialiased ${
        isDark ? "dark" : ""
      }`}
      style={{
        colorScheme: theme === "system" ? "normal" : theme,
      }}
      suppressHydrationWarning
    >
      <head>
        {isHome ? (
          <>
            <link
              rel="preload"
              as="image"
              href={HERO_BG_MOBILE}
              type="image/webp"
              media="(max-width: 767px)"
              fetchPriority="high"
            />
            <link
              rel="preload"
              as="image"
              href={HERO_BG_DESKTOP}
              type="image/webp"
              media="(min-width: 768px)"
              fetchPriority="high"
            />
          </>
        ) : null}
        <Script
          id="zoya-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <ThemeProvider initialTheme={theme}>
          <CartProvider>
            <IntroRoot />
            <LayoutShell products={products}>{children}</LayoutShell>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
