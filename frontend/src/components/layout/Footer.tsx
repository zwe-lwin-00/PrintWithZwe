import { motion } from "framer-motion";
import { MessageCircle, Phone } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { ContactButtons } from "@/components/ui/ContactButtons";
import { useSiteConfig } from "@/context/ConfigProvider";
import { useTranslation } from "@/context/LocaleProvider";
import { buildContactLinks } from "@/lib/contact";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/motion";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M14 8h2V5h-2c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.2l.8-3H13V9c0-.6.4-1 1-1z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M16.5 4.2c.8 1.5 2.2 2.6 3.9 3V10c-1.5-.1-2.9-.6-4.1-1.5v5.7c0 3.2-2.6 5.8-5.8 5.8S4.7 17.4 4.7 14.2c0-3 2.3-5.5 5.2-5.8v3.1c-1.3.3-2.2 1.4-2.2 2.7 0 1.6 1.3 2.8 2.8 2.8s2.8-1.3 2.8-2.8V4.2h3.2z" />
    </svg>
  );
}

const footerLinkKeys = [
  { href: "#how-it-works", key: "nav.howItWorks" },
  { href: "#calculator", key: "nav.calculator" },
  { href: "#shop", key: "nav.shop" },
  { href: "#contact", key: "nav.contact" },
] as const;

export function Footer() {
  const { config } = useSiteConfig();
  const { contact } = config;
  const { t } = useTranslation();
  const links = buildContactLinks(contact);
  const year = new Date().getFullYear();
  const brandName = t("brand.name");

  return (
    <footer
      id="contact"
      className="border-t border-border bg-card/30 pb-[calc(var(--mobile-contact-bar-height)+env(safe-area-inset-bottom,0px))] md:pb-0"
    >
      <Container className="py-10 sm:py-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer}
          className="flex flex-col gap-8"
        >
          <motion.div
            variants={staggerItem}
            className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6"
          >
            <p className="text-sm font-medium text-foreground">{t("contact.title")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("contact.subtitle")}</p>
            <div className="mt-4 hidden sm:block">
              <ContactButtons layout="row" size="lg" className="max-w-md" />
            </div>
          </motion.div>

          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <motion.div variants={staggerItem} className="max-w-sm">
              <motion.div
                whileHover={{ x: 2 }}
                className="inline-flex items-center gap-2 font-semibold"
              >
                <img
                  src="/brand/logo-mark.png"
                  alt=""
                  width={36}
                  height={36}
                  className="h-9 w-9 shrink-0 object-contain"
                />
                {brandName}
              </motion.div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {t("brand.footerBlurb", { name: brandName })}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-8 xs:grid-cols-2 sm:gap-12 md:gap-16">
              <motion.div variants={staggerItem}>
                <p className="text-sm font-medium">{t("footer.navigate")}</p>
                <ul className="mt-3 space-y-2.5">
                  {footerLinkKeys.map(({ href, key }) => (
                    <li key={href}>
                      <motion.a
                        href={href}
                        whileHover={{ x: 4, color: "hsl(var(--foreground))" }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="inline-block py-2 text-sm text-muted-foreground sm:py-0.5"
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
                  {links.hasPhone && (
                    <li>
                      <motion.a
                        href={links.phoneTel}
                        whileHover={{ x: 4, color: "hsl(var(--primary))" }}
                        className="inline-flex items-center gap-2 py-0.5"
                      >
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        {links.phoneDisplay}
                      </motion.a>
                    </li>
                  )}
                  {links.hasTelegram && (
                    <li>
                      <motion.a
                        href={links.telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ x: 4, color: "hsl(var(--primary))" }}
                        className="inline-flex items-center gap-2 py-0.5"
                      >
                        <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                        {links.telegramDisplay}
                      </motion.a>
                    </li>
                  )}
                  {links.hasTiktok && (
                    <li>
                      <motion.a
                        href={links.tiktok}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ x: 4, color: "hsl(var(--primary))" }}
                        className="inline-flex items-center gap-2 py-0.5"
                      >
                        <TikTokIcon className="h-3.5 w-3.5 shrink-0" />
                        {links.tiktokDisplay}
                      </motion.a>
                    </li>
                  )}
                  {links.hasFacebook && (
                    <li>
                      <motion.a
                        href={links.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ x: 4, color: "hsl(var(--primary))" }}
                        className="inline-flex items-center gap-2 py-0.5"
                      >
                        <FacebookIcon className="h-3.5 w-3.5 shrink-0" />
                        {t("footer.facebook")}
                      </motion.a>
                    </li>
                  )}
                </ul>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0.2}
          className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground sm:mt-10 md:pb-0"
        >
          {t("footer.copyright", { year, name: brandName })}
        </motion.p>
      </Container>
    </footer>
  );
}
