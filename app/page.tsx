import { CTA, Footer, Hero, Navbar, Services, StatsBanner } from "@/constants";

export default function WellTrackLanding() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Services />
      <StatsBanner />
      <CTA />
      <Footer />
    </div>
  );
}
