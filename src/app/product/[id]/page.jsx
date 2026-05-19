import ProductDetailClient from "./ProductDetailClient";
import {
  getProductById,
  getRelatedProducts,
} from "../../../sanity/lib/products";

export const revalidate = 30;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product?.name) {
    return { title: "Product" };
  }
  const description =
    typeof product.description === "string" && product.description.trim()
      ? product.description.slice(0, 160)
      : `Shop ${product.name} at ZØYA.`;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${id}` },
    openGraph: {
      title: product.name,
      description,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }) {
  const { id } = await params;

  const [product, related] = await Promise.all([
    getProductById(id),
    getRelatedProducts(id, 4),
  ]);

  return <ProductDetailClient key={id} id={id} product={product} related={related} />;
}
