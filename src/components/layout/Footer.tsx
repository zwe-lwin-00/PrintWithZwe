import { motion } from "framer-motion";
import { Printer } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { useSiteConfig } from "@/context/ConfigProvider";
import { useTranslation } from "@/context/LocaleProvider";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/motion";

const footerLinkKeys = [
  { href: "#services", key: "nav.services" },
  { href: "#calculator", key: "nav.calculator" },
  { href: "#gallery", key: "nav.gallery" },
  { href: "#contact", key: "nav.contact" },
] as const;

export function Footer() {
  const { config } = useSiteConfig();
  const { contact } = config;
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  const brandName = t("brand.name");

  return (
    <footer
      id="contact"
      className="border-t border-border bg-card/30 pb-[env(safe-area-inset-bottom,0px)]"
    >
      <Container className="py-10 sm:py-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer}
          className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between"
        >
          <motion.div variants={staggerItem} className="max-w-sm">
            <motion.div
              whileHover={{ x: 2 }}
              className="inline-flex items-center gap-2 font-semibold"
            >
              <motion.span
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary"
              >
                <Printer className="h-4 w-4" />
              </motion.span>
              {brandName}
            </motion.div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t("brand.footerBlurb", { name: brandName })}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-8 sm:gap-12 md:gap-16">
            <motion.div variants={staggerItem}>
              <p className="text-sm font-medium">{t("footer.navigate")}</p>
              <ul className="mt-3 space-y-2.5">
                {footerLinkKeys.map(({ href, key }) => (
                  <li key={href}>
                    <motion.a
                      href={href}
                      whileHover={{ x: 4, color: "hsl(var(--foreground))" }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="inline-block py-0.5 text-sm text-muted-foreground"
                    >
                      {t(key)}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div variants={staggerItem}>
              <p className="text-sm font-medium">{t("footer.reachUs")}</p>
              <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <motion.a
                    href={`https://t.me/${contact.telegramUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ x: 4, color: "hsl(var(--primary))" }}
                    className="inline-block py-0.5"
                  >
                    {t("footer.telegram")}
                  </motion.a>
                </li>
                {contact.whatsappNumber && (
                  <li>
                    <motion.a
                      href={`https://wa.me/${contact.whatsappNumber.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ x: 4, color: "hsl(var(--primary))" }}
                      className="inline-block py-0.5"
                    >
                      {t("footer.whatsapp")}
                    </motion.a>
                  </li>
                )}
              </ul>
            </motion.div>
          </div>
        </motion.div>

        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0.2}
          className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground sm:mt-10"
        >
          {t("footer.copyright", { year, name: brandName })}
        </motion.p>
      </Container>
    </footer>
  );
}
