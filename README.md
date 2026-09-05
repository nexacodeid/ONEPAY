<div align="center">

<img src="./media/onepay.png" width="180" alt="ONEPAY Logo">

# ONEPAY

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=22&pause=900&color=00C6FF&center=true&vCenter=true&width=700&lines=WhatsApp+Store+%26+Payment+Bot;Node.js+%2B+Baileys;Fast.+Modular.+Powerful.;Automate.+Integrate.+Scale." alt="ONEPAY Typing Animation">

<br>

<img src="https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
<img src="https://img.shields.io/badge/Baileys-7.x-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Baileys">
<img src="https://img.shields.io/github/license/nexacodeid/ONEPAY?style=for-the-badge" alt="License">
<img src="https://img.shields.io/github/stars/nexacodeid/ONEPAY?style=for-the-badge" alt="Stars">

<br><br>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:7F00FF,50:00C6FF,100:00F5D4&height=3&section=header" width="85%" alt="Divider">

</div>

## ONEPAY

**ONEPAY** adalah bot WhatsApp berbasis **Node.js + Baileys** untuk kebutuhan toko digital, automation, dan workflow pembayaran.

Project dibuat modular supaya pengembangan fitur tetap rapi melalui handler, plugin, database, template, dan library internal.

<div align="center">

<img src="./media/help.png" width="46%" alt="ONEPAY Help Preview">
<img src="./media/produk.png" width="46%" alt="ONEPAY Product Preview">

</div>

## Features

- WhatsApp automation dengan Baileys
- Pairing code untuk koneksi WhatsApp
- Handler modular
- Sistem plugin
- Database terpisah
- Template pesan
- Image processing dengan Jimp
- Audio/video processing dengan FFmpeg
- File type detection
- WebP processing
- Logging dengan Pino
- File watching dengan Chokidar
- ES Modules
- Siap dikembangkan untuk toko digital dan payment workflow

## Tech Stack

| Technology | Fungsi |
| --- | --- |
| Node.js | Runtime utama |
| JavaScript | Bahasa pemrograman |
| Baileys | WhatsApp connection & messaging |
| Pino | Logging |
| Jimp | Image processing |
| FFmpeg | Audio/video processing |
| Chokidar | File watching |
| Haruka Lib | Library pendukung |

## Project Structure

```text
ONEPAY/
├── database/          # Database & data storage
├── lib/               # Helper & internal modules
├── media/             # Image, QR & media assets
├── plugins/           # Bot features / plugins
├── templates/         # Message templates
├── config.js          # Main configuration
├── handler.js         # Message handler
├── index.js           # Bot entry point
├── package.json       # Dependencies & scripts
├── package-lock.json  # Locked dependency versions
├── ONEPAY.zip         # Project archive
└── LICENSE
```

## Installation

### Requirements

- Node.js 20+
- npm
- FFmpeg
- Git

### Setup

```bash
git clone https://github.com/nexacodeid/ONEPAY.git
cd ONEPAY
npm install
npm start
```

Untuk koneksi pertama, bot akan meminta nomor WhatsApp dan mencoba mengirim **pairing code**.

## Configuration

Konfigurasi utama berada di:

```text
config.js
```

Pastikan file konfigurasi dan data yang dibutuhkan sudah tersedia sebelum menjalankan bot.

## Media

Repository sudah memiliki asset asli di folder `media/`, termasuk logo ONEPAY, preview bantuan, preview produk, dan QR. README menggunakan asset repository secara langsung agar gambar tidak bergantung sepenuhnya pada layanan banner eksternal.

## Development

```text
plugins/       -> tambah atau ubah fitur bot
handler.js     -> alur pemrosesan pesan
lib/           -> helper dan modul internal
database/      -> penyimpanan data
templates/     -> template pesan
config.js      -> konfigurasi
```

## Disclaimer

Project ini dibuat untuk pengembangan, pembelajaran, dan automation WhatsApp secara bertanggung jawab.

Jangan gunakan project untuk spam, penipuan, penyalahgunaan akun, atau aktivitas yang melanggar kebijakan platform maupun hukum yang berlaku.

## Author

<div align="center">

<img src="https://github-profile-trophy.vercel.app/?username=nexacodeid&theme=onestar&no-frame=true&no-bg=true&margin-w=8&row=1" width="90%" alt="GitHub Trophies">

### NEXACODE ID

<img src="https://github-readme-stats.vercel.app/api?username=nexacodeid&show_icons=true&theme=tokyonight&hide_border=true&rank_icon=github" alt="GitHub Stats">

<br><br>

<img src="https://github-readme-stats.vercel.app/api/top-langs/?username=nexacodeid&layout=compact&theme=tokyonight&hide_border=true" alt="Top Languages">

</div>

## Support

Gunakan **Issues** atau **Pull Requests** untuk melaporkan bug dan mengembangkan fitur.

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:00F5D4,50:00C6FF,100:7F00FF&height=160&section=footer&animation=twinkling" width="100%" alt="Animated Footer">

**ONEPAY • Automate. Integrate. Scale.**

</div>
