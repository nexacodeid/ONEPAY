<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:7F00FF,50:00C6FF,100:00F5D4&height=220&section=header&text=ONEPAY&fontSize=64&fontColor=ffffff&animation=fadeIn&fontAlignY=38" width="100%" alt="ONEPAY Banner">

# ONEPAY

<a href="https://git.io/typing-svg"><img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=20&pause=900&color=00C6FF&center=true&vCenter=true&width=600&lines=WhatsApp+Store+%26+Payment+Bot;Node.js+%2B+Baileys;Automate.+Integrate.+Scale." alt="Typing SVG" /></a>

<br>

<img src="https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
<img src="https://img.shields.io/badge/Baileys-7.x-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Baileys">
<img src="https://img.shields.io/github/license/nexacodeid/ONEPAY?style=for-the-badge" alt="License">
<img src="https://img.shields.io/github/stars/nexacodeid/ONEPAY?style=for-the-badge" alt="Stars">

<br><br>

<img src="https://github-readme-activity-graph.vercel.app/graph?username=nexacodeid&repo=ONEPAY&theme=react-dark&hide_border=true&area=true" width="95%" alt="Activity Graph">

</div>

## About

**ONEPAY** adalah bot WhatsApp berbasis **Node.js + Baileys** yang dirancang sebagai fondasi untuk toko digital dan sistem otomatisasi WhatsApp.

Struktur project dibuat modular agar fitur dapat dikembangkan melalui handler, plugin, database, template, dan konfigurasi tanpa harus mengacak-acak seluruh source code.

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

### 4. Start bot

```bash
npm start
```

atau:

```bash
node index.js
```

## Development

Area utama untuk pengembangan:

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

<img src="https://github-profile-trophy.vercel.app/?username=nexacodeid&theme=onestar&no-frame=true&no-bg=true&margin-w=8&row=1" width="90%" alt="GitHub Trophies">

<a href="https://github.com/nexacodeid">
<img src="https://img.shields.io/badge/GitHub-nexacodeid-181717?style=for-the-badge&logo=github" alt="GitHub">
</a>

</div>

## Support

Jika menemukan bug atau ingin mengembangkan fitur, gunakan **Issues** atau **Pull Requests** di repository ini.

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:00F5D4,50:00C6FF,100:7F00FF&height=150&section=footer&animation=twinkling" width="100%" alt="Animated Footer">

### ONEPAY
**Automate. Integrate. Scale.**

</div>
