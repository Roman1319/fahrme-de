import BrandList from "@/components/BrandList";
import SiteFooter from "@/components/SiteFooter";
import RedirectIfAuthed from "@/components/RedirectIfAuthed";
import { ArrowRight } from "lucide-react";

export default function WelcomePage() {
  return (
    <>
      {/* если есть сессия — сразу уедем на /feed */}
      <RedirectIfAuthed />

      <main className="container grid gap-3 pb-6">
        <section className="space-y-3">
          {/* HERO */}
          <div className="grid md:grid-cols-2 gap-3">
            <div className="section bg-brand">
              <h1>Echte Erfahrungen<br/>für Deine Auto-Fragen</h1>
              <p className="mt-2 text-white/90 text-sm">
                Suche nach Marken, Modellen oder Schlagworten – und finde genau das, was Dir weiterhilft.
              </p>
              <div className="mt-2 flex gap-2">
                <input
                  className="flex-1 rounded-full bg-white/20 text-white placeholder:text-white/70 px-3 py-2 text-sm outline-none"
                  placeholder="Ölwechsel selber machen beim BMW 3er"
                />
                <a href="/explore" className="btn-primary">Antwort finden ↗</a>
              </div>
            </div>

            <div className="section img-rounded min-h-[150px] md:min-h-[180px] relative overflow-hidden">
              <img src="/hero-car.jpg" alt="Hero" className="absolute inset-0 h-full w-full object-cover"/>
            </div>
          </div>

          {/* ====== ВЫБОР МАРКИ (как на твоём скрине) ====== */}
          {/* верхняя светлая панель с фото справа */}
          <div className="panel-light p-3 flex items-center justify-between gap-3">
            <h3 className="text-xl md:text-2xl font-extrabold leading-tight">
              Wähle Deine Automarke
            </h3>
            <div className="hidden sm:block w-40 h-16 rounded-lg overflow-hidden">
              <img src="/story3.png" alt="" className="h-full w-full object-cover"/>
            </div>
          </div>

          {/* нижняя тёмная секция — список брендов + «Mehr anzeigen» */}
          <BrandList />

          {/* ===== Community–Stories ===== */}
          <div className="text-center mt-3">
            <h2 className="h2">Community–Stories</h2>
            <p className="opacity-70 mt-1 text-xs">
              Echte Geschichten aus der Community – von Reparaturen bis Tuning
            </p>
          </div>

          <div className="grid gap-2 md:grid-cols-3 auto-rows-[120px] md:auto-rows-[150px]">
            {/* большой слева (занимает 2 колонки, 1 ряд) */}
            <div className="media-tile md:col-span-2 md:row-span-1 h-[120px] md:h-auto">
              <img src="/story1.jpg" alt="Story 1" />
            </div>

            {/* высокий справа (занимает 1 колонку, 2 ряда) */}
            <div className="media-tile md:col-span-1 md:row-span-2 h-[260px] md:h-auto">
              <img src="/story3.png" alt="Story 2" />
            </div>

            {/* два нижних слева */}
            <div className="media-tile">
              <img src="/show1.jpg" alt="Story 3" />
            </div>
            <div className="media-tile">
              <img src="/show2.png" alt="Story 4" />
            </div>
          </div>

          {/* CTA справа снизу */}
          <div className="flex justify-end">
            <a href="/explore" className="btn-primary inline-flex items-center gap-2 mt-2">
              Alle Auto-Logbücher ansehen
              <span className="rounded-full bg-white/20 p-1">
                <ArrowRight size={16} />
              </span>
            </a>
          </div>
          {/* ===== /Community–Stories ===== */}
        </section>
      </main>

      <SiteFooter />
    </>
  );
}