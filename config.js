import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'

// ================= ONEPAY CONFIGURATION =================
global.namebot = "DORAEMON STORE"
global.versi = "1.0.0"
global.paircode = "ONEPAY26"
global.owner = ["628886326382"]
global.prefix = ["!", ".", ","]
global.premium = ["6281221523185"]

global.appConfig = {
  antispam: {
    status: true,
    interval: 15000,
    warning: 7,
    block: 15,
    cooldown: 60000
  }
}

global.toko = {
  nama: "OnePay Store",
  status: "buka"
}

// Isi nomor payment milik ONEPAY di bawah ini. Tidak ada license checker/CDN eksternal.
global.payment = {
  qris: "./media/qris.png",
  dana: "-",
  gopay: "-",
  ovo: "-",
  shopeepay: "-",
  neobank: "-",
  seabank: "-"
}

global.thumb = {
  utama: "./media/onepay.png",
  produk: "./media/produk.png",
  help: "./media/help.png"
}

global.faq = [
  { tanya: "Gimana cara order?", jawab: "Ketik *.beli* lalu ikuti langkah-langkah dari bot." },
  { tanya: "Gimana cara cek produk?", jawab: "Ketik *.produk* lalu pilih produk yang ingin kamu cek." },
  { tanya: "Metode pembayaran apa saja?", jawab: "Gunakan metode pembayaran yang tercantum di menu pembayaran OnePay." },
  { tanya: "Proses berapa lama?", jawab: "Proses mengikuti antrean dan jenis produk yang dipesan." }
]

global.mess = {
  wait: "Tunggu sebentar ya...",
  owner: "Fitur ini khusus owner!",
  admin: "Fitur ini khusus admin!",
  premium: "Fitur ini khusus premium!",
  group: "Fitur ini hanya bisa digunakan di dalam group!",
  private: "Fitur ini hanya bisa di private chat!"
}

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.cyanBright("Update config.js - OnePay"))
  import(`${file}?update=${Date.now()}`)
})
