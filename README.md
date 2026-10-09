# 💕 Emir & Dilan — Anı Defteri

Birlikte biriktirilen güzel anıların dijital köşesi. Sevginin ve ortak anıların yaşatıldığı, kişisel bir zaman tüneli.

---

## ✨ Özellikler

- **Karşılama Ekranı** — Tam ekran fotoğraflı, "Emir & Dilan" merdiven yazı tasarımı ve "Seni Seviyorum" italik başlık
- **Zaman Tüneli** — Anılar tarihe göre sıralanmış, şık bir timeline görünümü
- **Çoklu Görsel Ekleme** — Tek seferde birden fazla fotoğraf yükleyebilme
- **Mevcut Tarihe Ekleme** — Daha önce eklenmiş bir tarihe yeni görsel eklenirse, not yazmak zorunlu değil; görseller otomatik olarak o tarihin anısına eklenir
- **Not Düzenleme** — Her anının notunu inline (sayfadan ayrılmadan) düzenleyebilme
- **Anı Silme** — Onay ekranı ile güvenli silme
- **Kalıcı Depolama** — IndexedDB ile tarayıcıda kalıcı saklama (sayfa yenilense bile anılar kaybolmaz)
- **Sayfa Hafızası** — Hangi sayfadaysan, yenileme sonrası da orada kalırsın
- **Responsive Tasarım** — Mobil ve masaüstü için ayrı optimizasyon
- **Vercel Deploy** — Tek tıkla Vercel üzerinde çalışır

---

## 🛠️ Teknolojiler

| Teknoloji | Kullanım |
|-----------|----------|
| **React 19** | UI framework |
| **TypeScript** | Tip güvenliği |
| **Vite 8** | Build tool |
| **Tailwind CSS 3** | Styling |
| **Framer Motion** | Sayfa geçiş animasyonları |
| **Lucide React** | İkonlar |
| **IndexedDB** | Kalıcı tarayıcı depolama |

---

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- Node.js >= 22.12.0
- npm >= 10

### Yerel Geliştirme

```bash
# Depoyu klonla
git clone https://github.com/emirhanozsy/dilanka-love.git
cd dilanka-love

# Bağımlılıkları kur
npm install

# Windows için native binding (sadece yerel geliştirmede gerekli)
npm install --save-dev @rolldown/binding-win32-x64-msvc

# Geliştirme sunucusunu başlat
npm run dev
```

Uygulama `http://localhost:5173` adresinde açılır.

**Ağdaki diğer cihazlardan erişim (örn. telefondan):**
`npm run dev` çalıştırıldıktan sonra terminalde görünen `Network:` adresini (ör. `http://192.168.1.X:5173`) telefonun tarayıcısına yaz.

### Production Build (Vercel'e Deploy)

```bash
npm run build
```

> ⚠️ `@rolldown/binding-win32-x64-msvc` **sadece Windows'ta lokal geliştirme için** gereklidir.
> `package.json`'da bu paket **devDependencies'de olmamalı** — Vercel (Linux) bu paketi kuramaz.
> Sadece yerel geliştirme ortamında `npm install --save-dev @rolldown/binding-win32-x64-msvc` ile ekle,
> commit etmeden önce `package.json`'dan kaldır.

---

## 📁 Proje Yapısı

```
dilan_web/
├── public/
│   ├── öpücük.jpeg          # Ana sayfa arka plan görseli
│   ├── özbekistan.jpeg      # Başlangıç anısı
│   ├── üsküdar.jpeg         # Başlangıç anısı
│   ├── facetime.jpeg        # Başlangıç anısı
│   └── uploads/             # (dev) Yerel olarak yüklenen görseller
├── src/
│   ├── lib/
│   │   ├── db.ts            # IndexedDB wrapper (kalıcı depolama)
│   │   └── supabase.ts      # (opsiyonel) Supabase client
│   ├── App.tsx              # Ana uygulama bileşeni
│   ├── main.tsx             # Giriş noktası
│   └── index.css            # Global stiller + Tailwind
├── .env.example             # Ortam değişkenleri şablonu
└── vite.config.ts           # Vite yapılandırması
```

---

## 💾 Veri Depolama Mimarisi

Uygulama **IndexedDB** kullanır:

- **Statik anılar** (`/public/*.jpeg`): Her zaman görünür, silindiklerinde sadece o cihazda kaybolur
- **Kullanıcı anıları** (yeni eklenenler): `IndexedDB`'de `dilanka_memories` veritabanına kaydedilir
- **Görseller**: `base64` olarak tarayıcıda saklanır — harici sunucu gerekmez
- **Sayfa durumu**: `localStorage`'da saklanır

> **Önemli Not:** IndexedDB tarayıcıya özeldir. Telefondan eklenen anılar bilgisayarda görünmez ve tam tersi.
> Cihazlar arası senkronizasyon için Supabase entegrasyonu yapılabilir (`.env.example`'a bakın).

---

## 🌐 Vercel Deploy

1. Projeyi GitHub'a push et
2. [vercel.com](https://vercel.com) → "Import Project" → GitHub repo'nu seç
3. Build Settings otomatik algılanır (Vite)
4. Deploy et!

> Herhangi bir environment variable gerekmez. Uygulama tamamen statik olarak çalışır.

---

## 📸 Yeni Anı Nasıl Eklenir?

1. Ana sayfada **"Yeni Anı Ekle"** butonuna tıkla
2. Tarihi seç
3. Bir veya birden fazla görsel seç
4. Notunu yaz (eğer o tarihe zaten anı eklenmişse not opsiyoneldir)
5. **"Anıyı Kaydet"**'e tıkla

---

## 🔧 Özelleştirme

### Ana Sayfa Görselini Değiştirme
`public/öpücük.jpeg` dosyasını istediğin fotoğrafla değiştir.

### Başlangıç Anılarını Değiştirme
`src/App.tsx` içindeki `STATIC_MEMORIES` dizisini düzenle.

---

*Sevgiyle yapıldı ❤️*
