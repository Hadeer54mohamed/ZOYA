import { defineField, defineType, defineArrayMember } from "sanity";

import { HomeSliderColorsInput } from "../components/HomeSliderColorsInput";

export const productType = defineType({
  name: "product",
  title: "Product",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug (used in URL)",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "category" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "price",
      title: "Price (EGP)",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "originalPrice",
      title: "Original Price (EGP)",
      type: "number",
      description:
        "Optional. If set and higher than Price, it will be shown as a strikethrough price and a discount badge will appear.",
      validation: (Rule) =>
        Rule.min(0).custom((value, context) => {
          const price = context?.document?.price;
          if (value == null || value === 0) return true;
          if (typeof price === "number" && value < price) {
            return "Original price must be greater than or equal to Price.";
          }
          return true;
        }),
    }),
    defineField({
      name: "cost",
      title: "Cost (EGP) — Internal",
      type: "number",
      description:
        "Internal: how much YOU pay for this product. Used to calculate profit. Never shown to customers.",
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "badge",
      title: "Badge",
      type: "string",
      description: "Optional label shown on the product card.",
      options: {
        list: [
          { title: "None", value: "" },
          { title: "NEW", value: "NEW" },
          { title: "HOT", value: "HOT" },
          { title: "LIMITED", value: "LIMITED" },
          { title: "SALE", value: "SALE" },
        ],
      },
    }),
    defineField({
      name: "colors",
      title: "Colors",
      type: "array",
      validation: (Rule) => Rule.required().min(1),
      of: [
        defineArrayMember({
          type: "object",
          name: "color",
          title: "Color Variant",
          fields: [
            defineField({
              name: "name",
              title: "Color Name",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "value",
              title: "Color",
              type: "color",
              options: { disableAlpha: true },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "images",
              title: "Images",
              type: "array",
              of: [
                defineArrayMember({
                  type: "image",
                  options: { hotspot: true },
                }),
              ],
              validation: (Rule) => Rule.required().min(1),
            }),
            defineField({
              name: "stockEntries",
              title: "📦 Stock by Size",
              description:
                "Add a row for each size you sell in this color and how many units you have. Customers can always order — even when stock hits zero — but the admin dashboard will alert you in real time so you know what to restock. Leave this empty to skip stock tracking for this color.",
              type: "array",
              of: [
                defineArrayMember({
                  type: "object",
                  name: "stockEntry",
                  title: "Stock Entry",
                  fields: [
                    defineField({
                      name: "size",
                      title: "Size",
                      type: "string",
                      options: {
                        list: [
                          { title: "XS", value: "XS" },
                          { title: "S", value: "S" },
                          { title: "M", value: "M" },
                          { title: "L", value: "L" },
                          { title: "XL", value: "XL" },
                          { title: "XXL", value: "XXL" },
                        ],
                      },
                      validation: (Rule) => Rule.required(),
                    }),
                    defineField({
                      name: "stock",
                      title: "Stock (units left)",
                      type: "number",
                      description:
                        "Current available units. Auto-decrements on each sale. Negative values mean you've oversold — refill stock and bump this back up.",
                      initialValue: 0,
                      // Allow negative numbers so oversold variants can be
                      // edited back up to a positive value after a restock.
                      validation: (Rule) => Rule.required().integer(),
                    }),
                    defineField({
                      name: "initialStock",
                      title: "Initial Stock",
                      description:
                        "Optional. The starting quantity when you first added this size. Used by the admin dashboard to show 'X sold of N' totals.",
                      type: "number",
                      validation: (Rule) => Rule.min(0).integer(),
                    }),
                  ],
                  preview: {
                    select: {
                      size: "size",
                      stock: "stock",
                      initial: "initialStock",
                    },
                    prepare({ size, stock, initial }) {
                      const left = typeof stock === "number" ? stock : "—";
                      const total =
                        typeof initial === "number" ? ` / ${initial}` : "";
                      let status = "";
                      if (typeof stock === "number") {
                        if (stock < 0) status = "  ⚠️ OVERSOLD";
                        else if (stock === 0) status = "  ⛔ OUT";
                        else if (stock <= 3) status = "  🟡 LOW";
                      }
                      return {
                        title: `Size ${size || "?"}`,
                        subtitle: `Stock: ${left}${total}${status}`,
                      };
                    },
                  },
                }),
              ],
            }),
          ],
          preview: {
            select: {
              title: "name",
              hex: "value.hex",
              media: "images.0",
              entries: "stockEntries",
            },
            prepare({ title, hex, media, entries }) {
              let subtitle = hex || "";
              if (Array.isArray(entries) && entries.length > 0) {
                const total = entries.reduce(
                  (sum, e) => sum + (Number(e?.stock) || 0),
                  0,
                );
                const oversold = entries.some(
                  (e) => (Number(e?.stock) || 0) < 0,
                );
                const out = entries.some((e) => (Number(e?.stock) || 0) === 0);
                let badge = "";
                if (oversold) badge = "  ⚠️ oversold";
                else if (out) badge = "  ⛔ out";
                else if (total <= 5) badge = "  🟡 low";
                subtitle = `${entries.length} sizes · ${total} units${badge}`;
              } else {
                subtitle = `${subtitle ? subtitle + " · " : ""}untracked`;
              }
              return {
                title: title || "Color",
                subtitle,
                media,
              };
            },
          },
        }),
      ],
    }),
    defineField({
      name: "homeSliderColor",
      title: "Home Slider colors (Limited section)",
      type: "array",
      description:
        "Pick one or more color variants — each gets its own card in the Limited home slider. Leave empty to use the first color’s image only.",
      of: [defineArrayMember({ type: "string" })],
      options: {
        list: [],
      },
      components: {
        input: HomeSliderColorsInput,
      },
    }),
    defineField({
      name: "sizes",
      title: "Sizes",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "XS", value: "XS" },
          { title: "S", value: "S" },
          { title: "M", value: "M" },
          { title: "L", value: "L" },
          { title: "XL", value: "XL" },
          { title: "XXL", value: "XXL" },
        ],
      },
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "sizeGuide",
      title: "Size guide",
      type: "array",
      description:
        "Add a description for each size so the product page can show the correct fit details.",
      of: [
        defineArrayMember({
          type: "object",
          name: "sizeGuideEntry",
          title: "Size Guide Entry",
          fields: [
            defineField({
              name: "size",
              title: "Size",
              type: "string",
              options: {
                list: [
                  { title: "XS", value: "XS" },
                  { title: "S", value: "S" },
                  { title: "M", value: "M" },
                  { title: "L", value: "L" },
                  { title: "XL", value: "XL" },
                  { title: "XXL", value: "XXL" },
                ],
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "description",
              title: "Description",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: "order",
      title: "Display Order",
      type: "number",
      description:
        'Lower numbers appear first (e.g. 1, 2, 3...). Used for the "Featured" sort.',
      initialValue: 100,
    }),
  ],
  orderings: [
    {
      title: "Display Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "name",
      categoryTitle: "category.title",
      media: "colors.0.images.0",
      colors: "colors",
    },
    prepare({ title, categoryTitle, media, colors }) {
      // Roll up stock across every (color, size) so the product list view in
      // Sanity Studio shows total inventory and a status badge at a glance.
      let subtitle = categoryTitle || "";
      if (Array.isArray(colors) && colors.length > 0) {
        let total = 0;
        let trackedCount = 0;
        let oversold = false;
        let anyOut = false;
        for (const c of colors) {
          const entries = Array.isArray(c?.stockEntries) ? c.stockEntries : [];
          if (entries.length === 0) continue;
          trackedCount++;
          for (const e of entries) {
            const s = Number(e?.stock) || 0;
            total += s;
            if (s < 0) oversold = true;
            else if (s === 0) anyOut = true;
          }
        }
        if (trackedCount > 0) {
          let badge = "";
          if (oversold) badge = "  ⚠️ OVERSOLD";
          else if (anyOut) badge = "  ⛔ Some sizes out";
          else if (total <= 5) badge = "  🟡 LOW";
          subtitle = `${categoryTitle || ""}${categoryTitle ? " · " : ""}${total} units${badge}`;
        }
      }
      return { title, subtitle, media };
    },
  },
});
