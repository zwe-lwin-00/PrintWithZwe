import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { MobileContactBar } from "@/components/ui/ContactButtons";
import { HeroSection } from "@/components/sections/HeroSection";
import { PriceCalculatorSection } from "@/components/sections/PriceCalculatorSection";
import { ProductCatalogSection } from "@/components/sections/ProductCatalogSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { useTranslation } from "@/context/LocaleProvider";

export function HomePage() {
  const { t } = useTranslation();

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        {t("a11y.skipToContent")}
      </a>
      <Navbar />
      <main
        id="main-content"
        className="min-w-0 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0"
      >
        <HeroSection />
        <ServicesSection />
        <ProductCatalogSection />
        <PriceCalculatorSection />
      </main>
      <Footer />
      <MobileContactBar />
    </>
  );
}
