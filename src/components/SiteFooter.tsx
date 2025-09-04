export default function SiteFooter() {
  return (
    <footer className="footer-blur mt-14">
      <div className="container py-6 flex flex-col gap-6">
        {/* верхняя строка */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="fahrme.de" className="h-7 w-auto rounded-md" />
            <span className="opacity-80">© 2025 fahrme.de</span>
          </div>

          {/* простые ссылки (можно расширить позже) */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a className="footer-link" href="/about">About</a>
            <a className="footer-link" href="/press">Press</a>
            <a className="footer-link" href="/privacy">Privacy</a>
            <a className="footer-link" href="/contact">Contact</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
