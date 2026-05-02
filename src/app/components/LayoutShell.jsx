"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer.jsx";
import ScrollToTopOnLoad from "./ScrollToTopOnLoad";
import CartDrawer from "./CartDrawer";
import Intro from "./Intro";

export default function LayoutShell({ children, products = [] }) {
  const pathname = usePathname();
  const isStudio = pathname?.startsWith("/studio");
  const isAdmin = pathname?.startsWith("/admin");

  if (isStudio || isAdmin) {
    return <>{children}
    </>;
  }

  return (
    <>
      <Intro />
      <Navbar products={products} />
      <ScrollToTopOnLoad />
      {children}
      <Footer />
      <CartDrawer />
    </>
  );
}
