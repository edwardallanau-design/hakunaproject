import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { StatsBar } from "@/components/StatsBar";
import { Progression } from "@/components/Progression";
import { About } from "@/components/About";
import { Officers } from "@/components/Officers";
import { Recruitment } from "@/components/Recruitment";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <StatsBar />
        <Progression />
        <About />
        <Officers />
        <Recruitment />
      </main>
      <Footer />
    </>
  );
}
