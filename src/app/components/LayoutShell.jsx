"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer.jsx";
import ScrollToTopOnLoad from "./ScrollToTopOnLoad";

const Intro = dynamic(() => import("./Intro"), { ssr: false });
const CartDrawer = dynamic(() => import("./CartDrawer"), { ssr: false });

export default function LayoutShell({ children, products = [] }) {
  const pathname = usePathname();
  const isStudio = pathname?.startsWith("/studio");
  const isAdmin = pathname?.startsWith("/admin");

  if (isStudio || isAdmin) {
    return <>{children}</>;
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
