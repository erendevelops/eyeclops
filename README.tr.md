# EyeClops

*(English version: [README.md](README.md))*

Göz sağlığı için ücretsiz, çoklu platform destekli bir masaüstü uygulaması;
**20-20-20 kuralı** üzerine kurulu: her 20 dakikada bir, en az 6 metre
uzaktaki bir şeye 20 saniye boyunca bakın.

EyeClops, sistem tepsinizde sessizce çalışır, sizi kontrol ettiğiniz bir
programa göre göz molası vermeniz için hatırlatır ve günün doğru
zamanlarında ekran parlaklığı / renk sıcaklığı konusunda sizi uyarır —
tüm bunları hiçbir veri toplamadan ve hesap gerektirmeden yapar.

## Özellikler

- **20-20-20 mola hatırlatıcıları** — geri sayımlı tam ekran mola ekranı
  ve bir Atla düğmesi. Ekranınızın ele geçirilmesini istemiyorsanız
  Ayarlar'dan kapatıp yerine sade bir işletim sistemi bildirimi
  alabilirsiniz.
- **Özel mola programları** — Profiller sayfasında kendi
  aralık/süre profillerinizi (örn. "İş," "Oyun") tanımlayın ve tepsi
  menüsünden aralarında geçiş yapın.
- **Çalışma saatleri** — molaları isteğe bağlı olarak günlük bir zaman
  aralığı ve belirli haftanın günleriyle sınırlayın; EyeClops göreve
  başladığında/göreve ara verdiğinde sessiz bir bildirim alın.
- **Parlaklık / renk sıcaklığı ipuçları** — işletim sisteminizin Gece
  Işığı / Night Shift özelliğini etkinleştirmeniz için günün saatine göre
  öneriler.
- **Dairesel geri sayım zamanlayıcısı** — Ana Sayfa ekranı, bir sonraki
  molanıza kalan süreyi tek bakışta gösterir.
- **Özel arka plan görselleri** — isterseniz Ana Sayfa ekranı ve mola
  ekranı arka planına kendi görsellerinizi ekleyebilirsiniz (aşağıya
  bakın).
- **Öncelikle tepside** — sistem tepsisinde yaşar; üzerine tıklamak
  doğrudan Ana Sayfa'yı açar. İsteğe bağlı olarak açılışta başlatma.
- **Varsayılan olarak gizli** — tüm ayarlar yerel bir JSON dosyasında
  saklanır; hesap yok, bulut yok, telemetri yok.
- **İngilizce ve Türkçe** — tam arayüz yerelleştirmesi, yalnızca metrik
  birimler.

## Özel arka plan görselleri

EyeClops, Ana Sayfa ekranının ve mola ekranının arkasında kendi
görsellerinizi gösterebilir. Uygulama içi bir seçici yoktur — görsel
dosyalarını uygulamanın yerel veri klasörüne bırakmanız yeterlidir,
otomatik olarak algılanır (dosya yoksa normal koyu tema kullanılır, hata
verilmez):

| Ekran | Dosya adı | Yönlendirme |
|---|---|---|
| Ana Sayfa | `home-background.png` / `.jpg` / `.jpeg` / `.webp` | Dikey (ana pencere dikeydir) |
| Mola ekranı | `overlay-background.png` / `.jpg` / `.jpeg` / `.webp` | Yatay (tüm ekranı kaplar) |

Klasör konumu:

- Windows: `%APPDATA%\com.eyeclops.app\backgrounds\`
- macOS: `~/Library/Application Support/com.eyeclops.app/backgrounds/`
- Linux: `~/.local/share/com.eyeclops.app/backgrounds/`

## Teknoloji yığını

- [Tauri v2](https://tauri.app/) (Rust arka uç)
- React + TypeScript ön uç
- Tailwind CSS v4
- Yerelleştirme için `react-i18next`

## Geliştirme

Ön koşullar: [Node.js](https://nodejs.org/), [Rust](https://www.rust-lang.org/tools/install)
ve <https://tauri.app/start/prerequisites/> adresindeki platforma özgü
Tauri ön koşulları.

```bash
npm install
npm run tauri dev
```

Testleri çalıştırma:

```bash
npm test              # ön uç (Vitest)
cd src-tauri && cargo test   # arka uç (Rust)
```

Üretim derlemesi/kurulum dosyası oluşturmak için:

```bash
npm run tauri build
```

## Önerilen IDE kurulumu

- [VS Code](https://code.visualstudio.com/) + [Tauri eklentisi](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Lisans

EyeClops, OSI onaylı bir "açık kaynak" değil, **kaynağı görülebilir**
(source-available) bir projedir. [PolyForm Shield License 1.0.0](LICENSE)
ile lisanslanmıştır: kaynak kodu okumak, çalıştırmak, kendi kullanımınız
için değiştirmek ve pull request ile katkıda bulunmak serbesttir — ancak
kendi değiştirdiğiniz kopyalarınızı yayınlayamaz veya kodu rakip bir ürün
oluşturmak için kullanamazsınız. Tüm koşullar için [LICENSE](LICENSE)
dosyasına, katkıda bulunma şekli için [CONTRIBUTING.md](CONTRIBUTING.md)
dosyasına bakın.
