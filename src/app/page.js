import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ProductSection from "./components/ProductSection";

export default function Home() {
  return (
    <main className="bg-white dark:bg-black transition-colors duration-500">
      <Navbar />
      <Hero />
      <ProductSection />
    </main>
  );
}
