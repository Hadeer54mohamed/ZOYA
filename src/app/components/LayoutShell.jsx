"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer.jsx";
import ScrollToTopOnLoad from "./ScrollToTopOnLoad";
import CartDrawer from "./CartDrawer";

export default function LayoutShell({ children, products = [] }) {
  const pathname = usePathname();
  const isStudio = pathname?.startsWith("/studio");

  if (isStudio) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar products={products} />
      <ScrollToTopOnLoad />
      {children}
      <Footer />
      <CartDrawer />
    </>
  );
}
