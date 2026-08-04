import { motion } from "framer-motion";
import { Printer } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { useSiteConfig } from "@/context/ConfigProvider";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/motion";

const footerLinks = [
  { href: "#services", label: "Services" },
  { href: "#calculator", label: "Calculator" },
  { href: "#gallery", label: "Gallery" },
  { href: "#contact", label: "Contact" },
];

export function Footer() {
  const { config } = useSiteConfig();
  const { contact, brand } = config;
  const year = new Date().getFullYear();

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
              {brand.name}
            </motion.div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {brand.name} — custom 3D printing and rapid prototyping with
              precision engineering meets creative fabrication.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-8 sm:gap-12 md:gap-16">
            <motion.div variants={staggerItem}>
              <p className="text-sm font-medium">Navigate</p>
              <ul className="mt-3 space-y-2.5">
                {footerLinks.map(({ href, label }) => (
                  <li key={href}>
                    <motion.a
                      href={href}
                      whileHover={{ x: 4, color: "hsl(var(--foreground))" }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="inline-block py-0.5 text-sm text-muted-foreground"
                    >
                      {label}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div variants={staggerItem}>
              <p className="text-sm font-medium">Reach us</p>
              <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <motion.a
                    href={`https://t.me/${contact.telegramUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ x: 4, color: "hsl(var(--primary))" }}
                    className="inline-block py-0.5"
                  >
                    Telegram
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
                      WhatsApp
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
          © {year} Print with Zwe. All rights reserved.
        </motion.p>
      </Container>
    </footer>
  );
}
