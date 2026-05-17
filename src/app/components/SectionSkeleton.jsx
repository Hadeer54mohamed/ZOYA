export default function SectionSkeleton({ className = "h-64 md:h-80" }) {
  return (
    <section className="py-16 md:py-24 bg-white dark:bg-black" aria-hidden>
      <div
        className={`${className} animate-pulse bg-black/5 dark:bg-white/5 rounded-2xl mx-6 max-w-6xl mx-auto`}
      />
    </section>
  );
}
