"use client";

const iconProps = (props) => ({
  viewBox: "0 0 24 24",
  fill: "currentColor",
  width: props.size || 24,
  height: props.size || 24,
  ...props,
});

const InstagramIcon = (props) => (
  <svg {...iconProps(props)}>
    <path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.3 1 .4 2.2.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .3-2.2.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.3-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.3 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 5.3a4.5 4.5 0 100 9 4.5 4.5 0 000-9zm0 7.4a2.9 2.9 0 110-5.8 2.9 2.9 0 010 5.8zm4.7-7.6a1.1 1.1 0 11-2.1 0 1.1 1.1 0 012.1 0z" />
  </svg>
);

const FacebookIcon = (props) => (
  <svg {...iconProps(props)}>
    <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.6-1.5H16.5V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.3V21h3.2z" />
  </svg>
);

const WhatsAppIcon = (props) => (
  <svg {...iconProps(props)}>
    <path d="M20.5 3.5A10.5 10.5 0 003.3 16.3L2 22l5.9-1.3A10.5 10.5 0 1020.5 3.5zM12 20a8 8 0 01-4.1-1.1l-.3-.2-3.5.8.8-3.4-.2-.3A8 8 0 1120 12a8 8 0 01-8 8zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8.9-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.3.1-.4.1-.1.2-.3.3-.4.1-.1.1-.2.2-.4.1-.2 0-.3 0-.4 0-.1-.5-1.3-.7-1.7-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2 0 1.2.8 2.3.9 2.5.1.2 1.7 2.6 4.1 3.6.6.3 1 .4 1.4.5.6.2 1.1.2 1.6.1.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1 0-.1-.2-.2-.4-.3z" />
  </svg>
);

const TikTokIcon = (props) => (
  <svg {...iconProps(props)}>
    <path d="M19.6 7.4a5.9 5.9 0 01-3.5-1.1A5.9 5.9 0 0114 3h-3v12.3a2.7 2.7 0 11-2.7-2.7c.3 0 .6 0 .9.1V9.6a6 6 0 00-.9-.1 5.9 5.9 0 105.9 5.9V9.7a8.8 8.8 0 005.4 1.8v-3a5.9 5.9 0 01-.1-1z" />
  </svg>
);

const socials = [
  {
    name: "Instagram",
    icon: InstagramIcon,
    link: "https://www.instagram.com/zoya_eg1/?utm_source=ig_web_button_share_sheet",
    color: "#FF4DA3",
    desc: "Behind the scenes",
  },
  {
    name: "Facebook",
    icon: FacebookIcon,
    link: "https://www.facebook.com/profile.php?id=61589304736971&mibextid=wwXIfr",
    color: "#1877F2",
    desc: "Updates & news",
  },
  {
    name: "WhatsApp",
    icon: WhatsAppIcon,
    link: "https://wa.me/201095894883",
    color: "#25D366",
    desc: "Instant contact",
  },
  {
    name: "TikTok",
    icon: TikTokIcon,
    link: "https://www.tiktok.com/@zoya_eg1?is_from_webapp=1&sender_device=pc",
    color: "#000000",
    desc: "Short form vibes",
  },
];

export default function SocialSection() {
  return (
    <section className="relative overflow-hidden bg-[#fafafa] py-8 transition-colors duration-500 md:py-12 dark:bg-[#050505]">
      <div className="pointer-events-none absolute top-0 left-1/2 h-full w-full -translate-x-1/2">
        <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-[#FF4DA3]/10 blur-[120px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[50%] w-[50%] rounded-full bg-[#FF4DA3]/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="fade-in-view mb-16 text-center md:mb-24">
          <div className="mb-6 inline-block rounded-full border border-[#FF4DA3]/20 bg-[#FF4DA3]/5 px-4 py-1.5 text-[10px] font-bold tracking-[0.3em] text-[#FF4DA3] uppercase">
            ● Stay Connected
          </div>

          <h2 className="mb-6 text-4xl leading-none font-black text-black md:text-6xl dark:text-white">
            The <span className="text-[#FF4DA3]">Zoya </span>Circle
          </h2>

          <p className="mx-auto max-w-lg text-sm text-black/60 md:text-base dark:text-white/50">
            Be the first to see our latest drops and exclusive stories across
            our digital spaces.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:gap-8 lg:grid-cols-4">
          {socials.map((social) => {
            const Icon = social.icon;

            return (
              <a
                key={social.name}
                href={social.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex flex-col items-center rounded-[2rem] border border-black/10 bg-white p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#FF4DA3]/10 md:rounded-[3rem] md:p-8 dark:border-white/10 dark:bg-white/[0.03]"
              >
                <div
                  className="absolute inset-0 rounded-[3rem] opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-10 dark:group-hover:opacity-20"
                  style={{ backgroundColor: social.color }}
                />

                <div
                  className={`relative z-10 mb-6 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-transform duration-500 group-hover:rotate-[10deg] md:h-16 md:w-16 md:rounded-3xl ${social.name === "WhatsApp" ? "pl-0.5" : ""}`}
                  style={{
                    backgroundColor:
                      social.name === "TikTok" ? "#111" : `${social.color}15`,
                    color:
                      social.name === "TikTok" && social.color === "#000000"
                        ? "#fff"
                        : social.color,
                  }}
                >
                  <Icon size={30} />
                </div>

                <div className="relative z-10">
                  <h3 className="text-sm font-black tracking-wider text-black uppercase md:text-lg dark:text-white">
                    {social.name}
                  </h3>
                  <p className="mt-2 hidden text-xs font-medium text-black/50 md:block dark:text-white/40">
                    {social.desc}
                  </p>
                </div>

                <div className="absolute bottom-6 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#FF4DA3]" />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
