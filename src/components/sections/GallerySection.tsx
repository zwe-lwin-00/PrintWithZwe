import { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, ImageIcon } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { useTranslation } from "@/context/LocaleProvider";
import { useGalleryItems } from "@/hooks/useGalleryItems";
import { driveImageFallbacks, driveViewUrl } from "@/lib/gallery";
import {
  fadeUp,
  scaleIn,
  staggerContainer,
  staggerItem,
} from "@/lib/motion";
import { cn } from "@/lib/utils";

function GallerySkeleton() {
  return (
    <div className="mt-10 grid grid-cols-1 gap-4 xs:grid-cols-2 sm:mt-14 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-border bg-card/40 p-4 sm:p-6"
        >
          <div className="aspect-[4/3] animate-pulse rounded-lg bg-muted/60 sm:aspect-video" />
          <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

function GalleryImage({ title, fileId }: { title: string; fileId: string }) {
  const sources = driveImageFallbacks(fileId);
  const [sourceIndex, setSourceIndex] = useState(0);

  return (
    <img
      src={sources[sourceIndex]}
      alt={title}
      loading="lazy"
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
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer}
            className="mt-10 grid grid-cols-1 gap-4 xs:grid-cols-2 sm:mt-14 lg:grid-cols-3"
          >
            {items.map((item, index) => (
              <motion.a
                key={item.id}
                href={driveViewUrl(item.id)}
                target="_blank"
                rel="noopener noreferrer"
                variants={staggerItem}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border border-border bg-card/40 p-4 shadow-elevated transition-[colors,box-shadow] duration-300 sm:p-4",
                  index === items.length - 1 &&
                    items.length % 3 === 1 &&
                    "xs:col-span-2 lg:col-span-1",
                )}
              >
                <motion.div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
                />
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted/60 sm:aspect-video">
                  <GalleryImage title={item.title} fileId={item.id} />
                </div>
                <p className="relative mt-3 line-clamp-2 text-sm font-medium sm:mt-4">
                  {item.title}
                </p>
              </motion.a>
            ))}
          </motion.div>
        )}
      </Container>
    </section>
  );
}
