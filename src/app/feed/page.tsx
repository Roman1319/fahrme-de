import SiteFooter from "@/components/SiteFooter";

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
  return (
    <>
      <main className="container pb-12">
        <section className="space-y-4">
          {/* Заголовок секции */}
          <div className="section"><div className="ribbon">Feed</div></div>

          {/* Витрина превью — show1..show3 (дублируем для сетки) */}
          <div className="section">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {["/show1.jpg","/show2.png","/show3.jpg","/show1.jpg","/show2.png","/show3.jpg"].map((src,i)=>(
                <div key={i} className="img-rounded aspect-[4/3] relative overflow-hidden">
                  <img src={src} alt={`show ${i+1}`} className="absolute inset-0 h-full w-full object-cover"/>
                </div>
              ))}
            </div>
          </div>

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
      <SiteFooter />
    </>
  );
}