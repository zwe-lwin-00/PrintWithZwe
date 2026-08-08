import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { MobileContactBar } from "@/components/ui/ContactButtons";
import { GallerySection } from "@/components/sections/GallerySection";
import { HeroSection } from "@/components/sections/HeroSection";
import { PriceCalculatorSection } from "@/components/sections/PriceCalculatorSection";
import { ServicesSection } from "@/components/sections/ServicesSection";

function App() {
  return (
    <>
      <Navbar />
      <main className="min-w-0 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        <HeroSection />
        <ServicesSection />
        <PriceCalculatorSection />
        <GallerySection />
      </main>
      <Footer />
      <MobileContactBar />
    </>
  );
}

export default App;
