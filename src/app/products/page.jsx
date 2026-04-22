import ProductsClient from "./ProductsClient";
import { getAllProducts, getAllCategories } from "../../sanity/lib/products";

export const revalidate = 30;

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getAllCategories(),
  ]);

  return <ProductsClient products={products} categories={categories} />;
}
