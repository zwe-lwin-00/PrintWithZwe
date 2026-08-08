import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useTranslation } from "@/context/LocaleProvider";
import { driveImageFallbacks, driveViewUrl } from "@/lib/gallery";
import type { GalleryItem } from "@/types/gallery";

const SWIPE_THRESHOLD = 56;
const DOUBLE_TAP_MS = 300;
const LIGHTBOX_WIDTH = 1920;

interface GalleryLightboxProps {
  items: GalleryItem[];
  index: number;
  open: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function GalleryLightbox({
  items,
  index,
  open,
  onClose,
  onIndexChange,
}: GalleryLightboxProps) {
  const { t } = useTranslation();
  const item = items[index];
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [sourceIndex, setSourceIndex] = useState(0);

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef(0);
  const pinchStartRef = useRef<{ distance: number; scale: number } | null>(null);
  const panStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null,
  );

  const resetView = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setSourceIndex(0);
  }, []);

  useEffect(() => {
    if (!open) return;
    resetView();
  }, [index, open, resetView]);

  const goPrev = useCallback(() => {
    if (items.length <= 1) return;
    onIndexChange(index === 0 ? items.length - 1 : index - 1);
  }, [index, items.length, onIndexChange]);

  const goNext = useCallback(() => {
    if (items.length <= 1) return;
    onIndexChange(index === items.length - 1 ? 0 : index + 1);
  }, [index, items.length, onIndexChange]);

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, goPrev, goNext]);

  const zoomIn = () => setScale((current) => Math.min(current + 0.5, 3));
  const zoomOut = () => {
    setScale((current) => {
      const next = Math.max(current - 0.5, 1);
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const toggleDoubleTapZoom = () => {
    setScale((current) => {
      if (current > 1) {
        setOffset({ x: 0, y: 0 });
        return 1;
      }
      return 2;
    });
  };

  const touchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    if (event.touches.length === 2) {
      pinchStartRef.current = {
        distance: touchDistance(event.touches),
        scale,
      };
      panStartRef.current = null;
      touchStartRef.current = null;
      return;
    }

    if (event.touches.length === 1) {
      const touch = event.touches[0];
      if (scale > 1) {
        panStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          ox: offset.x,
          oy: offset.y,
        };
      } else {
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
        };
      }
    }
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (event.touches.length === 2 && pinchStartRef.current) {
      event.preventDefault();
      const distance = touchDistance(event.touches);
      const ratio = distance / pinchStartRef.current.distance;
      const next = Math.min(Math.max(pinchStartRef.current.scale * ratio, 1), 3);
      setScale(next);
      if (next === 1) setOffset({ x: 0, y: 0 });
      return;
    }

    if (event.touches.length === 1 && panStartRef.current && scale > 1) {
      event.preventDefault();
      const touch = event.touches[0];
      setOffset({
        x: panStartRef.current.ox + (touch.clientX - panStartRef.current.x),
        y: panStartRef.current.oy + (touch.clientY - panStartRef.current.y),
      });
    }
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    pinchStartRef.current = null;
    panStartRef.current = null;

    if (scale > 1 || !touchStartRef.current || event.changedTouches.length !== 1) {
      touchStartRef.current = null;
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const elapsed = Date.now() - touchStartRef.current.time;

    if (
      elapsed < DOUBLE_TAP_MS &&
      Math.abs(deltaX) < 12 &&
      Math.abs(deltaY) < 12
    ) {
      const now = Date.now();
      if (now - lastTapRef.current < DOUBLE_TAP_MS) {
        toggleDoubleTapZoom();
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
      touchStartRef.current = null;
      return;
    }

    if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) goPrev();
      else goNext();
    }

    touchStartRef.current = null;
  };

  if (!item) return null;

  const sources = driveImageFallbacks(item.id, LIGHTBOX_WIDTH);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={item.title}
          className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] sm:px-6">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium sm:text-base">{item.title}</p>
              <p className="text-xs text-white/60">
                {t("gallery.lightboxCounter", {
                  current: index + 1,
                  total: items.length,
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("gallery.close")}
              className="inline-flex h-11 min-h-11 w-11 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="relative flex min-h-0 flex-1 items-center justify-center">
            {items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label={t("gallery.previous")}
                  className="absolute left-2 z-10 hidden h-11 w-11 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-colors hover:bg-black/70 sm:inline-flex sm:left-4"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label={t("gallery.next")}
                  className="absolute right-2 z-10 hidden h-11 w-11 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-colors hover:bg-black/70 sm:inline-flex sm:right-4"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <div
              className="flex h-full w-full touch-none items-center justify-center overflow-hidden px-2 py-4 sm:px-16"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onDoubleClick={toggleDoubleTapZoom}
            >
              <img
                src={sources[sourceIndex]}
                alt={item.title}
                draggable={false}
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full select-none object-contain transition-transform duration-150 ease-out"
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                }}
                onError={() => {
                  setSourceIndex((current) =>
                    current < sources.length - 1 ? current + 1 : current,
                  );
                }}
              />
            </div>
          </div>

          <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:px-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={zoomOut}
                disabled={scale <= 1}
                aria-label={t("gallery.zoomOut")}
                className="inline-flex h-11 min-h-11 w-11 items-center justify-center rounded-full bg-white/10 disabled:opacity-40"
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={zoomIn}
                disabled={scale >= 3}
                aria-label={t("gallery.zoomIn")}
                className="inline-flex h-11 min-h-11 w-11 items-center justify-center rounded-full bg-white/10 disabled:opacity-40"
              >
                <ZoomIn className="h-5 w-5" />
              </button>
              <span className="hidden text-xs text-white/60 sm:inline">
                {t("gallery.zoomHint")}
              </span>
            </div>

            <a
              href={driveViewUrl(item.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 min-h-11 items-center gap-2 rounded-full bg-white/10 px-4 text-xs font-medium transition-colors hover:bg-white/20 sm:text-sm"
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              <span className="hidden xs:inline">{t("gallery.openInDrive")}</span>
            </a>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
