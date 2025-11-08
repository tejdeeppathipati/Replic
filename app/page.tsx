import HeroSection from "@/components/ui/hero-section";
import { BrandPilotLoop } from "@/components/brandpilot/brandpilot-loop";
import { Personalities } from "@/components/brandpilot/personalities";
import { Integrations } from "@/components/brandpilot/integrations";
import { EarlyAccess } from "@/components/brandpilot/early-access";
import { Footer } from "@/components/brandpilot/footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <BrandPilotLoop />
      <Personalities />
      <Integrations />
      <EarlyAccess />
      <Footer />
    </div>
  );
}
