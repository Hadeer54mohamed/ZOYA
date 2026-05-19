"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import ScrollToTopOnLoad from "./ScrollToTopOnLoad";
import DeferredCartDrawer from "./DeferredCartDrawer";
import { scrollPageToTopReliable } from "../lib/scrollToTop";

const Footer = dynamic(() => import("./Footer.jsx"));

export default function LayoutShell({ children, products = [] }) {
  const pathname = usePathname();
  const isStudio = pathname?.startsWith("/studio");
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    if (isStudio || isAdmin) return;
    if (pathname === "/") return;
    return scrollPageToTopReliable();
  }, [pathname, isStudio, isAdmin]);

  if (isStudio || isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar products={products} />
      <ScrollToTopOnLoad />
      <div key={pathname}>{children}</div>
      <Footer />
      <DeferredCartDrawer />
    </>
  );
}
