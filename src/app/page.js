import { Suspense } from "react";
import dynamic from "next/dynamic";
import Hero from "./components/Hero";
import ProductSection from "./components/ProductSection";
import FeaturedDropSection from "./components/FeaturedDropSection";
import HashScroller from "./components/HashScroller";
import SectionSkeleton from "./components/SectionSkeleton";
import LazyInView from "./components/LazyInView";
import SocialSection from "./components/SocialSection";
import TestimonialsSection from "./components/home/TestimonialsSection";
import { getHomepageProducts, getAllCategories } from "../sanity/lib/products";

const HorizontalProductSection = dynamic(
  () => import("./components/HorizontalProductSection"),
  { loading: () => <SectionSkeleton /> },
);

const BrandSection = dynamic(() => import("./components/BrandSection"), {
  loading: () => <SectionSkeleton className="h-[420px] md:h-[520px]" />,
});

const ReelsGallery = dynamic(() => import("./components/ReelsGallery"), {
  loading: () => <SectionSkeleton className="h-72 md:h-96" />,
});

async function ReelsBlock() {
  const { getAllReels } = await import("../sanity/lib/instagramReel");
  const reels = await getAllReels();
  return <ReelsGallery reels={reels} />;
}

export default async function Home() {
  const [products, categories] = await Promise.all([
    getHomepageProducts(),
    getAllCategories(),
  ]);

  return (
    <main className="overflow-x-hidden bg-white dark:bg-black transition-colors duration-500">
      <HashScroller />
      <Hero />
      <FeaturedDropSection />
      <ProductSection products={products} categories={categories} />
      <LazyInView sectionId="collections" minHeight="320px">
        <HorizontalProductSection products={products} />
      </LazyInView>
      <LazyInView sectionId="about" minHeight="420px">
        <BrandSection />
      </LazyInView>
      <Suspense fallback={<SectionSkeleton className="h-80 md:h-96" />}>
        <TestimonialsSection />
      </Suspense>
      <LazyInView minHeight="400px">
        <Suspense fallback={<SectionSkeleton className="h-72 md:h-96" />}>
          <ReelsBlock />
        </Suspense>
      </LazyInView>
      <div id="contact" className="scroll-mt-28">
        <SocialSection />
      </div>
    </main>
  );
}
