import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Support — Zac Yungblut",
  description: "Support, contact, and frequently asked questions for the Zac Yungblut app.",
};

const FAQS = [
  {
    q: "Why isn't there a sign-up screen?",
    a: "There isn't one on purpose. The app recognizes your device the moment you open it — no email, no password. You're “Anonymous” until you optionally add a name and photo from the Profile tab.",
  },
  {
    q: "How does Charts / “plays decide next” work?",
    a: "Every song's play count is public and adds up across every fan. The Charts tab ranks songs by total plays — the one in the lead is closest to actually being released. Once it's really released, it's marked “retired” and its play count freezes forever.",
  },
  {
    q: "A song disappeared from the feed — where did it go?",
    a: "Retired songs (already released for real) move to the Charts tab's “Retired” section instead of the main feed. You can still open them, see your personal play count from before it dropped, and play them anytime.",
  },
  {
    q: "How do I set or change my username and photo?",
    a: "Profile tab → tap the pencil next to your name. You can set a display name, a username, and a profile photo, or leave it all blank and stay Anonymous.",
  },
  {
    q: "Can I get my data deleted?",
    a: "Yes — email the address below and we'll delete your device's data (profile info and listening history). See the Privacy Policy for details on what's stored.",
  },
  {
    q: "I found a bug, or the app crashed.",
    a: "Email a quick description of what happened (and your device model/iOS version if you have it) to the address below.",
  },
];

export default function SupportPage() {
  return (
    <>
      <Nav />
      <main className="flex flex-1 justify-center">
        <article className="mx-auto w-full max-w-xl px-6 pt-6 pb-24">
          <h1 className="font-display text-ink text-[32px] uppercase sm:text-[40px]">Support</h1>
          <p className="text-ink-soft mt-4 text-[15px] leading-relaxed">
            Questions, bug reports, or anything else about the app — this is the place, and a real
            person reads every message.
          </p>

          <a
            href="mailto:zacyungblut@gmail.com"
            className="border-ink/10 bg-ink/3 mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border px-6 py-5 transition-colors hover:bg-ink/5"
          >
            <span>
              <span className="text-ink-soft/70 block text-xs tracking-wide uppercase">Email</span>
              <span className="text-ink mt-1 block text-lg">zacyungblut@gmail.com</span>
            </span>
            <span className="bg-ink inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold whitespace-nowrap text-white">
              Send a message
            </span>
          </a>

          <h2 className="text-ink-soft/70 mt-12 text-xs tracking-wide uppercase">
            Common questions
          </h2>

          <div className="mt-4">
            {FAQS.map((item) => (
              <details key={item.q} className="border-ink/10 border-t py-5 last:border-b">
                <summary className="text-ink flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span className="text-orange-deep shrink-0 text-xl" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="text-ink-soft mt-3 text-[15px] leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
