import { motion } from "framer-motion";
import { Calculator, ShoppingBag, Sparkles } from "lucide-react";
import { ContactButtons } from "@/components/ui/ContactButtons";
import { Container } from "@/components/layout/Container";
import { SceneBackground } from "@/components/ui/SceneBackground";
import { PrintAnimation } from "@/components/ui/PrintAnimation";
import {
  AnimatedArrow,
  MotionLinkButton,
} from "@/components/ui/MotionButton";
import { useTranslation } from "@/context/LocaleProvider";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

const statKeys = ["materials", "multiColor", "turnaround"] as const;

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden lg:min-h-[100dvh]">
      <SceneBackground />

      <Container className="relative pb-16 pt-24 sm:pb-20 sm:pt-28 lg:grid lg:min-h-[100dvh] lg:grid-cols-[1fr_minmax(280px,400px)] lg:items-center lg:gap-10 lg:pb-20 lg:pt-32 xl:gap-14">
        <div className="flex min-w-0 flex-col justify-center">
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mb-4 inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur sm:mb-6 sm:gap-2 sm:px-4 sm:text-sm"
          >
            <motion.span
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
            </motion.span>
            <span className="leading-snug">
              <span className="sm:hidden">{t("brand.heroBadgeShort")}</span>
              <span className="hidden sm:inline">{t("brand.heroBadge")}</span>
            </span>
          </motion.div>

          <motion.h1
            custom={0.1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="max-w-4xl text-[1.75rem] font-bold leading-tight tracking-tight xs:text-3xl sm:text-5xl lg:text-5xl xl:text-6xl"
          >
            <span className="text-gradient-brand">{t("brand.name")}</span>
            <motion.span
              custom={0.2}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="mt-2 block text-lg font-semibold leading-snug text-muted-foreground xs:text-xl sm:text-4xl sm:leading-tight lg:text-3xl xl:text-4xl"
            >
              {t("brand.tagline")}
            </motion.span>
          </motion.h1>

          <motion.p
            custom={0.25}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg lg:text-base xl:text-lg"
          >
            {t("hero.description")}
          </motion.p>

          <motion.div
            custom={0.3}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mx-auto mt-8 w-full max-w-[400px] lg:hidden"
          >
            <PrintAnimation className="w-full" />
          </motion.div>

          <motion.div
            custom={0.35}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-6 flex w-full flex-col gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:items-center sm:gap-4"
          >
            <MotionLinkButton
              href="#calculator"
              variant="default"
              icon={<Calculator className="h-4 w-4" />}
              className="w-full sm:w-auto"
            >
              {t("hero.estimatePrice")}
              <AnimatedArrow />
            </MotionLinkButton>
            <MotionLinkButton
              href="#shop"
              icon={<ShoppingBag className="h-4 w-4" />}
              className="w-full sm:w-auto"
            >
              {t("hero.viewShop")}
            </MotionLinkButton>
          </motion.div>

          <motion.div
            custom={0.38}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-4 sm:mt-5"
          >
            <ContactButtons layout="row" size="default" className="max-w-md" />
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:gap-4 md:grid-cols-3 lg:mt-10"
          >
            {statKeys.map((key) => (
              <motion.div
                key={key}
                variants={staggerItem}
                className={cn(
                  "rounded-xl border border-border bg-card/50 px-4 py-3.5 shadow-elevated backdrop-blur-sm transition-colors duration-300 hover:border-primary/30 hover:bg-card/70 sm:px-5 sm:py-4",
                )}
              >
                <motion.p
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-[0.65rem] font-medium uppercase tracking-wider text-primary sm:text-xs"
                >
                  {t(`hero.stats.${key}.label`)}
                </motion.p>
                <p className="mt-1 text-xs font-medium text-foreground sm:text-sm">
                  {t(`hero.stats.${key}.value`)}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none hidden w-full max-w-[400px] shrink-0 lg:block"
        >
          <PrintAnimation className="w-full" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 md:block lg:left-[25%]"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2 text-muted-foreground"
          >
            <span className="text-xs uppercase tracking-widest">{t("hero.scroll")}</span>
            <div className="h-10 w-6 rounded-full border border-border p-1.5">
              <motion.div
                animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="mx-auto h-2 w-1 rounded-full bg-primary"
              />
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
