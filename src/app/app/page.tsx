import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Zac Yungblut",
  description: "Zac Yungblut is an indie folk artist. Get the app to hear unreleased songs first.",
};

export default function AppPage() {
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
