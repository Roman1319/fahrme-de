"use client";

import SiteFooter from "@/components/SiteFooter";
import CarOfTheDay from "@/components/CarOfTheDay";
import RequireAuth from "@/components/RequireAuth";

// Daten für das gestrige Auto des Tages
const yesterdayCar = {
  id: "yesterday",
  make: "Nissan",
  model: "GT-R",
  year: 2019,
  image: "/nissan-gtr-2019-4k-zd-3840x2400.jpg",
  description: "Der legendäre GT-R mit seinem ikonischen Design und brutaler Performance. Ein Traum für jeden Autoliebhaber.",
  votes: 1247
};

// Daten für die Auswahl des heutigen Autos des Tages
const todayCars = [
  { id: "1", make: "BMW", model: "M3", image: "/bmw-g20.jpg" },
  { id: "2", make: "Audi", model: "A4", image: "/a4-b9.jpg" },
  { id: "3", make: "Mini", model: "Cooper S", image: "/mini-r56.jpg" },
  { id: "4", make: "BMW", model: "M3", image: "/bmw-g20.jpg" },
  { id: "5", make: "Audi", model: "A4", image: "/a4-b9.jpg" },
  { id: "6", make: "Mini", model: "Cooper S", image: "/mini-r56.jpg" },
  { id: "7", make: "BMW", model: "M3", image: "/bmw-g20.jpg" },
  { id: "8", make: "Audi", model: "A4", image: "/a4-b9.jpg" }
];

const posts = [
  {
    id: "1",
    title: "BMW 3er G20: 4 Jahre Fahrspaß und Emotionen",
    cover: "/bmw-g20.jpg",
    excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
    author: "pussyhunter2005", stats: {likes:6, comments:4, saves:1}
  },
  {
    id: "2",
    title: "Mini Cooper S R56: Kompakt, kultig, charakterstark",
    cover: "/mini-r56.jpg",
    excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
    author: "faberxastell", stats: {likes:237, comments:16, saves:54}
  },
  {
    id: "3",
    title: "Audi A4 B9: Drei Nächte in der Garage",
    cover: "/a4-b9.jpg",
    excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
    author: "dikiyguretz", stats: {likes:8, comments:2, saves:4}
  },
];

export default function FeedPage(){
  const handleVote = (carId: string) => {
    // Logik für die Abstimmung über das Auto des Tages
    console.log('Voting for car:', carId);
    // Hier kann ein API-Aufruf für die Abstimmung hinzugefügt werden
  };

  return (
    <RequireAuth>
      <main className="pb-12">
        <section className="space-y-4">
          {/* Автомобиль дня - главный раздел */}
          <CarOfTheDay 
            yesterdayCar={yesterdayCar} 
            todayCars={todayCars} 
            onVote={handleVote} 
          />

          {/* Лента постов */}
          {posts.map(p=>(
            <article key={p.id} className="section grid grid-cols-[80px_1fr] gap-3">
              {/* мини-обложка слева */}
              <div className="img-rounded w-[80px] h-[100px] relative overflow-hidden">
                <img src={p.cover} alt="" className="absolute inset-0 h-full w-full object-cover"/>
              </div>
              {/* контент */}
              <div className="space-y-2">
                <h3 className="text-lg md:text-xl font-extrabold leading-tight">{p.title}</h3>
                <div className="img-rounded aspect-[16/9] relative overflow-hidden">
                  <img src={p.cover} alt={p.title} className="absolute inset-0 h-full w-full object-cover"/>
                </div>
                <p className="opacity-80">{p.excerpt}</p>
                <div className="flex items-center justify-between">
                  <a href={`/post/${p.id}`} className="btn-primary">Weiterlesen →</a>
                  <div className="flex items-center gap-4 text-sm opacity-70">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                      <span>{p.stats.likes} Likes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>{p.stats.comments} Kommentare</span>
                    </div>
                    <div className="bg-accent text-black px-2 py-1 rounded-full text-xs font-medium">
                      @{p.author}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
    </RequireAuth>
  );
}