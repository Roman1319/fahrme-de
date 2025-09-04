export default function SiteFooter() {
  return (
    <footer className="footer-blur mt-14 w-full">
      <div className="w-full px-4 py-6">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          {/* верхняя строка */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-lg px-3 py-1.5">
                <span className="text-black text-sm font-bold">fahrme.de</span>
              </div>
              <span className="opacity-80 text-sm">© 2025 fahrme.de</span>
            </div>

            {/* официальные ссылки - десктоп */}
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <a className="footer-link" href="/about">Über uns</a>
              <a className="footer-link" href="/agb">AGB</a>
              <a className="footer-link" href="/impressum">Impressum</a>
              <a className="footer-link" href="/privacy">Datenschutz</a>
              <a className="footer-link" href="/contact">Kontakt</a>
            </nav>
          </div>

          {/* официальные ссылки - мобильная версия */}
          <nav className="flex flex-wrap items-center gap-4 text-sm md:hidden">
            <a className="footer-link" href="/about">Über uns</a>
            <a className="footer-link" href="/agb">AGB</a>
            <a className="footer-link" href="/impressum">Impressum</a>
            <a className="footer-link" href="/privacy">Datenschutz</a>
            <a className="footer-link" href="/contact">Kontakt</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
