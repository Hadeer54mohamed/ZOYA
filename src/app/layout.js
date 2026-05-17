import { cookies } from "next/headers";
import Script from "next/script";
import { Geist } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import { ThemeProvider } from "./context/ThemeContext";
import LayoutShell from "./components/LayoutShell";
import { getNavbarSearchProducts } from "../sanity/lib/products";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata = {
  title: "ZOYA",
  description: "ZØYA - Wear Your Identity",
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

  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full antialiased ${
        isDark ? "dark" : ""
      }`}
      style={{
        colorScheme: theme === "system" ? "normal" : theme,
      }}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="zoya-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <ThemeProvider initialTheme={theme}>
          <CartProvider>
            <LayoutShell products={products}>{children}</LayoutShell>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
