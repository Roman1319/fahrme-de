"use client";
import { useMemo, useState } from "react";

type Brand = { name: string; slug: string };

const ALL_BRANDS_NAMES = [
  // популярные сверху (первые 24 покажем в «свернутом»)
  "Alfa Romeo","Audi","BMW","Mercedes-Benz","Volkswagen","Porsche","Mini","Toyota","Volvo","Tesla","Škoda","Opel","Peugeot","Renault","Kia","Hyundai","Mazda","Nissan","Mitsubishi","Jaguar","Land Rover","Lexus","Seat","Subaru",
  // остальные
  "Suzuki","Honda","Citroën","Fiat","Ford","Chevrolet","Chrysler","Dacia","Jeep","Lada","Aston Martin","Bentley","Bugatti","Cadillac","Dodge","Ferrari","GMC","Hummer","Infiniti","Lamborghini","Maserati","Maybach","McLaren","Rolls-Royce","Saab","Smart","Alpine","DS Automobiles","Genesis","Isuzu","Lotus","Polestar","Proton","SsangYong","Tata","Daewoo"
];

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ä/g,"ae").replace(/ß/g,"ss")
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/^-+|-+$/g,"");
}

const POPULAR_COUNT = 24;

export default function BrandList() {
  const [expanded, setExpanded] = useState(false);

  const brands: Brand[] = useMemo(
    () => ALL_BRANDS_NAMES.map((name) => ({ name, slug: slugify(name) })),
    []
  );

  const shown = expanded ? brands : brands.slice(0, POPULAR_COUNT);

  return (
    <>
      {/* тёмная секция с много-колоночным списком */}
      <div className="section">
        <ul className="brands-list brands-cols">
          {shown.map(({ name, slug }) => (
            <li key={slug} className="break-inside-avoid">
              <a href={`/brands/${slug}`}>{name}</a>
            </li>
          ))}
        </ul>
      </div>

      {/* кнопка «Mehr anzeigen / Weniger anzeigen» */}
      <div className="section text-center">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="font-semibold"
        >
          {expanded ? "Weniger anzeigen" : "Mehr anzeigen"}
        </button>
      </div>
    </>
  );
}
