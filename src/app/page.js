import Hero from "./components/Hero";
import ProductSection from "./components/ProductSection";
import BrandSection from "./components/BrandSection";
import HorizontalProductSection from "./components/HorizontalProductSection";
import FeaturedDropSection from "./components/FeaturedDropSection";
import InteractiveSection from "./components/InteractiveSection";
import HashScroller from "./components/HashScroller";
import { getAllProducts, getAllCategories } from "../sanity/lib/products";

export default async function Home() {
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getAllCategories(),
  ]);

  return (
    <main className="bg-white dark:bg-black transition-colors duration-500">
      <HashScroller />
      <Hero />
      <FeaturedDropSection />
      <BrandSection />
      <ProductSection products={products} categories={categories} />
      <HorizontalProductSection products={products} />
      <InteractiveSection />
    </main>
  );
}
