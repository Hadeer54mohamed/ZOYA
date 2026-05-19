"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Play, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
const InstagramIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

function getEmbedUrl(link) {
  if (!link) return null;
  const match = link.match(/\/(?:reel|reels)\/([A-Za-z0-9_-]+)/);
  return match
    ? `https://www.instagram.com/reel/${match[1]}/embed/?autoplay=1`
    : null;
}

function openReelFromTap(swiper, reels, openReel) {
  if (!swiper.allowClick) return;
  const slide = swiper.clickedSlide;
  if (!slide) return;
  const idx = slide.getAttribute("data-swiper-slide-index");
  if (idx == null) return;
  const reel = reels[Number(idx)];
  if (reel) openReel(reel);
}

function ReelPreview({ reel }) {
  if (reel.thumbnail) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={reel.thumbnail}
        alt={reel.title || "Reel"}
        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    );
  }

  if (reel.videoUrl) {
    return (
      <video
        src={reel.videoUrl}
        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
        muted
        playsInline
        preload="metadata"
      />
    );
  }

  const embed = getEmbedUrl(reel.link);
  if (embed) {
    return (
      <iframe
        src={embed}
        className="absolute inset-0 h-full w-full pointer-events-none"
        loading="lazy"
        title={reel.title || "Reel"}
      />
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center text-white/50 text-xs">
      No preview
    </div>
  );
}

function ReelsSwiperCarousel({
  bundle,
  reels,
  enableLoop,
  inView,
  slidesPerViewCap,
  openReel,
}) {
  const { Swiper, SwiperSlide } = bundle;

  return (
    <div className="reels-swiper-wrap relative px-2">
      <Swiper
        modules={bundle.modules}
        effect="coverflow"
        centeredSlides
        loop={enableLoop}
        grabCursor
        watchSlidesProgress
        simulateTouch
        allowTouchMove
        touchRatio={1}
        threshold={10}
        longSwipesMs={280}
        slidesPerView={Math.min(slidesPerViewCap, 1.3)}
        spaceBetween={12}
        speed={450}
        touchStartPreventDefault={false}
        preventClicks={false}
        preventClicksPropagation={false}
        onTap={(swiper) => openReelFromTap(swiper, reels, openReel)}
        onClick={(swiper) => openReelFromTap(swiper, reels, openReel)}
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 60,
          modifier: 1,
          slideShadows: false,
        }}
        breakpoints={{
          480: {
            slidesPerView: Math.min(slidesPerViewCap, 1.6),
            spaceBetween: 14,
            coverflowEffect: {
              rotate: 0,
              stretch: 0,
              depth: 70,
              modifier: 1,
              slideShadows: false,
            },
          },
          640: {
            slidesPerView: Math.min(slidesPerViewCap, 2.2),
            spaceBetween: 18,
            coverflowEffect: {
              rotate: 0,
              stretch: 0,
              depth: 90,
              modifier: 1.2,
              slideShadows: false,
            },
          },
          768: {
            slidesPerView: Math.min(slidesPerViewCap, 3),
            spaceBetween: 20,
            coverflowEffect: {
              rotate: 0,
              stretch: 0,
              depth: 100,
              modifier: 1.3,
              slideShadows: false,
            },
          },
          1024: {
            slidesPerView: Math.min(slidesPerViewCap, 3.5),
            spaceBetween: 24,
            coverflowEffect: {
              rotate: 0,
              stretch: 0,
              depth: 120,
              modifier: 1.4,
              slideShadows: false,
            },
          },
          1280: {
            slidesPerView: slidesPerViewCap,
            spaceBetween: 24,
            coverflowEffect: {
              rotate: 0,
              stretch: 0,
              depth: 130,
              modifier: 1.5,
              slideShadows: false,
            },
          },
        }}
        autoplay={
          enableLoop && inView
            ? {
                delay: 4500,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }
            : false
        }
        navigation={{ prevEl: ".ig-prev", nextEl: ".ig-next" }}
        pagination={{
          el: ".reels-pagination",
          clickable: true,
          dynamicBullets: true,
          dynamicMainBullets: 4,
        }}
        className="!px-4 !py-6 sm:!px-6 sm:!py-8"
      >
        {reels.map((reel) => (
          <SwiperSlide key={reel.id} className="!h-auto">
            <ReelSlideCard reel={reel} onOpen={openReel} />
          </SwiperSlide>
        ))}
      </Swiper>

      <button
        type="button"
        className="ig-prev absolute top-1/2 left-2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/80 text-black shadow-lg backdrop-blur-md transition hover:border-[#FF4DA3] hover:bg-[#FF4DA3] hover:text-white md:flex lg:left-6 dark:border-white/10 dark:bg-black/60 dark:text-white"
        aria-label="Previous"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        type="button"
        className="ig-next absolute top-1/2 right-2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/80 text-black shadow-lg backdrop-blur-md transition hover:border-[#FF4DA3] hover:bg-[#FF4DA3] hover:text-white md:flex lg:right-6 dark:border-white/10 dark:bg-black/60 dark:text-white"
        aria-label="Next"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="reels-pagination !relative !bottom-0 !mt-4 flex justify-center md:hidden" />
    </div>
  );
}

function ReelSlideCard({ reel, onOpen }) {
  return (
    <div className="group relative h-full w-full">
      <div className="reel-card relative aspect-[9/16] overflow-hidden rounded-[1.5rem] border border-black/10 bg-black transition-all duration-500 sm:rounded-[1.75rem] dark:border-white/10">
        <ReelPreview reel={reel} />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 backdrop-blur-md">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF4DA3]" />
          <span className="text-[8px] font-bold tracking-[0.2em] text-white uppercase">
            Reel
          </span>
        </div>

        {reel.title && (
          <div className="reel-slide-title pointer-events-none absolute right-4 bottom-4 left-4">
            <p className="line-clamp-2 text-xs font-semibold text-white drop-shadow-lg sm:text-sm">
              {reel.title}
            </p>
          </div>
        )}

        {/* Play button only — rest of card stays draggable for Swiper */}
        <button
          type="button"
          className="swiper-no-swiping absolute top-1/2 left-1/2 z-30 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 md:h-16 md:w-16"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(reel);
          }}
          aria-label={reel.title ? `Play ${reel.title}` : "Play reel"}
        >
          <span className="reel-play-icon flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-white/15 backdrop-blur-md transition-transform duration-300 md:h-14 md:w-14">
            <Play className="ml-0.5 h-4 w-4 fill-white text-white md:h-5 md:w-5" />
          </span>
        </button>
      </div>
    </div>
  );
}

export default function ReelsGallery({ reels = [] }) {
  const [selectedReel, setSelectedReel] = useState(null);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [inView, setInView] = useState(false);
  const [swiperBundle, setSwiperBundle] = useState(null);
  const videoRef = useRef(null);
  const sectionRef = useRef(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.12, rootMargin: "80px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || swiperBundle) return;
    let cancelled = false;
    (async () => {
      await Promise.all([
        import("swiper/css"),
        import("swiper/css/navigation"),
        import("swiper/css/pagination"),
        import("swiper/css/effect-coverflow"),
      ]);
      const [reactMod, modulesMod] = await Promise.all([
        import("swiper/react"),
        import("swiper/modules"),
      ]);
      if (cancelled) return;
      setSwiperBundle({
        Swiper: reactMod.Swiper,
        SwiperSlide: reactMod.SwiperSlide,
        modules: [
          modulesMod.Navigation,
          modulesMod.Pagination,
          modulesMod.Autoplay,
          modulesMod.EffectCoverflow,
        ],
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [inView, swiperBundle]);

  const hasReels = Array.isArray(reels) && reels.length > 0;
  const enableLoop = reels.length > 1;
  const slidesPerViewCap = Math.min(reels.length || 1, 4);

  const closeModal = useCallback(() => {
    setIsModalClosing(true);
    setTimeout(() => {
      setSelectedReel(null);
      setIsModalClosing(false);
    }, 250);
  }, []);

  const openReel = useCallback((reel) => {
    if (!reel) return;
    setIsModalClosing(false);
    setSelectedReel(reel);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeModal();
    };

    if (selectedReel) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedReel, closeModal]);

  useEffect(() => {
    if (!selectedReel?.videoUrl || isModalClosing) return;

    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    const playPromise = video.play();
    if (playPromise?.catch) {
      playPromise.catch(() => {});
    }

    return () => {
      video.pause();
    };
  }, [selectedReel, isModalClosing]);

  const modalEmbed = selectedReel ? getEmbedUrl(selectedReel.link) : null;

  const modal =
    selectedReel && mounted
      ? createPortal(
          <div
            className={`fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md transition-opacity duration-300 sm:p-6 ${
              isModalClosing ? "opacity-0" : "opacity-100"
            }`}
            onClick={closeModal}
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md transition hover:scale-110 hover:border-[#FF4DA3] hover:bg-[#FF4DA3]/80 sm:top-6 sm:right-6"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div
              className="relative aspect-[9/16] w-full max-w-[380px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-black shadow-[0_30px_80px_-20px_rgba(255,77,163,0.4)] sm:rounded-[2rem]"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedReel.videoUrl ? (
                <video
                  key={selectedReel.id}
                  ref={videoRef}
                  src={selectedReel.videoUrl}
                  poster={selectedReel.thumbnail || undefined}
                  className="absolute inset-0 h-full w-full object-cover"
                  controls
                  autoPlay
                  playsInline
                  preload="auto"
                />
              ) : modalEmbed ? (
                <iframe
                  key={modalEmbed}
                  src={modalEmbed}
                  className="absolute inset-0 h-full w-full"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  allowFullScreen
                  title="Instagram Reel"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-xs text-white/60">
                  <p>No video file uploaded for this reel.</p>
                  {selectedReel.link && (
                    <a
                      href={selectedReel.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-[#FF4DA3] px-4 py-2 text-[10px] font-bold tracking-widest text-white uppercase"
                    >
                      Watch on Instagram
                    </a>
                  )}
                </div>
              )}
            </div>

            {selectedReel.link && (
              <a
                href={selectedReel.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-[10px] font-bold tracking-[0.2em] text-white uppercase backdrop-blur-md transition hover:border-[#FF4DA3] hover:bg-[#FF4DA3] sm:bottom-10 sm:text-xs"
              >
                <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                View on Instagram
              </a>
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-white py-8 transition-colors duration-500 md:py-12 dark:bg-black"
    >
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF4DA3]/[0.04] blur-[120px] dark:bg-[#FF4DA3]/[0.06]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-10 px-6 text-center sm:mb-14">
          <div className="mb-4 inline-flex items-center gap-3">
            <span className="h-px w-8 bg-[#FF4DA3]/50" />
            <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.4em] text-[#FF4DA3] uppercase">
              <InstagramIcon className="h-3 w-3" />
              @ZOYA.STUDIO
            </p>
            <span className="h-px w-8 bg-[#FF4DA3]/50" />
          </div>

          <h2 className="text-4xl font-black tracking-tighter text-black sm:text-5xl md:text-6xl lg:text-7xl dark:text-white">
            Style in{" "}
            <span className="bg-gradient-to-r from-[#FF4DA3] via-[#ff7eb6] to-[#FF4DA3] bg-clip-text italic text-transparent">
              Motion
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-md text-xs text-black/50 sm:text-sm dark:text-white/40">
            Behind the scenes, drops & street looks — straight from our feed.
          </p>
        </div>

        {!hasReels ? (
          <div className="px-6 py-20 text-center text-black/50 dark:text-white/50">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
              <Play className="h-6 w-6 opacity-40" />
            </div>
            <p className="text-sm">No reels available yet</p>
          </div>
        ) : !swiperBundle ? (
          <div className="reels-swiper-wrap relative flex min-h-[380px] items-center justify-center px-4 py-8">
            {reels[0] ? (
              <div className="w-full max-w-[280px] opacity-90">
                <ReelSlideCard reel={reels[0]} onOpen={openReel} />
              </div>
            ) : null}
          </div>
        ) : (
          <ReelsSwiperCarousel
            bundle={swiperBundle}
            reels={reels}
            enableLoop={enableLoop}
            inView={inView}
            slidesPerViewCap={slidesPerViewCap}
            openReel={openReel}
          />
        )}
      </div>

      {modal}

      <style jsx global>{`
        .reels-swiper-wrap .swiper {
          overflow: visible;
        }
        .reels-swiper-wrap .swiper-slide {
          pointer-events: auto !important;
          height: auto;
        }
        .reels-swiper-wrap .swiper {
          touch-action: pan-y pinch-zoom;
        }
        .reels-swiper-wrap .swiper-slide-active .reel-card {
          border-color: rgba(255, 77, 163, 0.4);
          box-shadow: 0 20px 50px -15px rgba(255, 77, 163, 0.45);
          opacity: 1;
          transform: scale(1);
        }
        .reels-swiper-wrap .swiper-slide:not(.swiper-slide-active) .reel-card {
          opacity: 0.5;
          transform: scale(0.94);
        }
        .reels-swiper-wrap
          .swiper-slide:not(.swiper-slide-active)
          .reel-slide-title {
          opacity: 0;
        }
        .reels-swiper-wrap .swiper-slide-active .reel-play-icon {
          transform: scale(1);
        }
        .reels-swiper-wrap
          .swiper-slide:not(.swiper-slide-active)
          .reel-play-icon {
          transform: scale(0.9);
          opacity: 0.85;
        }
        .reels-swiper-wrap .reels-pagination .swiper-pagination-bullet {
          position: relative;
          opacity: 1;
          width: 44px;
          height: 44px;
          margin: 0 !important;
          background: transparent;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .reels-swiper-wrap .reels-pagination .swiper-pagination-bullet::after {
          content: "";
          display: block;
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.25);
          transition: all 0.3s ease;
        }
        :global(.dark)
          .reels-swiper-wrap
          .reels-pagination
          .swiper-pagination-bullet::after {
          background: rgba(255, 255, 255, 0.25);
        }
        .reels-swiper-wrap
          .reels-pagination
          .swiper-pagination-bullet-active::after {
          width: 22px;
          background: #ff4da3;
        }
        @media (min-width: 768px) {
          .reels-swiper-wrap .reels-pagination .swiper-pagination-bullet {
            width: 10px;
            height: 10px;
            margin: 0 3px !important;
          }
          .reels-swiper-wrap .reels-pagination .swiper-pagination-bullet::after {
            width: 6px;
            height: 6px;
          }
          .reels-swiper-wrap
            .reels-pagination
            .swiper-pagination-bullet-active::after {
            width: 18px;
          }
        }
      `}</style>
    </section>
  );
}
