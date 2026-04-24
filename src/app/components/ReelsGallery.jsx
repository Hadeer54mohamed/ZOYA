"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Play, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, EffectCoverflow } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/effect-coverflow";

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
  const enableLoop = reels.length >= 4;

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

  const desktopSlides = Math.min(4, reels.length || 1);
  const tabletSlides = Math.min(3, reels.length || 1);
  const smallSlides = Math.min(2.2, reels.length || 1);

  const modalEmbed = selectedReel ? getEmbedUrl(selectedReel.link) : null;

  const modal =
    selectedReel && mounted
      ? createPortal(
          <div
            className={`fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-md transition-opacity duration-300 ${
              isModalClosing ? "opacity-0" : "opacity-100"
            }`}
            onClick={closeModal}
          >
            <button
              onClick={closeModal}
              className="absolute top-5 right-5 z-10 p-2 rounded-full bg-white/10 backdrop-blur-md text-white hover:scale-110 transition"
              aria-label="Close"
            >
              <X size={22} />
            </button>

            <div
              className="relative w-full max-w-[380px] aspect-[9/16] bg-black rounded-[2rem] overflow-hidden shadow-2xl border border-white/10"
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
                className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-medium border border-white/20 hover:bg-white/20 transition"
              >
                <ExternalLink className="w-4 h-4" />
                VIEW ON INSTAGRAM
              </a>
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <section className="py-20 bg-background overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-accent/50" />
            <p className="text-[10px] tracking-[0.35em] uppercase text-accent font-bold">
              @ZOYA.STUDIO
            </p>
            <span className="w-8 h-px bg-accent/50" />
          </div>

          <h2 className="text-4xl md:text-6xl font-black text-foreground">
            Style in Motion
          </h2>
        </div>

        {!hasReels ? (
          <div className="text-center py-20 text-muted-foreground">
            <Play className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-sm">No reels available yet</p>
          </div>
        ) : (
          <div className="relative">
            <Swiper
              modules={[Navigation, EffectCoverflow]}
              effect="coverflow"
              centeredSlides
              loop={enableLoop}
              slidesPerView={1.3}
              spaceBetween={14}
              coverflowEffect={{
                rotate: 0,
                stretch: 0,
                depth: 120,
                modifier: 1.6,
                slideShadows: false,
              }}
              breakpoints={{
                640: { slidesPerView: smallSlides, spaceBetween: 18 },
                768: { slidesPerView: tabletSlides, spaceBetween: 22 },
                1024: { slidesPerView: desktopSlides, spaceBetween: 24 },
              }}
              navigation={{ prevEl: ".ig-prev", nextEl: ".ig-next" }}
              className="!py-8"
            >
              {reels.map((reel) => (
                <SwiperSlide key={reel.id} className="!h-auto">
                  {({ isActive }) => (
                    <div
                      onClick={() => setSelectedReel(reel)}
                      className={`relative aspect-[9/16] rounded-[2rem] overflow-hidden cursor-pointer border border-white/10 bg-black transition-all duration-500 group ${
                        isActive
                          ? "scale-100 opacity-100 ring-1 ring-accent/40"
                          : "scale-[0.92] opacity-50"
                      }`}
                    >
                      <ReelPreview reel={reel} />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                          <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                  )}
                </SwiperSlide>
              ))}
            </Swiper>

            <button
              className="ig-prev absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-10 h-10 z-20 rounded-full bg-black/60 backdrop-blur-md border border-white/10 hidden md:flex items-center justify-center hover:scale-110 transition"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>

            <button
              className="ig-next absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-10 h-10 z-20 rounded-full bg-black/60 backdrop-blur-md border border-white/10 hidden md:flex items-center justify-center hover:scale-110 transition"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        )}
      </div>

      {modal}
    </section>
  );
}
