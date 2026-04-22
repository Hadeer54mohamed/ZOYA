import LegalPage from "../components/LegalPage";

export const metadata = {
  title: "Privacy Policy · ZØYA",
  description: "How ZØYA collects, uses, and protects your personal data.",
};

const sections = [
  {
    title: "Information We Collect",
    content: [
      "At ZØYA, we collect information that helps us deliver the best experience possible. This includes data you provide directly and data collected automatically when you browse our store.",
      [
        "Personal details: name, email, phone number, shipping address.",
        "Payment information (processed securely through our payment partners — we never store card numbers).",
        "Order history, cart contents, and saved preferences.",
        "Device information, IP address, browser type, and interaction data.",
      ],
    ],
  },
  {
    title: "How We Use Your Data",
    content: [
      "Your information is used strictly to power your shopping experience and improve our service. We never sell your data to third parties.",
      [
        "Processing and delivering your orders.",
        "Sending order updates, shipping confirmations, and receipts.",
        "Personalizing product recommendations and drops you'll love.",
        "Analytics to improve site performance and UX.",
      ],
    ],
  },
  {
    title: "Data Sharing & Third Parties",
    content: [
      "We only share your information with trusted partners required to fulfill your order — shipping providers, payment processors, and email services. Each partner is bound by strict confidentiality agreements.",
    ],
  },
  {
    title: "Cookies & Tracking",
    content: [
      "We use cookies to remember your theme preference, keep your cart alive between sessions, and understand how you interact with our site. You can disable cookies in your browser, but some features may break.",
    ],
  },
  {
    title: "Your Rights",
    content: [
      "You own your data. At any time, you have the right to:",
      [
        "Access the personal data we hold about you.",
        "Request corrections or deletion of your account.",
        "Opt out of marketing emails (one click, no hassle).",
        "Export your data in a portable format.",
      ],
    ],
  },
  {
    title: "Security",
    content: [
      "All sensitive data is encrypted in transit (HTTPS/TLS) and at rest. We use industry-standard practices to guard against unauthorized access. If a breach ever occurs, we'll notify you within 72 hours.",
    ],
  },
  {
    title: "Contact",
    content: [
      "Questions about this policy? Reach out anytime at hello@zoya.com — we read every message.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      tagline="Your data is yours. Here's exactly how we handle it — in plain language, no fine print tricks."
      updatedAt="April 2026"
      sections={sections}
    />
  );
}
