"use client";

import { motion } from "framer-motion";

const iconProps = (props) => ({
  viewBox: "0 0 24 24",
  fill: "currentColor",
  width: props.size || 24,
  height: props.size || 24,
  ...props,
});

const InstagramIcon = (props) => (
  <svg {...iconProps(props)}><path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.3 1 .4 2.2.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .3-2.2.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.3-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.3 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 5.3a4.5 4.5 0 100 9 4.5 4.5 0 000-9zm0 7.4a2.9 2.9 0 110-5.8 2.9 2.9 0 010 5.8zm4.7-7.6a1.1 1.1 0 11-2.1 0 1.1 1.1 0 012.1 0z" /></svg>
);

const FacebookIcon = (props) => (
  <svg {...iconProps(props)}><path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.6-1.5H16.5V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.3V21h3.2z" /></svg>
);

const WhatsAppIcon = (props) => (
  <svg {...iconProps(props)}><path d="M20.5 3.5A10.5 10.5 0 003.3 16.3L2 22l5.9-1.3A10.5 10.5 0 1020.5 3.5zM12 20a8 8 0 01-4.1-1.1l-.3-.2-3.5.8.8-3.4-.2-.3A8 8 0 1120 12a8 8 0 01-8 8zm4.4-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8.9-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.3.1-.4.1-.1.2-.3.3-.4.1-.1.1-.2.2-.4.1-.2 0-.3 0-.4 0-.1-.5-1.3-.7-1.7-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2 0 1.2.8 2.3.9 2.5.1.2 1.7 2.6 4.1 3.6.6.3 1 .4 1.4.5.6.2 1.1.2 1.6.1.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1 0-.1-.2-.2-.4-.3z" /></svg>
);

const TikTokIcon = (props) => (
  <svg {...iconProps(props)}><path d="M19.6 7.4a5.9 5.9 0 01-3.5-1.1A5.9 5.9 0 0114 3h-3v12.3a2.7 2.7 0 11-2.7-2.7c.3 0 .6 0 .9.1V9.6a6 6 0 00-.9-.1 5.9 5.9 0 105.9 5.9V9.7a8.8 8.8 0 005.4 1.8v-3a5.9 5.9 0 01-.1-1z" /></svg>
);

const socials = [
  { name: "Instagram", icon: InstagramIcon, link: "#", color: "#FF4DA3", desc: "Behind the scenes" },
  { name: "Facebook", icon: FacebookIcon, link: "#", color: "#1877F2", desc: "Updates & news" },
  { name: "WhatsApp", icon: WhatsAppIcon, link: "#", color: "#25D366", desc: "Instant contact" },
  { name: "TikTok", icon: TikTokIcon, link: "#", color: "#000000", desc: "Short form vibes" },
];

export default function SocialSection() {
  return (
    <section className="relative py-10 md:py-32 overflow-hidden bg-slate-50 dark:bg-[#080808] transition-colors duration-500">
      
      {/* Dynamic Background Blurs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FF4DA3]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        
        {/* Header Section */}
        <div className="text-center mb-16 md:mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-block px-4 py-1.5 rounded-full border border-[#FF4DA3]/20 bg-[#FF4DA3]/5 text-[#FF4DA3] text-[10px] tracking-[0.3em] font-bold uppercase mb-6"
          >
            ● Stay Connected
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 leading-none"
          >
            The Zoya <span className="text-[#FF4DA3]">Circle</span>
          </motion.h2>
          
          <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto text-sm md:text-base">
            Be the first to see our latest drops and exclusive stories across our digital spaces.
          </p>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {socials.map((social, i) => {
            const Icon = social.icon;

            return (
              <motion.a
                key={social.name}
                href={social.link}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10 }}
                className="group relative flex flex-col items-center text-center p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 transition-all duration-300 hover:shadow-2xl hover:shadow-[#FF4DA3]/10"
              >
                {/* Hover Glow Effect */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity duration-500 blur-xl rounded-[3rem]"
                  style={{ backgroundColor: social.color }}
                />

                {/* Icon Wrapper */}
                <div 
  className={`relative z-10 w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:rotate-[10deg] shadow-sm ${social.name === "WhatsApp" ? "pl-0.5" : ""}`} 
  style={{ 
    backgroundColor: social.name === "TikTok" ? "#111" : `${social.color}15`,
    color: social.name === "TikTok" && social.color === "#000000" ? "#fff" : social.color
  }}
>
  <Icon size={30} /> 
</div>

                {/* Text Content */}
                <div className="relative z-10">
                  <h3 className="text-slate-900 dark:text-white font-black text-sm md:text-lg uppercase tracking-wider">
                    {social.name}
                  </h3>
                  <p className="hidden md:block text-slate-400 dark:text-slate-500 text-xs mt-2 font-medium">
                    {social.desc}
                  </p>
                </div>

                {/* Subtle Indicator */}
                <div className="absolute bottom-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                   <div className="w-1.5 h-1.5 rounded-full bg-[#FF4DA3]" />
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}