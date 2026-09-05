<div align="center">

# ONEPAY

### WhatsApp Store & Payment Bot

Bot WhatsApp berbasis Node.js untuk membangun sistem toko, layanan otomatis, dan alur pembayaran langsung dari WhatsApp.

<br>

<img src="https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
<img src="https://img.shields.io/badge/Baileys-7.x-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Baileys">
<img src="https://img.shields.io/github/license/nexacodeid/ONEPAY?style=for-the-badge" alt="License">
<img src="https://img.shields.io/github/stars/nexacodeid/ONEPAY?style=for-the-badge" alt="Stars">

<br><br>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:00c6ff,100:0072ff&height=180&section=header&text=ONEPAY&fontSize=52&fontColor=ffffff&animation=fadeIn&fontAlignY=38" width="100%" alt="ONEPAY Banner">

</div>

## About

**ONEPAY** adalah bot WhatsApp berbasis **Node.js + Baileys** yang dirancang sebagai fondasi untuk toko digital dan sistem otomatisasi WhatsApp.

Struktur project dibuat modular agar fitur dapat dikembangkan melalui handler, plugin, database, template, dan konfigurasi tanpa harus mengacak-acak seluruh source code. Karena hidup sudah cukup berantakan, source code tidak perlu ikut-ikutan.

## Features

- WhatsApp automation menggunakan Baileys
- Sistem handler modular
- Dukungan plugin
- Struktur database terpisah
- Template system
- Media processing
- Konfigurasi terpusat
- Dukungan audio/video processing melalui FFmpeg
- Image processing menggunakan Jimp
- Logging menggunakan Pino
- ES Modules
- Mudah dikembangkan untuk kebutuhan toko dan payment workflow

## Tech Stack

| Technology | Usage |
| --- | --- |
| Node.js | Runtime utama |
| Baileys | WhatsApp connection & messaging |
| JavaScript | Bahasa pemrograman |
| Pino | Logging |
| Jimp | Image processing |
| FFmpeg | Media processing |
| Chokidar | File watching |
| Haruka Lib | Library pendukung |

## Project Structure

```text
ONEPAY/
├── database/       # Database & data storage
├── lib/            # Library/helper internal
├── media/          # Media assets
├── plugins/        # Plugin dan fitur bot
├── templates/      # Template pesan / sistem
├── config.js       # Konfigurasi bot
├── handler.js      # Handler utama
├── index.js        # Entry point
├── package.json    # Dependencies & scripts
├── package-lock.json
├── ONEPAY.zip
└── LICENSE
```

## Installation

### 1. Clone repository

```bash
git clone https://github.com/nexacodeid/ONEPAY.git
cd ONEPAY
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure

Sesuaikan konfigurasi pada:

```text
config.js
```

Pastikan seluruh konfigurasi yang dibutuhkan sudah benar sebelum menjalankan bot.

### 4. Start bot

```bash
npm start
```

atau:

```bash
node index.js
```

## Development

Untuk mengembangkan fitur baru, area utama yang dapat diperhatikan adalah:

- `plugins/` untuk fitur/plugin
- `handler.js` untuk alur pemrosesan pesan
- `lib/` untuk helper dan modul internal
- `database/` untuk penyimpanan data
- `templates/` untuk template pesan
- `config.js` untuk konfigurasi

## Media

ONEPAY memiliki dukungan pemrosesan media untuk kebutuhan bot, termasuk image processing dan audio/video processing. Dependency project mencakup **Jimp**, **fluent-ffmpeg**, **file-type**, dan **node-webpmux**.

## Disclaimer

Project ini disediakan untuk kebutuhan pengembangan, pembelajaran, dan otomatisasi WhatsApp yang digunakan secara bertanggung jawab.

Gunakan bot sesuai kebijakan platform dan hukum yang berlaku. Jangan menggunakan project ini untuk spam, penipuan, penyalahgunaan akun, atau aktivitas yang merugikan pengguna lain.

## Author

<div align="center">

### NEXACODE ID

Built with JavaScript, caffeine, and questionable life decisions.

[![GitHub](https://img.shields.io/badge/GitHub-nexacodeid-181717?style=for-the-badge&logo=github)](https://github.com/nexacodeid)

</div>

## Support

Jika menemukan bug atau ingin mengembangkan fitur, gunakan **Issues** atau **Pull Requests** di repository ini.

<div align="center">

### ONEPAY
**Automate. Integrate. Scale.**

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0072ff,100:00c6ff&height=120&section=footer" width="100%" alt="Footer">

</div>
