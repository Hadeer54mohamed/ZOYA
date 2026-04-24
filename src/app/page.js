import Hero from "./components/Hero";
import ProductSection from "./components/ProductSection";
import BrandSection from "./components/BrandSection";
import HorizontalProductSection from "./components/HorizontalProductSection";
import FeaturedDropSection from "./components/FeaturedDropSection";
import SocialSection from "./components/SocialSection";
import HashScroller from "./components/HashScroller";
import { getAllProducts, getAllCategories } from "../sanity/lib/products";
import { getAllTestimonials } from "../sanity/lib/testimonials";
import { getAllReels } from "../sanity/lib/instagramReel";
import Testimonials from "./components/Testimonials";
import ReelsGallery from "./components/ReelsGallery";

export default async function Home() {
  const [products, categories, testimonials, reels] = await Promise.all([
    getAllProducts(),
    getAllCategories(),
    getAllTestimonials(),
    getAllReels(),
  ]);

  return (
    <main className="bg-white dark:bg-black transition-colors duration-500">
      <HashScroller />
      <Hero />
      <FeaturedDropSection />
      <BrandSection />
      <ProductSection products={products} categories={categories} />
      <HorizontalProductSection products={products} />
      <SocialSection />
      <Testimonials testimonials={testimonials} />
      <ReelsGallery reels={reels} />
    </main>
  );
}
