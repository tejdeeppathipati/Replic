import HeroSection from "@/components/ui/hero-section";
import { ReplicLoop } from "@/components/replic/replic-loop";
import { Personalities } from "@/components/replic/personalities";
import { Integrations } from "@/components/replic/integrations";
import { EarlyAccess } from "@/components/replic/early-access";
import { Footer } from "@/components/replic/footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <ReplicLoop />
      <Personalities />
      <Integrations />
      <EarlyAccess />
      <Footer />
    </div>
  );
}
