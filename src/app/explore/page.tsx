export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Alle Auto-Logbücher ansehen
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Entdecke die faszinierende Welt der Auto-Logbücher unserer Community. 
            Hier findest du alle öffentlichen Logbücher und kannst dich von den 
            Geschichten und Erfahrungen anderer Autofans inspirieren lassen.
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-xl font-semibold mb-3">Verschiedene Marken</h3>
            <p className="text-muted-foreground">
              Von BMW über Mercedes bis hin zu exotischen Marken - 
              entdecke Logbücher aller Automarken.
            </p>
          </div>
          
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-xl font-semibold mb-3">Modellvielfalt</h3>
            <p className="text-muted-foreground">
              Klassiker, Sportwagen, Alltagsautos - 
              finde Logbücher zu deinem Lieblingsmodell.
            </p>
          </div>
          
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-xl font-semibold mb-3">Community</h3>
            <p className="text-muted-foreground">
              Tausche dich mit anderen Autofans aus und 
              teile deine eigenen Erfahrungen.
            </p>
          </div>
        </div>
        
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Möchtest du dein eigenes Auto-Logbuch erstellen?
          </p>
          <a 
            href="/register" 
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Jetzt registrieren
          </a>
        </div>
      </div>
    </div>
  );
}
