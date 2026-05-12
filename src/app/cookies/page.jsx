import LegalPage from "../components/LegalPage";

export const metadata = {
  title: "Cookie Policy · ZØYA",
  description: "How and why ZØYA uses cookies.",
};

const sections = [
  {
    title: "What Are Cookies?",
    content: [
      "Cookies are small text files stored on your device when you visit a website. They help websites remember certain information and improve your browsing experience.",
    ],
  },
  {
    title: "How ZØYA Uses Cookies",
    content: [
      "ZØYA uses cookies to provide a smoother shopping experience and improve website functionality.",
      [
        "Keeping products saved in your cart during your session.",
        "Remembering preferences such as theme or language settings.",
        "Helping improve website performance and user experience through analytics.",
        "Supporting login sessions and basic website security features.",
      ],
    ],
  },
  {
    title: "Analytics & Performance",
    content: [
      "We may use analytics tools to understand how visitors interact with the website, including pages viewed and general browsing behavior.",
      "This information helps us improve the ZØYA shopping experience and optimize website performance.",
    ],
  },
  {
    title: "Third-Party Services",
    content: [
      "Some cookies may be set by trusted third-party services integrated into ZØYA, such as payment providers, analytics services, or social media tools.",
      "These services may use their own cookies according to their respective privacy policies.",
    ],
  },
  {
    title: "Managing Cookies",
    content: [
      "You can control or disable cookies through your browser settings at any time.",
      [
        "Delete stored cookies from your browser.",
        "Block websites from storing cookies.",
        "Use private or incognito browsing modes.",
      ],
      "Please note that disabling essential cookies may affect some website features, including cart functionality and login sessions.",
    ],
  },
  {
    title: "Policy Updates",
    content: [
      "This Cookie Policy may be updated occasionally to reflect changes in website functionality or legal requirements. Continued use of ZØYA means you accept the updated policy.",
    ],
  },
  {
    title: "Contact",
    content: [
      "If you have any questions regarding this Cookie Policy, please contact the ZØYA support team.",
    ],
  },
];

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      tagline="Simple information about how ZØYA uses cookies and similar technologies."
      updatedAt="May 2026"
      sections={sections}
    />
  );
}