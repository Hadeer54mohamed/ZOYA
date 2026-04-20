export const products = [
  {
    id: "essential-wide-pants",
    name: "Essential Wide Pants",
    category: "Sweatpants",
    price: 700,
    description:
      "Oversized fit with a relaxed silhouette. Crafted from premium heavyweight cotton for all-day comfort and effortless presence.",
    badge: "NEW",
    colors: [
      { name: "Black", value: "#0a0a0a", images: ["/images/photo (1).jpeg"] },
      { name: "Navy", value: "#1e3a5f", images: ["/images/photo (2).jpeg"] },
      {
        name: "Heather Grey",
        value: "#b8b8b8",
        images: ["/images/photo (3).jpeg"],
      },
    ],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "porsche-911-tee",
    name: "Porsche 911 Graphic Tee",
    category: "T-Shirts",
    price: 550,
    description:
      "Oversized streetwear tee featuring a premium Porsche 911 graphic print. Heavyweight cotton with a relaxed fit and soft hand-feel.",
    badge: "HOT",
    colors: [
      {
        name: "Ivory Black",
        value: "#f5f0e6",
        images: ["/images/photo (4).jpeg"],
      },
      {
        name: "Ivory Red",
        value: "#faf0ed",
        images: ["/images/photo (5).jpeg"],
      },
      {
        name: "Charcoal",
        value: "#3a3a3a",
        images: ["/images/photo (6).jpeg"],
      },
    ],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "lady-driver-tee",
    name: "Lady Driver Tee",
    category: "T-Shirts",
    price: 500,
    description:
      "Statement black tee with a pastel Lady Driver print. Oversized fit, soft-washed cotton, made for everyday style.",
    badge: "NEW",
    colors: [
      { name: "Black", value: "#0a0a0a", images: ["/images/photo (7).jpeg"] },
    ],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "rose-bouquet-tee",
    name: "Rose Bouquet Tee",
    category: "T-Shirts",
    price: 650,
    description:
      "Hand-embroidered rose bouquet on soft heavyweight cotton. A romantic statement piece that feels as good as it looks.",
    badge: "LIMITED",
    colors: [
      { name: "Black", value: "#0a0a0a", images: ["/images/photo (8).jpeg"] },
    ],
    sizes: ["S", "M", "L"],
  },
  {
    id: "relaxed-cargo-pants",
    name: "Relaxed Cargo Pants",
    category: "Sweatpants",
    price: 780,
    description:
      "Utility-inspired wide-leg cargos with deep pockets and a soft drape. Heavyweight, pre-washed for lived-in comfort.",
    badge: "NEW",
    colors: [
      { name: "Navy", value: "#1e3a5f", images: ["/images/photo (2).jpeg"] },
      { name: "Black", value: "#0a0a0a", images: ["/images/photo (1).jpeg"] },
    ],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "classic-crew-tee",
    name: "Classic Crew Tee",
    category: "T-Shirts",
    price: 420,
    description:
      "The everyday essential. Relaxed boxy cut, soft cotton jersey, effortless drape.",
    badge: null,
    colors: [
      {
        name: "Charcoal",
        value: "#3a3a3a",
        images: ["/images/photo (6).jpeg"],
      },
      { name: "Ivory", value: "#f5f0e6", images: ["/images/photo (4).jpeg"] },
    ],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "studio-grey-pants",
    name: "Studio Grey Pants",
    category: "Sweatpants",
    price: 680,
    description:
      "A cleaner cut of our Essential wide pants in heather grey. Perfect for layering, all-season ready.",
    badge: null,
    colors: [
      {
        name: "Heather Grey",
        value: "#b8b8b8",
        images: ["/images/photo (3).jpeg"],
      },
      { name: "Black", value: "#0a0a0a", images: ["/images/photo (1).jpeg"] },
    ],
    sizes: ["S", "M", "L"],
  },
  {
    id: "graphic-print-tee",
    name: "Racing Graphic Tee",
    category: "T-Shirts",
    price: 530,
    description:
      "Bold automotive-inspired graphic print on a soft-hand, heavyweight tee. Relaxed and effortless.",
    badge: "HOT",
    colors: [
      {
        name: "Ivory Red",
        value: "#faf0ed",
        images: ["/images/photo (5).jpeg"],
      },
      {
        name: "Ivory Black",
        value: "#f5f0e6",
        images: ["/images/photo (4).jpeg"],
      },
    ],
    sizes: ["S", "M", "L", "XL"],
  },
];

export const categories = ["All", "Sweatpants", "T-Shirts"];

export const getProductById = (id) =>
  products.find((p) => String(p.id) === String(id));

export const getRelatedProducts = (id, limit = 4) => {
  const current = getProductById(id);
  if (!current) return [];
  const sameCategory = products.filter(
    (p) => p.category === current.category && p.id !== current.id
  );
  const others = products.filter(
    (p) => p.category !== current.category && p.id !== current.id
  );
  return [...sameCategory, ...others].slice(0, limit);
};

export const getPrimaryImage = (product) => product?.colors?.[0]?.images?.[0];
