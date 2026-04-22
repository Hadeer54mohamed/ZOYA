import Hero from "./components/Hero";
import ProductSection from "./components/ProductSection";
import BrandSection from "./components/BrandSection";
import HorizontalProductSection from "./components/HorizontalProductSection";
import FeaturedDropSection from "./components/FeaturedDropSection";
import InteractiveSection from "./components/InteractiveSection";
import HashScroller from "./components/HashScroller";

export default function Home() {
  return (
    <main className="bg-white dark:bg-black transition-colors duration-500">
      <HashScroller />
      <Hero />
      <FeaturedDropSection />
      <BrandSection />
      <ProductSection />
      <HorizontalProductSection />
      <InteractiveSection />
    </main>
  );
}
