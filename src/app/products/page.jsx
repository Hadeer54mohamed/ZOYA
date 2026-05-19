import ProductsClient from "./ProductsClient";
import { getAllProducts, getAllCategories } from "../../sanity/lib/products";

export const metadata = {
  title: "Shop All Products",
  description: "Browse the full ZØYA collection — limited drops, new arrivals, and exclusive pieces.",
  alternates: { canonical: "/products" },
};

export const revalidate = 30;

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getAllCategories(),
  ]);

  return <ProductsClient products={products} categories={categories} />;
}
