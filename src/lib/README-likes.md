# Like-System für fahrme.de

Ein vollständiges Frontend-only Like-System mit localStorage und in-memory Fallback, das wie Instagram/Facebook funktioniert.

## 🚀 Features

### Kernfunktionen
- ✅ **Optimistisches UI**: Sofortige visuelle Reaktion beim Klicken
- ✅ **Rate Limiting**: Maximal 30 Likes pro Minute pro Benutzer
- ✅ **Anti-Double-Click**: Schutz vor mehrfachen Klicks
- ✅ **Cross-tab Synchronisation**: Änderungen werden zwischen Browser-Tabs synchronisiert
- ✅ **localStorage + in-memory Fallback**: Funktioniert auch bei deaktiviertem localStorage
- ✅ **Idempotenz**: Mehrfache Aktionen haben keine unerwünschten Effekte

### UI/UX
- ✅ **Verschiedene Größen**: sm, md, lg
- ✅ **Verschiedene Varianten**: default, minimal, outline
- ✅ **Accessibility (a11y)**: ARIA-Labels, Keyboard-Navigation, Focus-Styles
- ✅ **Guest-Mode**: Login-Prompt für nicht angemeldete Benutzer
- ✅ **Responsive Design**: Funktioniert auf allen Bildschirmgrößen

## 📁 Dateien

### Core Service
- `src/lib/likes.ts` - Hauptservice mit allen Like-Operationen
- `src/components/ui/LikeButton.tsx` - React-Komponente für Like-Buttons

### Integration
- `src/app/car/[id]/page.tsx` - Like-Buttons in Car-Detail-Seite
- `src/app/feed/page.tsx` - Like-Buttons in Feed-Posts
- `src/components/CarOfTheDay.tsx` - Like-Buttons für "Auto des Tages"
- `src/components/ui/CommentBlock.tsx` - Like-Buttons für Kommentare

### Demo
- `src/app/likes-demo/page.tsx` - Demo-Seite zum Testen aller Features

## 🔧 Verwendung

### Grundlegende Verwendung

```tsx
import LikeButton from '@/components/ui/LikeButton';

// Einfacher Like-Button
<LikeButton
  targetType="CAR"
  targetId="car-123"
  size="md"
  variant="default"
  onLikeChange={(liked, count) => {
    console.log('Like status:', liked, 'Count:', count);
  }}
/>
```

### Verschiedene Varianten

```tsx
// Kompakter Button (ohne Count)
<LikeButtonCompact
  targetType="POST"
  targetId="post-456"
/>

// Großer Button (prominent)
<LikeButtonLarge
  targetType="COMMENT"
  targetId="comment-789"
/>

// Minimaler Button
<LikeButton
  targetType="ALBUM"
  targetId="album-101"
  variant="minimal"
  size="sm"
/>
```

### Service direkt verwenden

```tsx
import { likeService } from '@/lib/likes';

// Status abrufen
const status = likeService.getStatus('user@example.com', 'CAR', 'car-123');
console.log(status); // { liked: false, likeCount: 5 }

// Like setzen
const newStatus = likeService.like('user@example.com', 'CAR', 'car-123');
console.log(newStatus); // { liked: true, likeCount: 6 }

// Like entfernen
const finalStatus = likeService.unlike('user@example.com', 'CAR', 'car-123');
console.log(finalStatus); // { liked: false, likeCount: 5 }

// Toggle
const toggledStatus = likeService.toggle('user@example.com', 'CAR', 'car-123');
```

## 🎯 Target Types

Das System unterstützt verschiedene Zieltypen:

- `CAR` - Fahrzeuge
- `POST` - Beiträge/Posts
- `COMMENT` - Kommentare
- `ALBUM` - Alben (vorbereitet für zukünftige Nutzung)

## 🔑 Eindeutige Schlüssel

Jeder Like wird durch einen eindeutigen Schlüssel identifiziert:
```
Format: userId:targetType:targetId
Beispiel: "user@example.com:CAR:car-123"
```

## 💾 Datenspeicherung

### localStorage (Primär)
- `fahrme:likes:set` - Set aller Like-Schlüssel
- `fahrme:likes:counters` - Lokale Zähler pro Ziel

### In-Memory Fallback
- Wird automatisch verwendet, wenn localStorage nicht verfügbar ist
- Funktioniert nur für die aktuelle Browser-Session

## 🔄 Cross-tab Synchronisation

Das System verwendet `storage` Events, um Änderungen zwischen Browser-Tabs zu synchronisieren:

```tsx
// Automatisch in useLikes Hook implementiert
useEffect(() => {
  const handleStorageChange = () => {
    // UI wird automatisch aktualisiert
  };
  
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);
```

## 🚦 Rate Limiting

- **Limit**: 30 Likes pro Minute pro Benutzer
- **Fenster**: 60 Sekunden rolling window
- **Verhalten**: Überschreitungen werden still ignoriert

## ♿ Accessibility

Alle Like-Buttons sind vollständig zugänglich:

```tsx
<button
  aria-pressed={liked}
  aria-label={liked ? 'Like entfernen' : 'Like hinzufügen'}
  title={liked ? 'Like entfernen' : 'Like hinzufügen'}
  onKeyDown={handleKeyDown} // Enter/Space Support
>
```

## 🧪 Testing

Besuche `/likes-demo` um alle Features zu testen:

- Verschiedene Button-Varianten
- Cross-tab Synchronisation
- Rate Limiting
- Guest-Mode
- Daten löschen und zurücksetzen

## 🔮 Migration zu Backend

Das System ist so designed, dass es einfach auf ein Backend migriert werden kann:

1. **Service-Abstraktion**: Alle Logik ist in `likeService` gekapselt
2. **Gleiche API**: Backend-Implementierung würde dieselben Methoden verwenden
3. **UI unverändert**: Komponenten müssen nicht geändert werden

### Beispiel Backend-Integration

```tsx
// Neue Backend-Implementierung
class BackendLikeService {
  async getStatus(userId: string, targetType: string, targetId: string) {
    const response = await fetch(`/api/likes/${userId}/${targetType}/${targetId}`);
    return response.json();
  }
  
  async like(userId: string, targetType: string, targetId: string) {
    const response = await fetch('/api/likes', {
      method: 'POST',
      body: JSON.stringify({ userId, targetType, targetId })
    });
    return response.json();
  }
  
  // ... weitere Methoden
}

// Service austauschen
export const likeService = new BackendLikeService();
```

## 📊 Performance

- **Optimistisches UI**: Sofortige Reaktion ohne Warten auf Server
- **Lokale Zähler**: Keine Server-Anfragen für Counts
- **Efficient Storage**: Nur notwendige Daten werden gespeichert
- **Memory Fallback**: Funktioniert auch bei Speicher-Problemen

## 🐛 Fehlerbehandlung

- **localStorage Fehler**: Automatischer Wechsel zu in-memory
- **Rate Limit**: Stille Ignorierung mit Console-Warnung
- **Double-Click**: UI-Blockierung während Verarbeitung
- **Network Fehler**: Rollback zu vorherigem Zustand

## 📝 Changelog

### v1.0.0
- ✅ Vollständiges Like-System implementiert
- ✅ Alle UI-Komponenten integriert
- ✅ Demo-Seite erstellt
- ✅ Dokumentation erstellt
