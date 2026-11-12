import { motion } from "framer-motion";
import { Calculator } from "lucide-react";
import { ContactButtons } from "@/components/ui/ContactButtons";
import { Container } from "@/components/layout/Container";
import { SceneBackground } from "@/components/ui/SceneBackground";
import { PrintAnimation } from "@/components/ui/PrintAnimation";
import {
  AnimatedArrow,
  MotionLinkButton,
} from "@/components/ui/MotionButton";
import { useTranslation } from "@/context/LocaleProvider";
import { fadeUp } from "@/lib/motion";

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden lg:min-h-[100dvh]">
      <SceneBackground />

      <Container className="relative pb-16 pt-24 sm:pb-20 sm:pt-28 lg:grid lg:min-h-[100dvh] lg:grid-cols-[minmax(0,1fr)_minmax(240px,380px)] lg:items-center lg:gap-8 lg:pb-20 lg:pt-32 xl:grid-cols-[minmax(0,1fr)_minmax(280px,400px)] xl:gap-14">
        <div className="flex min-w-0 flex-col justify-center">
          <motion.h1
            custom={0.1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="max-w-4xl break-words text-[1.65rem] font-bold leading-tight tracking-tight xs:text-3xl sm:text-4xl md:text-5xl xl:text-6xl"
          >
            <span className="text-gradient-brand">{t("brand.name")}</span>
            <motion.span
              custom={0.2}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="mt-2 block text-base font-semibold leading-snug text-muted-foreground xs:text-lg sm:text-2xl sm:leading-snug md:text-3xl lg:text-2xl xl:text-3xl"
            >
              {t("brand.tagline")}
            </motion.span>
          </motion.h1>

          <motion.p
            custom={0.25}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-muted-foreground sm:mt-6 sm:text-base md:text-lg lg:text-base xl:text-lg"
          >
            {t("hero.description")}
          </motion.p>

          <motion.div
            custom={0.3}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mx-auto mt-8 w-full min-w-0 max-w-[400px] lg:hidden"
          >
            <PrintAnimation className="w-full" />
          </motion.div>

          <motion.div
            custom={0.35}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-6 flex w-full min-w-0 flex-col gap-3 sm:mt-8 md:max-w-xl md:flex-row md:items-stretch md:gap-3 lg:max-w-none"
          >
            <MotionLinkButton
              href="#calculator"
              variant="default"
              icon={<Calculator className="h-4 w-4 shrink-0" />}
              className="w-full md:flex-1 lg:w-auto lg:flex-none"
            >
              {t("hero.estimatePrice")}
              <AnimatedArrow />
            </MotionLinkButton>
            <ContactButtons layout="row" size="default" className="w-full md:flex-1 lg:w-auto lg:flex-none" />
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
