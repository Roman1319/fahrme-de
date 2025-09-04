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

            {/* простые ссылки (можно расширить позже) */}
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <a className="footer-link" href="/about">About</a>
              <a className="footer-link" href="/press">Press</a>
              <a className="footer-link" href="/privacy">Privacy</a>
              <a className="footer-link" href="/contact">Contact</a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
