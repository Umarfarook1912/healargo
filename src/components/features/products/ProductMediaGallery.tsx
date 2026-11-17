"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { ASSETS } from "@/constants/assets";
import { cn } from "@/lib/utils/cn";
import {
  detectMediaKind,
  driveEmbedUrl,
  videoPosterUrl,
  youtubeEmbedUrl,
} from "@/lib/utils/media";

export function ProductMediaGallery({
  image,
  images,
  videos,
  alt,
}: {
  image: string;
  images: string[];
  videos: string[];
  alt: string;
}) {
  const thumbs = [...new Set([image, ...images, ...videos].filter(Boolean))];
  const [active, setActive] = useState(image);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setActive(image);
    setFailed(false);
  }, [image]);
  const current = active || image;
  const kind = videos.includes(current) ? detectMediaKind(current) : "file";
  const isVideo = videos.includes(current);
  const activeIndex = Math.max(0, thumbs.indexOf(current));
  const touchStartX = useRef<number | null>(null);

  function select(src: string) {
    setFailed(false);
    setActive(src);
  }

  function step(delta: number) {
    if (thumbs.length < 2) return;
    select(thumbs[(activeIndex + delta + thumbs.length) % thumbs.length]);
  }

  const nameLower = alt.toLowerCase();
  const isCoconut = nameLower.includes("coconut") || nameLower.includes("thengai");
  const isSesame = nameLower.includes("sesame") || nameLower.includes("gingelly") || nameLower.includes("til");
  const isGroundnut = nameLower.includes("groundnut") || nameLower.includes("peanut") || nameLower.includes("kadalai");

  const frameBg = isCoconut
    ? "bg-[#D8F3EC] border-[#8EDBD0]/60"
    : isSesame
    ? "bg-[#FFF0B8] border-[#FFD45A]/70"
    : isGroundnut
    ? "bg-[#FFE0D4] border-[#FF8066]/50"
    : "bg-[#DDECCF] border-[#4F8A45]/35";

  return (
    <div className="flex flex-col gap-3 lg:flex-row-reverse lg:gap-3">
      <div
        className={cn(
          "group/media relative aspect-square w-full overflow-hidden rounded-3xl border shadow-[var(--shadow-lifted)]",
          frameBg
        )}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null || isVideo) return;
          const diff = touchStartX.current - e.changedTouches[0].clientX;
          touchStartX.current = null;
          if (Math.abs(diff) > 40) step(diff > 0 ? 1 : -1);
        }}
      >
        {/* Soft radial glow behind product bottle */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-8 -z-10 rounded-full bg-white/70 blur-2xl"
        />

        {isVideo ? (
          <VideoFrame url={current} kind={kind} title={alt} />
        ) : (
          <>
            <Image
              src={failed ? ASSETS.PLACEHOLDER_PRODUCT : current}
              alt={alt}
              fill
              unoptimized
              priority
              onError={() => setFailed(true)}
              className="object-contain p-6 transition-transform duration-500 ease-out sm:p-8 lg:p-10 lg:group-hover/media:scale-[1.05]"
            />
            {videos.length > 0 ? (
              <button
                type="button"
                onClick={() => select(videos[0])}
                className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-dark/85 px-3.5 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:bg-primary active:scale-95"
              >
                <Play className="h-3.5 w-3.5 fill-white text-white" />
                Watch Video
              </button>
            ) : null}
          </>
        )}

        {thumbs.length > 1 ? (
          <>
            <span className="absolute left-4 top-4 z-10 rounded-full bg-card/90 px-2.5 py-1 font-mono text-[11px] font-semibold text-dark shadow-sm backdrop-blur lg:hidden">
              {activeIndex + 1}/{thumbs.length}
            </span>
            <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5 lg:hidden" aria-hidden>
              {thumbs.map((src) => (
                <span
                  key={src}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    src === current ? "w-5 bg-primary" : "w-1.5 bg-dark/25",
                  )}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
      {thumbs.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:max-h-[min(32rem,65vh)] lg:w-16 lg:shrink-0 lg:flex-col lg:overflow-y-auto lg:overflow-x-visible lg:pb-0">
          {thumbs.map((src, index) => (
            <button
              key={src}
              type="button"
              aria-label={`Show media ${index + 1}`}
              aria-current={src === current ? "true" : undefined}
              onClick={() => select(src)}
              className={cn(
                "relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition lg:h-16 lg:w-16",
                src === current
                  ? "border-primary ring-2 ring-primary/15"
                  : "border-border/60 opacity-75 hover:border-primary/40 hover:opacity-100",
              )}
            >
              {videos.includes(src) ? (
                <div className="relative h-full w-full">
                  <VideoThumb url={src} />
                  <span className="absolute bottom-0 left-0 right-0 bg-primary/95 py-0.5 text-center text-[9px] font-bold uppercase tracking-wider text-white">
                    Video
                  </span>
                </div>
              ) : (
                <Image src={src} alt="" fill unoptimized className="object-cover" />
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function VideoThumb({ url }: { url: string }) {
  const poster = videoPosterUrl(url);
  const kind = detectMediaKind(url);
  const [posterFailed, setPosterFailed] = useState(false);
  const showPoster = Boolean(poster) && !posterFailed;

  return (
    <span className="relative block h-full w-full bg-dark">
      {showPoster ? (
        <Image
          src={poster ?? ""}
          alt=""
          fill
          unoptimized
          className="object-cover"
          onError={() => setPosterFailed(true)}
        />
      ) : kind === "file" ? (
        <video
          src={`${url}#t=0.1`}
          muted
          playsInline
          preload="metadata"
          className="pointer-events-none h-full w-full object-cover"
        />
      ) : null}
      <span className="absolute inset-0 flex items-center justify-center bg-dark/30">
        <Play className="h-4 w-4 fill-white text-white" />
      </span>
    </span>
  );
}

function VideoFrame({
  url,
  kind,
  title,
}: {
  url: string;
  kind: ReturnType<typeof detectMediaKind>;
  title: string;
}) {
  if (kind === "file") {
    return (
      <video
        src={url}
        controls
        autoPlay
        playsInline
        className="h-full w-full object-contain"
      />
    );
  }
  const embed =
    kind === "youtube"
      ? youtubeEmbedUrl(url) ?? url
      : kind === "drive"
        ? driveEmbedUrl(url)
        : url;
  return (
    <iframe
      src={embed}
      title={title}
      className="h-full w-full"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}
