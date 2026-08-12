export function Footer() {
  return (
    <footer className="text-ink-soft/70 flex flex-col items-center gap-3 pb-10 text-xs">
      <nav className="flex items-center gap-5">
        <a href="/support" className="hover:text-ink-soft transition-colors">
          Support
        </a>
        <a href="/privacy" className="hover:text-ink-soft transition-colors">
          Privacy Policy
        </a>
      </nav>
      <p>&copy; {new Date().getFullYear()} Zac Yungblut</p>
    </footer>
  );
}
