import LegalPage from "../components/LegalPage";

export const metadata = {
  title: "Terms of Service · ZØYA",
  description: "The rules of the road for using ZØYA.",
};

const sections = [
  {
    title: "Acceptance of Terms",
    content: [
      "By accessing or placing an order on ZØYA, you agree to these Terms of Service. If you don't agree, please don't use the site — it's that simple.",
    ],
  },
  {
    title: "Your Account",
    content: [
      "You're responsible for keeping your login credentials safe. Any activity under your account is your responsibility. Notify us immediately if you suspect unauthorized access.",
      [
        "Provide accurate info when signing up.",
        "One account per person.",
        "Don't share your password with anyone.",
        "Accounts inactive for 24+ months may be archived.",
      ],
    ],
  },
  {
    title: "Orders & Payment",
    content: [
      "All prices are in EGP unless otherwise stated. We reserve the right to refuse or cancel orders at our discretion — usually only for stock issues, pricing errors, or suspected fraud.",
      "Payment is due at checkout. We accept credit/debit cards and cash on delivery (where available). Orders aren't confirmed until payment is verified.",
    ],
  },
  {
    title: "Shipping & Delivery",
    content: [
      "We ship across Egypt within 2–5 business days. International shipping timelines vary by region. Delays caused by shipping partners or customs are outside our control — but we'll always keep you updated.",
    ],
  },
  {
    title: "Returns & Refunds",
    content: [
      "Not vibing with your order? You have 14 days from delivery to request a return.",
      [
        "Items must be unworn, unwashed, and in original packaging.",
        "Sale items and underwear are final sale.",
        "Refunds are processed within 7 business days of receiving the return.",
        "Return shipping costs are covered by the customer unless the item arrived defective.",
      ],
    ],
  },
  {
    title: "Intellectual Property",
    content: [
      "Everything you see — logos, designs, graphics, product photos, and copy — belongs to ZØYA. You're welcome to share our content on social media (we love that!), but commercial use requires explicit permission.",
    ],
  },
  {
    title: "Limitation of Liability",
    content: [
      "ZØYA provides this site and products 'as is'. While we strive for flawless service, we aren't liable for indirect damages, lost profits, or issues outside our reasonable control.",
    ],
  },
  {
    title: "Changes to Terms",
    content: [
      "We may update these terms occasionally. Material changes will be announced via email or a banner on the site. Continued use of ZØYA means you accept the updated terms.",
    ],
  },
  {
    title: "Governing Law",
    content: [
      "These terms are governed by the laws of the Arab Republic of Egypt. Any disputes will be resolved in Egyptian courts.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      tagline="The agreement between you and ZØYA — written to be read, not skipped."
      updatedAt="April 2026"
      sections={sections}
    />
  );
}
