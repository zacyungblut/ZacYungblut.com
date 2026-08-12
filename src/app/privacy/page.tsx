import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy — Zac Yungblut",
  description: "Privacy policy for the Zac Yungblut app.",
};

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main className="flex flex-1 justify-center">
        <article className="mx-auto w-full max-w-xl px-6 pt-6 pb-24">
          <h1 className="font-display text-ink text-[32px] uppercase sm:text-[40px]">
            Privacy Policy
          </h1>
          <p className="text-ink-soft/70 mt-2 text-xs tracking-wide">
            Last updated: July 28, 2026
          </p>

          <p className="text-ink-soft mt-6 text-[15px] leading-relaxed">
            The app has no sign-up, no email, and no password — it recognizes your device, not
            you. This page explains exactly what that means: what gets stored, what other fans
            can see, and what you can ask us to delete.
          </p>

          <section className="border-ink/10 mt-10 border-t pt-8">
            <h2 className="font-display text-ink text-lg uppercase">What we collect</h2>
            <p className="text-ink-soft mt-3 text-[15px] leading-relaxed">
              When you first open the app, it creates an anonymous identity for your device — a
              random ID with nothing attached to it. From there, we store:
            </p>
            <ul className="text-ink-soft mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed">
              <li>
                <strong className="text-ink">Your device identity.</strong> A random identifier,
                generated on first launch, used to keep your favorites, listening history, and
                comments consistent across sessions on that device. It contains no personal
                information on its own.
              </li>
              <li>
                <strong className="text-ink">Anything you choose to add.</strong> A display name,
                a username, and a profile photo, if you decide to set them. None of this is
                required — you can use the whole app as &ldquo;Anonymous.&rdquo;
              </li>
              <li>
                <strong className="text-ink">What you listen to.</strong> Which songs you play and
                how often, so the app can show your own listening stats and power the in-app
                charts that decide which song is closest to release.
              </li>
              <li>
                <strong className="text-ink">Comments you post.</strong> Whatever you write under a
                song, attached to your username (or &ldquo;Anonymous&rdquo;).
              </li>
            </ul>
            <p className="text-ink-soft mt-3 text-[15px] leading-relaxed">
              Our backend infrastructure provider (Supabase) processes standard technical data —
              like IP address and request timestamps — as part of running any web service. We
              don&rsquo;t access this for profiling and don&rsquo;t combine it with your listening
              activity.
            </p>
          </section>

          <section className="border-ink/10 mt-8 border-t pt-8">
            <h2 className="font-display text-ink text-lg uppercase">What&rsquo;s public vs. private</h2>
            <p className="text-ink-soft mt-3 text-[15px] leading-relaxed">
              Worth being direct about, since it&rsquo;s easy to assume everything in an app is
              private:
            </p>
            <ul className="text-ink-soft mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed">
              <li>
                <strong className="text-ink">Public:</strong> your display name, username, profile
                photo, and comments are visible to every fan using the app. So is the total,
                combined play count on each song.
              </li>
              <li>
                <strong className="text-ink">Private:</strong> which specific songs you personally
                played, and how many times, is never shown to other fans — only to you, on your
                own profile.
              </li>
            </ul>
          </section>

          <section className="border-ink/10 mt-8 border-t pt-8">
            <h2 className="font-display text-ink text-lg uppercase">How we use it</h2>
            <p className="text-ink-soft mt-3 text-[15px] leading-relaxed">
              Strictly to run the app: the song feed, the charts, your listening history, your
              profile, and comments. We don&rsquo;t sell data, and we don&rsquo;t run ads or
              third-party analytics or ad-tracking SDKs of any kind.
            </p>
          </section>

          <section className="border-ink/10 mt-8 border-t pt-8">
            <h2 className="font-display text-ink text-lg uppercase">Where it&rsquo;s stored</h2>
            <p className="text-ink-soft mt-3 text-[15px] leading-relaxed">
              Data lives in Supabase, a hosted Postgres database and file storage provider,
              encrypted in transit. Access is restricted at the database level so that, for
              example, one fan&rsquo;s private listening history is never readable by another fan
              or by the app&rsquo;s public-facing views — only aggregated, anonymous totals are.
            </p>
          </section>

          <section className="border-ink/10 mt-8 border-t pt-8">
            <h2 className="font-display text-ink text-lg uppercase">Deleting your data</h2>
            <p className="text-ink-soft mt-3 text-[15px] leading-relaxed">
              Because there&rsquo;s no account, email, or password behind your identity,
              uninstalling the app or clearing its storage effectively abandons it — we have no
              way to link it back to you afterward. If you&rsquo;d like your device&rsquo;s data
              (comments, profile info, listening history) fully deleted before that, or have any
              other privacy question, just ask.
            </p>
            <p className="border-ink/10 bg-ink/3 text-ink-soft mt-4 rounded-lg border px-5 py-4 text-sm">
              <strong className="text-ink">Contact:</strong>{" "}
              <a href="mailto:zacyungblut@gmail.com" className="text-orange-deep hover:underline">
                zacyungblut@gmail.com
              </a>
            </p>
          </section>

          <section className="border-ink/10 mt-8 border-t pt-8">
            <h2 className="font-display text-ink text-lg uppercase">Children&rsquo;s privacy</h2>
            <p className="text-ink-soft mt-3 text-[15px] leading-relaxed">
              This app is not directed at children under 13, and we don&rsquo;t knowingly collect
              information from them. If you believe a child has used the app and provided personal
              information, contact us using the email above and we&rsquo;ll remove it.
            </p>
          </section>

          <section className="border-ink/10 mt-8 border-t border-b pt-8 pb-8">
            <h2 className="font-display text-ink text-lg uppercase">Changes to this policy</h2>
            <p className="text-ink-soft mt-3 text-[15px] leading-relaxed">
              If this policy changes, we&rsquo;ll update the date at the top of this page.
              Continuing to use the app after a change means you accept the updated policy.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
