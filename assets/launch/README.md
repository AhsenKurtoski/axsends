# AhsenDS — Launch Kit 2026

Launch kit completo per **AhsenDS**, progettato e raccontato da **Ahsen Kurtoski**.

## Contenuto

| File | Cosa è |
|---|---|
| `video/ahsends-launch-16x9.mp4` | Launch film 44s, 1920×1080, 30 fps, H.264/AAC |
| `video/ahsends-teaser-9x16.mp4` | Teaser verticale 18s, 1080×1920, 30 fps, H.264/AAC |
| `teaser-vertical-poster.png` | Poster verticale del teaser |
| `social-copy.md` | Hook, caption, hashtag e piano di pubblicazione |
| `poster.png` | Poster 1920×1080 estratto dal film |
| `contact-sheet.png` | Contact sheet con le 8 schermate |
| `screens/01-landing.png` | Landing pubblica |
| `screens/02-dashboard.png` | Dashboard con ricavi, ordini e margine |
| `screens/03-autopilot.png` | Autopilot |
| `screens/04-products.png` | Catalogo prodotti |
| `screens/05-orders.png` | Ordini e stati |
| `screens/06-analytics.png` | Analytics e ricavi per data |
| `screens/07-radar.png` | Radar prodotti |
| `screens/08-landing-features.png` | Sezione funzionalità della landing |
| `audio/ahsends-launch-music.mp3` | Soundtrack originale, 44.5s |
| `audio/ahsends-launch-music.wav` | Master WAV 48 kHz / 16-bit |
| `gallery.html` | Gallery navigabile con player 16:9, teaser 9:16 e download |

Tutti gli screenshot sono **1920×1080** e hanno il watermark **AhsenDS · Ahsen Kurtoski**.

## Specifiche video

- Film: **44 secondi**, **1920×1080**, **30 fps**
- Teaser social: **18 secondi**, **1080×1920**, **30 fps**
- Video: **H.264**, yuv420p, CRF 18, fast start
- Audio: **AAC 192 kbps**, 48 kHz, stereo
- Loudness: **−14 LUFS** circa, picco limitato a −1.5 dBTP
- Musica: traccia synth originale generata per questo progetto, nessun sample o brano di terzi
- Watermark: **Ahsen Kurtoski** su ogni scena

## Struttura del film

1. **Brand intro** — AhsenDS, tagline e posizionamento.
2. **Il prodotto** — landing reale dentro un browser frame.
3. **Controllo** — dashboard con ricavi, ordini, margine e top prodotti.
4. **Autopilot** — un clic, quattro step.
5. **Catalogo** — prodotti, markup e stock.
6. **Ordini** — stati e fulfillment.
7. **Feature grid** — 24 moduli in un unico sistema.
8. **End card** — costruito da Ahsen Kurtoski, open source, MIT.

### Teaser verticale (9:16)

1. **Brand intro** — AhsenDS e tagline.
2. **Controllo** — dashboard e margine.
3. **Autopilot** — un clic, quattro step.
4. **Catalogo** — prodotti, markup e stock.
5. **End card** — costruito da Ahsen Kurtoski, open source, MIT.

## Pagina pubblica

La pagina `/launch` del sito contiene player 16:9, teaser 9:16, otto screenshot, poster, specifiche e download. Gli asset sono serviti da `public/launch/kit/`; la pagina è pubblica e non richiede login.

## Nota sui dati demo

Le schermate mostrano prodotti e ordini demo temporanei (`DEMO-*`) per presentare la UI popolata. I record demo sono stati rimossi dal database Supabase dopo la cattura. Per la verifica end-to-end è stato poi creato un record reale di test (`E2E-PROD-2026` + `E2E-ORD-2026`) tramite login e API reali; il prodotto, le API, il login, il database e i flussi mostrati sono reali, nessuna funzione è simulata.

## Palette e tipografia

- Background: `#05060d`
- Brand: `#8b5cf6`
- Cyan: `#22d3ee`
- Pink: `#f472b6`
- Testo: `#f6f7ff`
- Display: **Space Grotesk**
- UI / body: **Inter**

## Rigenerare gli asset

Richiede il server locale su `http://127.0.0.1:3111` e il server statico su `http://127.0.0.1:4173`.

```bash
npm install --no-save --package-lock=false puppeteer-core

# Screenshot reali (login Supabase + dati demo)
E2E_EMAIL='...' E2E_PASSWORD='...' node scripts/capture-launch.mjs

# Seed E2E reale: login UI + /api/import + /api/orders + /api/health/fix
E2E_EMAIL='...' E2E_PASSWORD='...' node scripts/seed-test-data.mjs

# Teaser verticale: preview e render 30 fps
node scripts/preview-vertical.mjs
node scripts/render-vertical.mjs

# Musica originale
node scripts/make-launch-music.mjs

# Render deterministico 30 fps
node scripts/render-launch-frames.mjs

# Encode finale
ffmpeg -y -framerate 30 -i assets/launch/video/frames-final/frame-%05d.jpg \
  -i assets/launch/audio/ahsends-launch-music.wav \
  -filter_complex "[0:v]fade=t=out:st=43.0:d=1.0[v];[1:a]loudnorm=I=-14:TP=-1.5:LRA=11,atrim=0:44,afade=t=in:st=0:d=0.7,afade=t=out:st=42.6:d=1.4,aresample=48000[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 192k -ar 48000 -t 44 -movflags +faststart \
  assets/launch/video/ahsends-launch-16x9.mp4
```

Le scene e il design del film sono in `public/launch/launch.html`; il teaser in `public/launch/vertical.html`; la gallery in `gallery.html`.

Encode del teaser:

```bash
ffmpeg -y -framerate 30 -i assets/launch/video/vertical-frames/frame-%05d.jpg \
  -i assets/launch/audio/ahsends-launch-music.wav \
  -filter_complex "[1:a]atrim=0:18,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.6,afade=t=out:st=17:d=1,loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
  -map 0:v -map "[a]" -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 192k -ar 48000 -ac 2 -shortest -movflags +faststart \
  assets/launch/video/ahsends-teaser-9x16.mp4
```

## Crediti e utilizzo

- Design, prodotto e sviluppo: **Ahsen Kurtoski**
- Software: **AhsenDS**, licenza MIT
- Asset del launch kit: liberamente utilizzabili per presentare AhsenDS, con attribuzione ad **Ahsen Kurtoski**
- Musica: originale, inclusa nel kit; nessuna licenza di terzi da rispettare

Per qualsiasi uso esterno al progetto AhsenDS, chiedi prima ad Ahsen Kurtoski.
