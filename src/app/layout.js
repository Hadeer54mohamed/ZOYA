import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import { ThemeProvider } from "./context/ThemeContext";
import LayoutShell from "./components/LayoutShell";
import { getAllProducts } from "../sanity/lib/products";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "ZOYA",
  description: "ZØYA - Wear Your Identity",
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("zoya-theme")?.value;
  const theme = themeCookie === "light" ? "light" : "dark";
  const isDark = theme === "dark";

  const products = await getAllProducts();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased ${
        isDark ? "dark" : ""
      }`}
      style={{ colorScheme: theme }}
      suppressHydrationWarning
    >
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
