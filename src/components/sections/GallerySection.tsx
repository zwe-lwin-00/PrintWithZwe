import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Expand, ImageIcon } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { GalleryLightbox } from "@/components/ui/GalleryLightbox";
import { useTranslation } from "@/context/LocaleProvider";
import { useGalleryItems } from "@/hooks/useGalleryItems";
import { driveImageFallbacks } from "@/lib/gallery";
import { fadeUp, scaleIn } from "@/lib/motion";
import { cn } from "@/lib/utils";

const INITIAL_VISIBLE = 12;
const LOAD_MORE_STEP = 12;
const THUMB_WIDTH = 600;

function GallerySkeleton() {
  return (
    <div className="mt-8 grid grid-cols-2 gap-2 sm:mt-10 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 lg:gap-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-border bg-card/40"
        >
          <div className="aspect-square animate-pulse bg-muted/60" />
        </div>
      ))}
    </div>
  );
}

function GalleryThumb({
  title,
  fileId,
  priority = false,
}: {
  title: string;
  fileId: string;
  priority?: boolean;
}) {
  const sources = driveImageFallbacks(fileId, THUMB_WIDTH);
  const [sourceIndex, setSourceIndex] = useState(0);

  return (
    <img
      src={sources[sourceIndex]}
      alt={title}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      referrerPolicy="no-referrer"
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      onError={() => {
        setSourceIndex((current) =>
          current < sources.length - 1 ? current + 1 : current,
        );
      }}
    />
  );
}

export function GallerySection() {
  const { t } = useTranslation();
  const { items, state, error } = useGalleryItems();
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [eagerFromIndex, setEagerFromIndex] = useState(INITIAL_VISIBLE);

  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount],
  );

  const handleLoadMore = () => {
    setEagerFromIndex(visibleCount);
    setVisibleCount((count) => Math.min(count + LOAD_MORE_STEP, items.length));
  };

  const hasMore = visibleCount < items.length;

  return (
    <section
      id="gallery"
      className="relative overflow-hidden border-y border-border/60 py-16 sm:py-24 lg:py-32"
    >
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          className="mx-auto max-w-xl px-2 text-center sm:px-0"
        >
          <motion.span
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
            custom={0.1}
            whileHover={{ rotate: 5, scale: 1.05 }}
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground sm:h-14 sm:w-14"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </motion.div>
          </motion.span>
          <h2 className="mt-5 text-2xl font-bold tracking-tight sm:mt-6 sm:text-3xl lg:text-4xl">
            {t("gallery.title")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:mt-4 sm:text-base">
            {t("gallery.description")}
          </p>
          {state === "ready" && items.length > 0 && (
            <p className="mt-2 text-xs font-medium text-primary sm:text-sm">
              {t("gallery.photoCount", { count: items.length })}
            </p>
          )}
        </motion.div>

        {state === "loading" && <GallerySkeleton />}

        {state === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mt-10 flex max-w-lg items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-muted-foreground sm:mt-14"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-foreground">{t("gallery.errorTitle")}</p>
              <p className="mt-1">{t("gallery.errorHint")}</p>
              {error && <p className="mt-2 text-xs opacity-70">{error}</p>}
            </div>
          </motion.div>
        )}

        {state === "empty" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mt-10 max-w-lg rounded-2xl border border-border bg-card/40 p-6 text-center sm:mt-14"
          >
            <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-4 font-medium text-foreground">{t("gallery.emptyTitle")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("gallery.emptyHint")}</p>
          </motion.div>
        )}

        {state === "ready" && (
          <>
            <div className="mt-8 grid grid-cols-2 gap-2 sm:mt-10 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 lg:gap-4">
              {visibleItems.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLightboxIndex(items.indexOf(item))}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border border-border bg-card/40 text-left shadow-elevated transition-[transform,colors] duration-200 hover:border-primary/30 active:scale-[0.98] sm:hover:-translate-y-1",
                  )}
                >
                  <div className="relative aspect-square overflow-hidden bg-muted/60">
                    <GalleryThumb
                      title={item.title}
                      fileId={item.id}
                      priority={
                        index < INITIAL_VISIBLE || index >= eagerFromIndex
                      }
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                    <div className="absolute bottom-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-100 backdrop-blur-sm sm:bg-black/40">
                      <Expand className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="truncate px-2.5 py-2 text-xs font-medium sm:px-3 sm:text-sm">
                    {item.title}
                  </p>
                </button>
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 flex flex-col items-center gap-2 sm:mt-10">
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {t("gallery.showingCount", {
                    shown: visibleCount,
                    total: items.length,
                  })}
                </p>
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="inline-flex h-11 min-h-11 items-center justify-center rounded-lg border border-border bg-card/60 px-6 text-sm font-medium transition-colors hover:border-primary/30 hover:bg-card"
                >
                  {t("gallery.loadMore")}
                </button>
              </div>
            )}
          </>
        )}
      </Container>

      <GalleryLightbox
        items={items}
        index={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </section>
  );
}
