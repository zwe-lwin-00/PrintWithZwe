import { motion } from "framer-motion";
import { Calculator, MapPin, MessageCircle } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { SceneBackground } from "@/components/ui/SceneBackground";
import {
  AnimatedArrow,
  MotionLinkButton,
} from "@/components/ui/MotionButton";
import { useSiteConfig } from "@/context/ConfigProvider";
import { useTranslation } from "@/context/LocaleProvider";
import { buildContactLinks } from "@/lib/contact";
import { fadeUp, springTransition, staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function HowItWorksSection() {
  const { t } = useTranslation();
  const { config } = useSiteConfig();
  const links = buildContactLinks(config.contact);

  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden py-12 sm:py-16 lg:py-20"
    >
      <SceneBackground showOrbs={false} gridOpacity="opacity-15" />

      <Container className="relative">
        <motion.div
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          className="min-w-0 max-w-2xl"
        >
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("howItWorks.title")}
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={staggerContainer}
          className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:gap-6 lg:grid-cols-2"
        >
          <motion.article
            variants={staggerItem}
            whileHover={{ y: -4 }}
            transition={springTransition}
            className="rounded-2xl border border-border bg-card/60 p-5 shadow-elevated backdrop-blur-sm sm:p-6"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary sm:h-11 sm:w-11">
              <Calculator className="h-5 w-5" />
            </span>
            <p className="mt-4 text-xs font-medium tracking-wide text-primary">
              {t("howItWorks.estimate.step")}
            </p>
            <h3 className="mt-2 text-base font-semibold sm:text-xl">
              {t("howItWorks.estimate.title")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("howItWorks.estimate.description")}
            </p>
            <div className="mt-5">
              <MotionLinkButton
                href="#calculator"
                variant="default"
                icon={<Calculator className="h-4 w-4 shrink-0" />}
                className="w-full"
              >
                {t("howItWorks.estimate.cta")}
                <AnimatedArrow />
              </MotionLinkButton>
            </div>
          </motion.article>

          <motion.article
            variants={staggerItem}
            whileHover={{ y: -4 }}
            transition={springTransition}
            className="rounded-2xl border border-border bg-card/60 p-5 shadow-elevated backdrop-blur-sm sm:p-6"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary sm:h-11 sm:w-11">
              <MessageCircle className="h-5 w-5" />
            </span>
            <p className="mt-4 text-xs font-medium tracking-wide text-primary">
              {t("howItWorks.contact.step")}
            </p>
            <h3 className="mt-2 text-base font-semibold sm:text-xl">
              {t("howItWorks.contact.title")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("howItWorks.contact.description")}
            </p>
            <div className="mt-5 flex flex-col gap-2">
              {links.hasTelegram && (
                <motion.a
                  href={links.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "inline-flex min-h-11 w-full flex-1 items-center justify-center gap-2 rounded-lg bg-[#229ED9] px-3 py-2 text-sm font-medium leading-snug text-white shadow-lg shadow-[#229ED9]/25 transition-colors hover:bg-[#1d8bc2]",
                  )}
                >
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 whitespace-normal break-words text-center">{t("howItWorks.contact.telegram")}</span>
                </motion.a>
              )}
              {links.locationUrl && (
                <motion.a
                  href={links.locationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex min-h-11 w-full flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card/80 px-3 py-2 text-sm font-medium leading-snug text-foreground shadow-sm transition-colors hover:border-primary/30 hover:bg-card"
                >
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 whitespace-normal break-words text-center">{t("howItWorks.contact.location")}</span>
                </motion.a>
              )}
            </div>
          </motion.article>
        </motion.div>
      </Container>
    </section>
  );
}
