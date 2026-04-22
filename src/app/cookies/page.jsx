import LegalPage from "../components/LegalPage";

export const metadata = {
  title: "Cookie Policy · ZØYA",
  description: "How and why ZØYA uses cookies.",
};

const sections = [
  {
    title: "What Are Cookies?",
    content: [
      "Cookies are small text files that websites store on your device to remember things about you — like your theme preference or what's in your cart. They make the web feel personal and fast.",
    ],
  },
  {
    title: "Cookies We Use",
    content: [
      "We keep it minimal. Only the cookies that genuinely improve your experience.",
      [
        "Essential: cart state, session, and authentication — the site doesn't work without these.",
        "Preferences: remembers dark/light theme, size, and favorite colors.",
        "Analytics: anonymized page views and clicks (helps us understand what's working).",
        "Marketing: optional, for retargeting ads on social platforms — you can opt out anytime.",
      ],
    ],
  },
  {
    title: "Third-Party Cookies",
    content: [
      "Some cookies are set by our trusted partners — payment processors, analytics tools, and social embeds. They follow their own privacy policies, which we vet carefully before integration.",
    ],
  },
  {
    title: "Managing Cookies",
    content: [
      "You're always in control. Here's how:",
      [
        "Browser settings: block or delete cookies globally (Chrome, Safari, Firefox all support this).",
        "Private / incognito mode: cookies are auto-cleared when you close the window.",
        "Device settings: opt out of ad tracking on iOS and Android.",
      ],
      "Heads up: disabling essential cookies means your cart and login won't persist between visits.",
    ],
  },
  {
    title: "Do Not Track",
    content: [
      "We respect 'Do Not Track' browser signals. When enabled, we disable non-essential analytics and marketing cookies automatically.",
    ],
  },
  {
    title: "Updates to This Policy",
    content: [
      "As our site evolves, our cookie usage may too. We'll update this page whenever we add or remove cookies, and highlight significant changes at the top.",
    ],
  },
  {
    title: "Questions?",
    content: [
      "If anything here is unclear, drop us a line at hello@zoya.com. We'd rather over-explain than leave you guessing.",
    ],
  },
];

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      tagline="Real talk about the cookies we use — and how to take full control of them."
      updatedAt="April 2026"
      sections={sections}
    />
  );
}
