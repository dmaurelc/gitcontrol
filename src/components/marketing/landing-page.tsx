import { BenefitsGrid } from "@/components/marketing/benefits-grid";
import { CapabilitiesTabs } from "@/components/marketing/capabilities-tabs";
import { FaqList } from "@/components/marketing/faq-list";
import { FinalCtaBanner } from "@/components/marketing/final-cta-banner";
import { HeroSection } from "@/components/marketing/hero-section";
import { HowItWorksFlow } from "@/components/marketing/how-it-works-flow";
import { LandingFrame, FrameDivider } from "@/components/marketing/landing-frame";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { SecurityPrivacySection } from "@/components/marketing/security-privacy-section";

export default function LandingPage() {
  return (
    <div className="overflow-x-clip bg-background">
      <MarketingNav />
      <LandingFrame className="max-w-8xl">
        <main>
          <HeroSection />
          <FrameDivider />
          <CapabilitiesTabs />
          <FrameDivider />
          <HowItWorksFlow />
          <FrameDivider />
          <BenefitsGrid />
          <FrameDivider />
          <SecurityPrivacySection />
          <FrameDivider />
          <FaqList />
          <FrameDivider />
          <FinalCtaBanner />
        </main>
      </LandingFrame>
      <MarketingFooter />
    </div>
  );
}
