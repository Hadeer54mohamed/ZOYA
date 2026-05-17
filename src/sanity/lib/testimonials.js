import { client } from "./client";
import { urlFor } from "./image";

const TESTIMONIALS_QUERY = /* groq */ `
  *[_type == "testimonial"] | order(coalesce(order, 100) asc, _createdAt desc) {
    "id": _id,
    name,
    text,
    rating,
    avatar
  }
`;

function mapTestimonial(raw) {
  if (!raw) return null;
  let avatarUrl = null;
  if (raw.avatar) {
    try {
      avatarUrl = urlFor(raw.avatar).width(200).height(200).quality(85).auto("format").url();
    } catch {
      avatarUrl = null;
    }
  }
  return {
    id: raw.id,
    name: raw.name || "Anonymous",
    text: raw.text || "",
    rating: Math.max(1, Math.min(5, Number(raw.rating) || 5)),
    avatar: avatarUrl,
  };
}

export async function getAllTestimonials() {
  try {
    const data = await client.fetch(
      TESTIMONIALS_QUERY,
      {},
      { next: { revalidate: 300 } }
    );
    return (data || []).map(mapTestimonial).filter(Boolean);
  } catch (err) {
    console.error("[sanity] getAllTestimonials failed:", err?.message || err);
    return [];
  }
}
