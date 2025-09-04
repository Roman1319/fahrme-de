"use client";

import SiteFooter from "@/components/SiteFooter";
import CarOfTheDay from "@/components/CarOfTheDay";
import RequireAuth from "@/components/RequireAuth";

// Данные для вчерашнего автомобиля дня
const yesterdayCar = {
  id: "yesterday",
  make: "Nissan",
  model: "GT-R",
  year: 2019,
  image: "/nissan-gtr-2019-4k-zd-3840x2400.jpg",
  description: "Der legendäre GT-R mit seinem ikonischen Design und brutaler Performance. Ein Traum für jeden Autoliebhaber.",
  votes: 1247
};

// Данные для выбора сегодняшнего автомобиля дня
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
    // Логика голосования за автомобиль дня
    console.log('Voting for car:', carId);
    // Здесь можно добавить API вызов для голосования
  };

  return (
    <RequireAuth>
      <div className="flex flex-col min-h-screen">
        <main className="container pb-12 flex-1">
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
                    <div className="text-sm opacity-70">@{p.author}</div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </main>
      </div>
    </RequireAuth>
  );
}