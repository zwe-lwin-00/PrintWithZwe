import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calculator, Menu, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Container } from "@/components/layout/Container";
import { useTranslation } from "@/context/LocaleProvider";
import { slideDown, staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

const navLinkKeys = [
  { href: "#services", key: "nav.services" },
  { href: "#calculator", key: "nav.calculator" },
  { href: "#gallery", key: "nav.gallery" },
  { href: "#contact", key: "nav.contact" },
] as const;

function NavLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <motion.a
      href={href}
      onClick={onClick}
      className="group relative py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      whileHover={{ y: -1 }}
    >
      {label}
      <motion.span
        className="absolute -bottom-1 left-0 h-px bg-primary"
        initial={{ width: 0 }}
        whileHover={{ width: "100%" }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.a>
  );
}

export function Navbar() {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleNavClick = () => setMobileOpen(false);

  return (
    <motion.header
      initial="hidden"
      animate="visible"
      variants={slideDown}
      className={cn(
        "fixed inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top,0px)] transition-[background-color,border-color,box-shadow] duration-300",
        scrolled
          ? "border-b border-border/60 bg-background/85 shadow-elevated backdrop-blur-md"
          : "bg-transparent",
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-2 sm:gap-3">
        <motion.a
          href="#"
          className="inline-flex min-w-0 shrink items-center gap-2 font-semibold text-foreground"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.span
            whileHover={{ rotate: 12 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary"
          >
            <Printer className="h-4 w-4" />
          </motion.span>
          <span className="truncate text-sm sm:text-base">{t("brand.name")}</span>
        </motion.a>

        <nav className="hidden items-center gap-6 md:flex lg:gap-8">
          {navLinkKeys.map(({ href, key }) => (
            <NavLink key={href} href={href} label={t(key)} />
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <LanguageToggle compact className="md:hidden" />
          <ThemeToggle compact className="md:hidden" />

          <LanguageToggle className="hidden md:inline-flex" />
          <ThemeToggle className="hidden md:inline-flex" />

          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="hidden md:block"
          >
            <a
              href="#calculator"
              className="inline-flex h-11 min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90 dark:shadow-primary/20"
            >
              <Calculator className="h-4 w-4" />
              {t("nav.estimatePrice")}
            </a>
          </motion.div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={mobileOpen}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={mobileOpen ? "close" : "menu"}
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
                className="inline-flex"
              >
                {mobileOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </motion.span>
            </AnimatePresence>
          </Button>
        </div>
      </Container>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-b border-border bg-background/95 backdrop-blur-md md:hidden"
          >
            <Container className="max-h-[calc(100dvh-4rem-env(safe-area-inset-top,0px))] overflow-y-auto py-4">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="flex flex-col gap-1"
              >
                {navLinkKeys.map(({ href, key }) => (
                  <motion.a
                    key={href}
                    href={href}
                    onClick={handleNavClick}
                    variants={staggerItem}
                    whileTap={{ scale: 0.98 }}
                    className="block rounded-lg px-3 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                  >
                    {t(key)}
                  </motion.a>
                ))}
                <motion.div variants={staggerItem} className="mt-3 space-y-3">
                  <LanguageToggle className="w-full justify-center" />
                  <ThemeToggle className="w-full justify-center" />
                  <a
                    href="#calculator"
                    onClick={handleNavClick}
                    className="inline-flex h-12 min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 text-base font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90"
                  >
                    <Calculator className="h-4 w-4" />
                    {t("nav.estimatePrice")}
                  </a>
                </motion.div>
              </motion.div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
