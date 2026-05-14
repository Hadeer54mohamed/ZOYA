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
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Navigation,
  EffectCoverflow,
  Pagination,
  Autoplay,
} from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";

function getEmbedUrl(link) {
  if (!link) return null;
  const match = link.match(/\/reel\/([^/]+)/);
  return match ? `https://www.instagram.com/reel/${match[1]}/embed/` : null;
}

function ReelPreview({ reel }) {
  if (reel.thumbnail) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={reel.thumbnail}
        alt={reel.title || "Reel"}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
    );
  }

  if (reel.videoUrl) {
    return (
      <video
        src={reel.videoUrl}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
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
        className="absolute inset-0 w-full h-full pointer-events-none"
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

export default function ReelsGallery({ reels = [] }) {
  const [selectedReel, setSelectedReel] = useState(null);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => setMounted(true), []);

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

  const modalEmbed = selectedReel ? getEmbedUrl(selectedReel.link) : null;

  const modal =
    selectedReel && mounted
      ? createPortal(
          <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md transition-opacity duration-300 p-4 sm:p-6 ${
              isModalClosing ? "opacity-0" : "opacity-100"
            }`}
            onClick={closeModal}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white border border-white/15 hover:bg-[#FF4DA3]/80 hover:border-[#FF4DA3] hover:scale-110 transition"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div
              className="relative w-full max-w-[380px] aspect-[9/16] bg-black rounded-[1.75rem] sm:rounded-[2rem] overflow-hidden shadow-[0_30px_80px_-20px_rgba(255,77,163,0.4)] border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedReel.videoUrl ? (
                <video
                  ref={videoRef}
                  src={selectedReel.videoUrl}
                  poster={selectedReel.thumbnail || undefined}
                  className="absolute inset-0 w-full h-full object-cover"
                  controls
                  autoPlay
                  playsInline
                />
              ) : modalEmbed ? (
                <iframe
                  src={modalEmbed}
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen
                  title="Instagram Reel"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/50 text-xs">
                  No preview available
                </div>
              )}
            </div>

            {selectedReel.link && (
              <a
                href={selectedReel.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase border border-white/20 hover:bg-[#FF4DA3] hover:border-[#FF4DA3] transition whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                View on Instagram
              </a>
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <section className="relative py-8 md:py-12 bg-white dark:bg-black overflow-hidden transition-colors duration-500">
      {/* Background pink glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#FF4DA3]/[0.04] dark:bg-[#FF4DA3]/[0.06] blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        {/* === HEADING === */}
        <div className="text-center mb-10 sm:mb-14 px-6">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-[#FF4DA3]/50" />
            <p className="text-[10px] tracking-[0.4em] uppercase text-[#FF4DA3] font-bold flex items-center gap-1.5">
              <InstagramIcon className="w-3 h-3" />
              @ZOYA.STUDIO
            </p>
            <span className="w-8 h-px bg-[#FF4DA3]/50" />
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-black dark:text-white tracking-tighter leading-tight">
            Style in{" "}
            <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-[#FF4DA3] via-[#ff7eb6] to-[#FF4DA3]">
              Motion
            </span>
          </h2>

          <p className="mt-4 text-black/50 dark:text-white/40 text-xs sm:text-sm max-w-md mx-auto">
            Behind the scenes, drops & street looks — straight from our feed.
          </p>
        </div>

        {/* === EMPTY STATE === */}
        {!hasReels ? (
          <div className="text-center py-20 text-black/50 dark:text-white/50 px-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
              <Play className="w-6 h-6 opacity-40" />
            </div>
            <p className="text-sm">No reels available yet</p>
          </div>
        ) : (
          <div className="relative reels-swiper-wrap">
            <Swiper
              modules={[Navigation, EffectCoverflow, Pagination, Autoplay]}
              effect="coverflow"
              centeredSlides
              loop={enableLoop}
              grabCursor
              watchSlidesProgress
              autoplay={
                enableLoop
                  ? {
                      delay: 4500,
                      disableOnInteraction: false,
                      pauseOnMouseEnter: true,
                    }
                  : false
              }
              slidesPerView={Math.min(slidesPerViewCap, 1.3)}
              spaceBetween={12}
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
              navigation={{ prevEl: ".ig-prev", nextEl: ".ig-next" }}
              pagination={{
                el: ".reels-pagination",
                clickable: true,
                dynamicBullets: true,
                dynamicMainBullets: 4,
              }}
              className="!py-6 sm:!py-8 !px-4 sm:!px-6"
            >
              {reels.map((reel) => (
                <SwiperSlide key={reel.id} className="!h-auto">
                  {({ isActive }) => (
                    <div
                      onClick={() => isActive && setSelectedReel(reel)}
                      className={`relative aspect-[9/16] rounded-[1.5rem] sm:rounded-[1.75rem] overflow-hidden cursor-pointer border bg-black transition-all duration-500 group ${
                        isActive
                          ? "scale-100 opacity-100 border-[#FF4DA3]/40 shadow-[0_20px_50px_-15px_rgba(255,77,163,0.45)]"
                          : "scale-[0.94] opacity-50 border-black/10 dark:border-white/10"
                      }`}
                    >
                      <ReelPreview reel={reel} />

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

                      {/* Top badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 pointer-events-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF4DA3] animate-pulse" />
                        <span className="text-[8px] font-bold text-white tracking-[0.2em] uppercase">
                          Reel
                        </span>
                      </div>

                      {/* Title */}
                      {reel.title && isActive && (
                        <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                          <p className="text-white text-xs sm:text-sm font-semibold line-clamp-2 drop-shadow-lg">
                            {reel.title}
                          </p>
                        </div>
                      )}

                      {/* Hover play overlay (desktop only) */}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-[#FF4DA3] flex items-center justify-center shadow-[0_0_30px_rgba(255,77,163,0.6)] scale-90 group-hover:scale-100 transition-transform duration-300">
                          <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                        </div>
                      </div>

                      {/* Mobile play indicator (visible on active only) */}
                      {isActive && (
                        <div className="absolute inset-0 flex items-center justify-center md:hidden pointer-events-none">
                          <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25">
                            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Desktop Navigation */}
            <button
              className="ig-prev absolute left-2 lg:left-6 top-1/2 -translate-y-1/2 w-11 h-11 z-20 rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-md border border-black/10 dark:border-white/10 hidden md:flex items-center justify-center hover:bg-[#FF4DA3] hover:border-[#FF4DA3] hover:text-white transition-all duration-300 text-black dark:text-white shadow-lg"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              className="ig-next absolute right-2 lg:right-6 top-1/2 -translate-y-1/2 w-11 h-11 z-20 rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-md border border-black/10 dark:border-white/10 hidden md:flex items-center justify-center hover:bg-[#FF4DA3] hover:border-[#FF4DA3] hover:text-white transition-all duration-300 text-black dark:text-white shadow-lg"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Mobile pagination */}
            <div className="reels-pagination !relative !bottom-0 !mt-4 flex justify-center md:hidden" />
          </div>
        )}
      </div>

      {modal}

      {/* Custom pagination styles */}
      <style jsx global>{`
        .reels-swiper-wrap .swiper {
          overflow: visible;
        }
        .reels-swiper-wrap .reels-pagination .swiper-pagination-bullet {
          background: rgba(0, 0, 0, 0.2);
          opacity: 1;
          width: 6px;
          height: 6px;
          margin: 0 3px !important;
          transition: all 0.3s ease;
        }
        :global(.dark)
          .reels-swiper-wrap
          .reels-pagination
          .swiper-pagination-bullet {
          background: rgba(255, 255, 255, 0.2);
        }
        .reels-swiper-wrap .reels-pagination .swiper-pagination-bullet-active {
          background: #ff4da3;
          width: 22px;
          border-radius: 999px;
        }
      `}</style>
    </section>
  );
}
