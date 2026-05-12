import LegalPage from "../components/LegalPage";

export const metadata = {
  title: "Privacy Policy · ZØYA",
  description: "How ZØYA collects, uses, and protects your personal data.",
};

const sections = [
  {
    title: "Information We Collect",
    content: [
      "At ZØYA, we collect information necessary to process your orders and improve your shopping experience.",
      [
        "Personal details such as your name, phone number, email address, and shipping address.",
        "Order information including purchased products, order history, and delivery details.",
        "Technical information like device type, browser, IP address, and site usage data.",
        "Payment information is processed securely through trusted payment providers. We do not store full card details.",
      ],
    ],
  },
  {
    title: "How We Use Your Data",
    content: [
      "Your information is used only for operating and improving ZØYA services.",
      [
        "Processing and delivering your orders across Egypt.",
        "Sending order confirmations, shipping updates, and customer support responses.",
        "Improving website performance, user experience, and product recommendations.",
        "Preventing fraud, misuse, or unauthorized activity.",
      ],
    ],
  },
  {
    title: "Data Sharing & Third Parties",
    content: [
      "We may share necessary information with trusted third-party services involved in completing your order, including shipping companies, payment gateways, and email service providers.",
      "We never sell or rent your personal information to third parties.",
    ],
  },
  {
    title: "Cookies & Tracking",
    content: [
      "ZØYA uses cookies and similar technologies to improve your browsing experience, remember your preferences, and keep your cart saved between sessions.",
      "You can disable cookies through your browser settings, though some website features may not function properly.",
    ],
  },
  {
    title: "Your Rights",
    content: [
      "You have the right to control your personal information.",
      [
        "Request access to the data we hold about you.",
        "Request correction or deletion of your information.",
        "Opt out of promotional or marketing communications.",
        "Contact us regarding any privacy-related concerns.",
      ],
    ],
  },
  {
    title: "Data Security",
    content: [
      "We use industry-standard security measures to help protect your personal information against unauthorized access, misuse, or disclosure.",
    ],
  },
  {
    title: "Policy Updates",
    content: [
      "This Privacy Policy may be updated occasionally to reflect changes in our services or legal requirements. Continued use of ZØYA after updates means you accept the revised policy.",
    ],
  },
  {
    title: "Contact",
    content: [
      "If you have any questions about this Privacy Policy or how your information is handled, please contact the ZØYA support team.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      tagline="Your privacy matters. Here's how ZØYA handles your information."
      updatedAt="May 2026"
      sections={sections}
    />
  );
}