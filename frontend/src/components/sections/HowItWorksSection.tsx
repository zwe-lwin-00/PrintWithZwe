import { motion } from "framer-motion";
import { Calculator, Clock, ExternalLink, MessageCircle, PackageSearch, Scale } from "lucide-react";
import type { ReactNode } from "react";
import { Container } from "@/components/layout/Container";
import { SceneBackground } from "@/components/ui/SceneBackground";
import {
  AnimatedArrow,
  MotionLinkButton,
} from "@/components/ui/MotionButton";
import { useSiteConfig } from "@/context/ConfigProvider";
import { useTranslation } from "@/context/LocaleProvider";
import { buildContactLinks } from "@/lib/contact";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/motion";

const MODEL_SITES = [
  { href: "https://makerworld.com", label: "MakerWorld" },
  { href: "https://www.printables.com", label: "Printables" },
  { href: "https://www.thingiverse.com", label: "Thingiverse" },
] as const;

interface GuideStep {
  key: string;
  icon: ReactNode;
  title: string;
  body: string;
  extra?: ReactNode;
}

export function HowItWorksSection() {
  const { t } = useTranslation();
  const { config } = useSiteConfig();
  const links = buildContactLinks(config.contact);

  const steps: GuideStep[] = [
    {
      key: "find",
      icon: <PackageSearch className="h-4 w-4" />,
      title: t("howItWorks.steps.find.title"),
      body: t("howItWorks.steps.find.body"),
      extra: (
        <div className="mt-3 flex flex-wrap gap-2">
          {MODEL_SITES.map((site) => (
            <a
              key={site.href}
              href={site.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/35 hover:text-primary"
            >
              {site.label}
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          ))}
        </div>
      ),
    },
    {
      key: "measure",
      icon: <Scale className="h-4 w-4" />,
      title: t("howItWorks.steps.measure.title"),
      body: t("howItWorks.steps.measure.body"),
      extra: (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
          {t("howItWorks.steps.measure.hint")}
        </p>
      ),
    },
    {
      key: "estimate",
      icon: <Calculator className="h-4 w-4" />,
      title: t("howItWorks.steps.estimate.title"),
      body: t("howItWorks.steps.estimate.body"),
    },
    {
      key: "contact",
      icon: <MessageCircle className="h-4 w-4" />,
      title: t("howItWorks.steps.contact.title"),
      body: t("howItWorks.steps.contact.body"),
    },
  ];

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

        <motion.ol
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={staggerContainer}
          className="mt-6 space-y-3 sm:mt-8"
        >
          {steps.map((step, index) => (
            <motion.li
              key={step.key}
              variants={staggerItem}
              className="rounded-xl border border-border bg-card/60 p-4 sm:p-5"
            >
              <div className="flex gap-3 sm:gap-4">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 hidden text-primary xs:inline-flex">
                      {step.icon}
                    </span>
                    <h3 className="text-base font-semibold sm:text-lg">{step.title}</h3>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                  {step.extra}
                </div>
              </div>
            </motion.li>
          ))}
        </motion.ol>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={fadeUp}
          custom={0.15}
          className="mt-6 flex flex-col gap-2 sm:mt-8 sm:flex-row sm:items-center"
        >
          <MotionLinkButton
            href="#calculator"
            variant="default"
            icon={<Calculator className="h-4 w-4 shrink-0" />}
            className="w-full sm:w-auto"
          >
            {t("howItWorks.ctaEstimate")}
            <AnimatedArrow />
          </MotionLinkButton>
          {links.hasTelegram && (
            <a
              href={links.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium leading-snug transition-colors hover:border-primary/30 hover:bg-muted/50 sm:w-auto sm:px-6 sm:text-base"
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              {t("howItWorks.ctaContact")}
            </a>
          )}
        </motion.div>
      </Container>
    </section>
  );
}
