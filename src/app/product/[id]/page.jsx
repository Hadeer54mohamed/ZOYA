import ProductDetailClient from "./ProductDetailClient";
import {
  getProductById,
  getRelatedProducts,
} from "../../../sanity/lib/products";

export const revalidate = 30;

export default async function ProductPage({ params }) {
  const { id } = await params;

  const [product, related] = await Promise.all([
    getProductById(id),
    getRelatedProducts(id, 4),
  ]);

  return <ProductDetailClient key={id} id={id} product={product} related={related} />;
}
