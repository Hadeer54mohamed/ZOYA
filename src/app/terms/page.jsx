import LegalPage from "../components/LegalPage";

export const metadata = {
  title: "Terms of Service · ZØYA",
  description: "The rules and policies for shopping with ZØYA.",
};

const sections = [
  {
    anchor: "acceptance-of-terms",
    title: "Acceptance of Terms",
    content: [
      "By accessing or placing an order on ZØYA, you agree to these Terms of Service. If you do not agree with any part of these terms, please do not use the website.",
    ],
  },
  {
    anchor: "orders-payment",
    title: "Orders & Payment",
    content: [
      "All prices are listed in EGP unless otherwise stated. We reserve the right to refuse or cancel orders in cases including stock availability issues, pricing mistakes, or suspected fraudulent activity.",
      "Orders are confirmed only after successful payment verification or order confirmation for Cash on Delivery orders.",
      [
        "ZØYA currently sells clothing products including t-shirts and pants.",
        "Product availability may change without notice.",
        "We accept online payment methods and Cash on Delivery where available.",
      ],
    ],
  },
  {
    anchor: "shipping-delivery",
    title: "Shipping & Delivery",
    content: [
      "We currently ship to governorates across Egypt only.",
      "Orders are usually delivered within 2–5 business days depending on the shipping location and courier service.",
      "While we always aim for timely delivery, delays caused by shipping companies or unexpected circumstances may occur.",
    ],
  },
  {
    anchor: "returns-refunds",
    title: "Returns & Refunds",
    content: [
      "You may request a return within 14 days of receiving your order.",
      [
        "Products must be unused, unwashed, and in their original condition.",
        "Items must include original packaging and tags where applicable.",
        "Returns may be rejected if products show signs of use, washing, damage, or alteration.",
        "Refunds are processed after the returned items are inspected and approved.",
      ],
    ],
  },
  {
    title: "Intellectual Property",
    content: [
      "All content on ZØYA — including logos, designs, graphics, product images, and written content — is owned by ZØYA and protected under applicable intellectual property laws.",
    ],
  },
  {
    title: "Limitation of Liability",
    content: [
      "ZØYA is not responsible for indirect damages, delays outside our control, or losses resulting from misuse of the website or products.",
    ],
  },
  {
    title: "Changes to Terms",
    content: [
      "We may update these Terms of Service from time to time. Continued use of the website after updates means you accept the revised terms.",
    ],
  },
  {
    title: "Governing Law",
    content: [
      "These terms are governed by the laws of the Arab Republic of Egypt. Any disputes will be handled through the Egyptian courts.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      tagline="Clear, simple terms for shopping with ZØYA."
      updatedAt="May 2026"
      sections={sections}
    />
  );
}