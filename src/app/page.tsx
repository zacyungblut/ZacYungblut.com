import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex flex-1 items-center justify-center">
        <Hero />
      </main>
      <Footer />
    </>
  );
}
