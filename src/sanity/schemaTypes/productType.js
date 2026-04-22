import { defineField, defineType, defineArrayMember } from "sanity";

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
          ],
          preview: {
            select: {
              title: "name",
              hex: "value.hex",
              media: "images.0",
            },
            prepare({ title, hex, media }) {
              return {
                title: title || "Color",
                subtitle: hex || "",
                media,
              };
            },
          },
        }),
      ],
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
      name: "order",
      title: "Display Order",
      type: "number",
      description:
        "Lower numbers appear first (e.g. 1, 2, 3...). Used for the \"Featured\" sort.",
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
      subtitle: "category.title",
      media: "colors.0.images.0",
    },
  },
});
