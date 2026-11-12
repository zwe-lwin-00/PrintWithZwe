import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ChevronRight,
  Images,
  MessageCircle,
  Package,
  Phone,
  X,
} from "lucide-react";
import { ProductImage } from "@/components/ui/ProductImage";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useSiteConfig } from "@/context/ConfigProvider";
import { useTranslation } from "@/context/LocaleProvider";
import { useProducts } from "@/hooks/useProducts";
import { buildContactLinks } from "@/lib/contact";
import { formatProductPrice } from "@/api/catalogClient";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

const INITIAL_VISIBLE = 8;
const LOAD_MORE_STEP = 8;

function productImages(product: Product): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];

  for (const url of [...product.imageUrls, product.imageUrl]) {
    const trimmed = url?.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      urls.push(trimmed);
    }
  }

  return urls;
}

function ProductImageGallery({
  images,
  alt,
  activeIndex,
  onActiveIndexChange,
}: {
  images: string[];
  alt: string;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
}) {
  const { t } = useTranslation();
  const touchStartX = useRef<number | null>(null);
  const hasMultiple = images.length > 1;
  const safeIndex = Math.min(activeIndex, Math.max(images.length - 1, 0));
  const activeImage = images[safeIndex];

  const goTo = useCallback(
    (index: number) => {
      if (!images.length) return;
      const next = ((index % images.length) + images.length) % images.length;
      onActiveIndexChange(next);
    },
    [images.length, onActiveIndexChange],
  );

  const goPrevious = useCallback(() => goTo(safeIndex - 1), [goTo, safeIndex]);
  const goNext = useCallback(() => goTo(safeIndex + 1), [goTo, safeIndex]);

  useEffect(() => {
    if (!hasMultiple) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevious();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrevious, hasMultiple]);

  const handleTouchStart = (event: TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent) => {
    if (touchStartX.current === null || !hasMultiple) return;

    const endX = event.changedTouches[0]?.clientX;
    if (endX === undefined) return;

    const delta = endX - touchStartX.current;
    if (Math.abs(delta) >= 48) {
      if (delta < 0) goNext();
      else goPrevious();
    }

    touchStartX.current = null;
  };

  return (
    <div className="space-y-0">
      <div
        className="relative h-[min(50dvh,28rem)] shrink-0 overflow-hidden bg-muted/60"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {activeImage ? (
          <ProductImage
            key={activeImage}
            src={activeImage}
            alt={alt}
            className="h-full w-full object-contain"
            width={1200}
            loading="eager"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Package className="h-12 w-12 opacity-40" />
          </div>
        )}
      </div>

      {hasMultiple && (
        <div className="flex gap-2 overflow-x-auto border-b border-border px-4 py-3">
          {images.map((url, index) => (
            <button
              key={`${url}-thumb-${index}`}
              type="button"
              onClick={() => onActiveIndexChange(index)}
              aria-label={t("shop.selectImage", { index: index + 1 })}
              aria-current={index === safeIndex ? "true" : undefined}
              className={cn(
                "relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                index === safeIndex
                  ? "border-primary"
                  : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <ProductImage
                src={url}
                alt=""
                className="h-full w-full object-contain"
                width={120}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({
  product,
  locale,
  onSelect,
}: {
  product: Product;
  locale: string;
  onSelect: (product: Product) => void;
}) {
  const { t } = useTranslation();
  const images = productImages(product);
  const price = formatProductPrice(product.price, product.currency, locale);

  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      aria-label={t("shop.viewDetails", { title: product.title, price })}
      className={cn(
        "group w-full overflow-hidden rounded-2xl border border-border bg-card/50 text-left shadow-elevated transition-all active:scale-[0.98]",
        "hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        !product.inStock && "opacity-90",
        product.featured && "ring-1 ring-primary/20",
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-muted/60">
        {images[0] ? (
          <ProductImage
            src={images[0]}
            alt={product.title}
            className="h-full w-full object-contain"
            width={800}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Package className="h-10 w-10 opacity-40" />
          </div>
        )}

        {product.featured && (
          <span className="absolute left-3 top-3 z-[2] rounded-full bg-primary px-2.5 py-1 text-[0.65rem] font-semibold tracking-wide text-primary-foreground">
            {t("shop.featured")}
          </span>
        )}
        {!product.inStock && (
          <>
            <span className="absolute inset-0 z-[1] bg-background/40" aria-hidden />
            <span className="absolute right-3 top-3 z-[2] rounded-full bg-background/90 px-2.5 py-1 text-[0.65rem] font-semibold tracking-wide text-muted-foreground backdrop-blur">
              {t("shop.outOfStock")}
            </span>
          </>
        )}

        {images.length > 1 && (
          <span className="absolute bottom-3 left-3 z-[2] inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-[0.65rem] font-medium text-foreground backdrop-blur">
            <Images className="h-3 w-3" />
            {t("shop.photoCount", { count: images.length })}
          </span>
        )}

        <span className="absolute inset-x-0 bottom-0 z-[2] flex items-center justify-end bg-gradient-to-t from-background/90 via-background/40 to-transparent px-3 pb-3 pt-10 opacity-100 transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100">
          <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
            <span className="sm:hidden">{t("shop.tapToView")}</span>
            <span className="hidden sm:inline">{t("shop.viewDetailsShort")}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </span>
      </div>

      <div className="flex flex-col gap-1 p-3 xs:flex-row xs:items-start xs:justify-between xs:gap-2 sm:gap-3 sm:p-4">
        <h3 className="line-clamp-2 min-w-0 flex-1 text-xs font-semibold leading-snug xs:text-sm sm:text-base">
          {product.title}
        </h3>
        <p className="shrink-0 text-xs font-bold text-primary xs:text-sm sm:text-base">{price}</p>
      </div>
    </button>
  );
}

function ProductDetailDialog({
  product,
  locale,
  open,
  onOpenChange,
  onOrderTelegram,
  onOrderCall,
  hasPhone,
  hasTelegram,
}: {
  product: Product | null;
  locale: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderTelegram: (product: Product) => void;
  onOrderCall: () => void;
  hasPhone: boolean;
  hasTelegram: boolean;
}) {
  const { t } = useTranslation();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [product?.id]);

  if (!product) return null;

  const images = productImages(product);
  const price = formatProductPrice(product.price, product.currency, locale);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      panelClassName="max-w-2xl"
      labelledBy="product-detail-title"
    >
      <div className="flex max-h-[90dvh] flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-elevated sm:max-h-[85dvh] sm:rounded-xl">
        <div className="relative min-h-0 flex-1 overflow-y-auto">
          <div className="relative">
            <ProductImageGallery
              images={images}
              alt={product.title}
              activeIndex={activeImageIndex}
              onActiveIndexChange={setActiveImageIndex}
            />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              aria-label={t("shop.closeDetail")}
              className="absolute right-3 top-3 z-10 bg-background/80 backdrop-blur hover:bg-background/90"
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-wrap gap-2">
              {product.featured && (
                <span className="rounded-full bg-primary px-2.5 py-1 text-[0.65rem] font-semibold tracking-wide text-primary-foreground">
                  {t("shop.featured")}
                </span>
              )}
              {!product.inStock && (
                <span className="rounded-full bg-background/90 px-2.5 py-1 text-[0.65rem] font-semibold tracking-wide text-muted-foreground backdrop-blur">
                  {t("shop.outOfStock")}
                </span>
              )}
            </div>

          </div>

          <div className="space-y-4 px-4 pt-4 pb-6 sm:px-6 sm:pt-5 sm:pb-8">
            <div className="space-y-2">
              <h2
                id="product-detail-title"
                className="text-xl font-semibold leading-snug sm:text-2xl"
              >
                {product.title}
              </h2>
              <p className="text-2xl font-bold text-primary">{price}</p>
              <div className="flex flex-wrap gap-2">
                {product.material && (
                  <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {product.material}
                  </span>
                )}
                {product.category && (
                  <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {product.category}
                  </span>
                )}
              </div>
            </div>

            {product.description && (
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {product.description}
              </p>
            )}

            {!product.inStock && (
              <p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                {t("shop.soldOutHint")}
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-border bg-card px-4 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:px-6">
          {product.inStock ? (
            <div className="flex flex-col gap-2">
              {hasTelegram && (
                <Button
                  className="h-auto min-h-11 w-full whitespace-normal py-2.5 leading-snug"
                  onClick={() => onOrderTelegram(product)}
                >
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  {t("shop.orderTelegram")}
                </Button>
              )}
              {hasPhone && (
                <Button
                  variant="outline"
                  className="h-auto min-h-11 w-full whitespace-normal py-2.5 leading-snug"
                  onClick={onOrderCall}
                >
                  <Phone className="h-4 w-4 shrink-0" />
                  {t("shop.orderCall")}
                </Button>
              )}
            </div>
          ) : (
            <a
              href="#contact"
              onClick={() => onOpenChange(false)}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-medium leading-snug text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("shop.contactForAvailability")}
            </a>
          )}
        </div>
      </div>
    </Dialog>
  );
}

function CatalogSkeleton() {
  return (
    <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-border bg-card/40"
        >
          <div className="aspect-square animate-pulse bg-muted/60" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted/60" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductCatalogSection() {
  const { t } = useTranslation();
  const { config } = useSiteConfig();
  const { items, state, error } = useProducts();
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const contactLinks = buildContactLinks(config.contact);
  const locale = config.pricing.locale;

  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount],
  );
  const hasMore = visibleCount < items.length;

  const handleOrderTelegram = (product: Product) => {
    const message = t("shop.telegramMessage", {
      title: product.title,
      price: formatProductPrice(product.price, product.currency, locale),
    });
    const url = `${contactLinks.telegram}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleOrderCall = () => {
    window.location.href = contactLinks.phoneTel;
  };

  return (
    <section
      id="shop"
      className="relative overflow-hidden border-y border-border/60 bg-card/20 py-12 sm:py-16 lg:py-20"
    >
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6"
        >
          <div className="min-w-0 max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("shop.title")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t("shop.description")}
            </p>
          </div>
          {state === "ready" && items.length > 0 && (
            <p className="shrink-0 text-sm text-muted-foreground">
              {t("shop.productCount", { count: items.length })}
            </p>
          )}
        </motion.div>

        {state === "loading" && <CatalogSkeleton />}

        {state === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex max-w-lg items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-muted-foreground"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-foreground">{t("shop.errorTitle")}</p>
              <p className="mt-1">{t("shop.errorHint")}</p>
              {error && <p className="mt-2 text-xs opacity-70">{error}</p>}
            </div>
          </motion.div>
        )}

        {state === "empty" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 max-w-lg rounded-2xl border border-border bg-card/40 p-6"
          >
            <Package className="h-8 w-8 text-muted-foreground" />
            <p className="mt-4 font-medium text-foreground">{t("shop.emptyTitle")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("shop.emptyHint")}</p>
          </motion.div>
        )}

        {state === "ready" && (
          <>
            <div className="mt-6 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:mt-8 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleItems.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  locale={locale}
                  onSelect={setSelectedProduct}
                />
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 flex flex-col items-center gap-2 sm:mt-10">
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {t("shop.showingCount", {
                    shown: visibleCount,
                    total: items.length,
                  })}
                </p>
                <Button
                  variant="outline"
                  onClick={() =>
                    setVisibleCount((count) =>
                      Math.min(count + LOAD_MORE_STEP, items.length),
                    )
                  }
                >
                  {t("shop.loadMore")}
                </Button>
              </div>
            )}
          </>
        )}
      </Container>

      <ProductDetailDialog
        product={selectedProduct}
        locale={locale}
        open={selectedProduct !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedProduct(null);
        }}
        onOrderTelegram={handleOrderTelegram}
        onOrderCall={handleOrderCall}
        hasPhone={contactLinks.hasPhone}
        hasTelegram={contactLinks.hasTelegram}
      />
    </section>
  );
}
