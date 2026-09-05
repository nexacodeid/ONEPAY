const ONEPAY_WEBSITE = 'https://onepay.web.id'
const ONEPAY_FOOTER = `\n\n━━━━━━━━━━━━━━━━━━\n🛒 *Panel & Product OnePay*\n🌐 ${ONEPAY_WEBSITE}`

const onePayText = (value) => typeof value === 'string' && !value.includes(ONEPAY_WEBSITE)
    ? value + ONEPAY_FOOTER
    : value

const onePayPayload = (payload) => {
    if (!payload || typeof payload !== 'object') return payload
    const next = { ...payload }
    if (typeof next.text === 'string') next.text = onePayText(next.text)
    if (typeof next.caption === 'string') next.caption = onePayText(next.caption)
    return next
}

const onePaySendMessage = (sock, target, payload, options) =>
    sock.sendMessage(target, onePayPayload(payload), options)

const onePaySendButton = (sock, target, payload, options) => sock.sendButton(target, onePayPayload(payload), options)

const onePayReply = (reply, text, ...args) =>
    reply(onePayText(text), ...args)

import { saveDB } from '../lib/database.js';

global.addStokSession = global.addStokSession || {};

let handler = async (m, { sock, command, text, reply, isOwner, jid, sender }) => {
    const __onepayOriginalReply = reply
    reply = (text, ...args) => __onepayOriginalReply(onePayText(text), ...args)
    const args = text ? text.split(' ') : [];
    const subCommand = args[0];
    const msgType = m.message ? Object.keys(m.message)[0] : '';
    const isDocument = msgType === 'documentMessage' || (msgType === 'extendedTextMessage' && m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.documentMessage);
    if (global.addStokSession[sender] && global.addStokSession[sender].stage === 'WAITING_FILE' && isDocument) {
        const session = global.addStokSession[sender];
        const docMessage = msgType === 'documentMessage' ? m.message.documentMessage : m.message.extendedTextMessage.contextInfo.quotedMessage.documentMessage;

        if (docMessage.mimetype !== 'text/plain') {
            return reply('[  !  ] File harus berupa format .txt! Silakan kirim ulang file yang valid.');
        }

        const buffer = await sock.downloadMediaMessage(docMessage).catch(() => null);
        if (!buffer) return reply('[  !  ] Gagal mendownload file, silakan kirim ulang.');

        const fileContent = buffer.toString('utf-8');
        const rawStocks = fileContent.split(',');
        const parsedStocks = [];

        rawStocks.forEach(raw => {
            if (!raw.trim()) return;
            let lines = raw.split(/\r?\n/);
            let fields = [];

            lines.forEach(line => {
                let parts = line.split(':');
                if (parts.length >= 2) {
                    let key = parts.shift().trim();
                    let val = parts.join(':').trim();
                    if (key && val) {
                        fields.push({ key: key, value: val });
                    }
                }
            });

            if (fields.length > 0) {
                parsedStocks.push({ fields: fields });
            }
        });

        if (parsedStocks.length === 0) return reply('[  !  ] File .txt tidak berisi data dengan format yang benar (Kolom: Isi).');

        session.stage = 'WAITING_CONFIRM';
        session.tempStokData = parsedStocks;

        let sampleText = session.tempStokData[0].fields.map(f => `${f.key}: ${f.value}`).join('\n');

        return await onePaySendButton(sock, jid, {
            caption: `*VERIFIKASI DATA STOK*\n\n- Total terdeteksi: *${parsedStocks.length} item stok*\n\n*Sampel Data 1:*\n\`\`\`${sampleText}\`\`\`\n\nApakah data di atas sudah benar untuk dimasukkan ke database?`,
            footer: global.toko?.footer || "OnePay Store",
            buttons: [
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "[ V ] Ya, Benar", id: `.addstok confirm_yes` }) },
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "[ X ] Batalkan", id: ".addstok batal" }) }
            ],
            bottom_sheet: false
        }, { quoted: m });
    }
    if (!subCommand) {
        const products = Object.values(global.db.products || {}).filter(p => p.type === 'dynamic');
        if (products.length === 0) return reply('[  !  ] Belum ada produk bertipe dinamis di database.');

        let listBtns = products.map(p => ({
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: `${p.name}`,
                id: `.addstok select_prod ${p.id}`
            })
        }));

        return await onePaySendButton(sock, jid, {
            caption: `*PENGISIAN STOK MASSAL*\n\nSilakan pilih produk dinamis yang ingin diisi stoknya di bawah ini:`,
            footer: global.toko?.footer || "OnePay Store",
            buttons: listBtns,
            bottom_sheet: true,
            bottom_name: "Pilih Produk"
        }, { quoted: m });
    }

    if (subCommand === 'select_prod') {
        let prodId = args[1];
        let product = global.db.products[prodId];
        if (!product) return reply('[  !  ] Produk tidak ditemukan!');

        if (!product.variants || product.variants.length === 0) {
            return reply('[  !  ] Produk ini belum memiliki varian.');
        }

        let variantBtns = product.variants.map((v, i) => ({
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: `${v.name}`,
                id: `.addstok select_var ${prodId} ${i}`
            })
        }));

        variantBtns.push({
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({ display_text: "[ X ] Batalkan", id: ".addstok batal" })
        });

        return await onePaySendButton(sock, jid, {
            caption: `*PILIH VARIAN PRODUK*\n\nProduk: *${product.name}*\n\nSilakan tentukan varian mana yang ingin ditambahkan stoknya:`,
            footer: global.toko?.footer || "OnePay Store",
            buttons: variantBtns,
            bottom_sheet: true,
            bottom_name: "Pilih Varian"
        }, { quoted: m });
    }

    if (subCommand === 'select_var') {
        if (args.length < 3) return reply('[  !  ] Format salah!');
        let prodId = args[1];
        let varIdx = parseInt(args[2]);

        global.addStokSession[sender] = {
            stage: 'WAITING_FILE',
            prodId: prodId,
            varIdx: varIdx,
            timestamp: Date.now()
        };

        return await onePaySendButton(sock, jid, {
            caption: `*KIRIM FILE STOK (.TXT)*\n\n*Aturan Format File:*\n- Gunakan [ : ] untuk memisahkan Nama Kolom & Isinya\n- Gunakan Enter untuk kolom baru dalam 1 stok\n- Gunakan koma [ , ] untuk memisahkan antar data stok\n\nSilakan upload file .txt kamu ke sini.`,
            footer: global.toko?.footer || "OnePay Store",
            buttons: [
                { 
  name: "cta_url",
  buttonParamsJson: JSON.stringify({
     display_text: "Lihat contoh",
     url: ONEPAY_WEBSITE
  })
 },
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "[ X ] Batalkan", id: ".addstok batal" }) }
            ],
            bottom_sheet: false
        }, { quoted: m });
    }

    if (subCommand === 'confirm_yes') {
        const session = global.addStokSession[sender];
        if (!session || session.stage !== 'WAITING_CONFIRM') return reply('[  !  ] Tidak ada sesi pengisian stok aktif.');

        let product = global.db.products[session.prodId];
        let variant = product?.variants[session.varIdx];

        if (!variant) {
            delete global.addStokSession[sender];
            return reply('[  !  ] Data produk atau varian hilang dari database.');
        }

        if (!variant.stocks) variant.stocks = [];

        session.tempStokData.forEach(stockItem => {
            variant.stocks.push(stockItem);
        });

        saveDB(global.db);
        delete global.addStokSession[sender];

        return reply(`*BERHASIL!*\n\nStok sebanyak *${session.tempStokData.length} item* telah berhasil ditambahkan ke dalam varian *${variant.name}* pada produk *${product.name}*.\n\nKetik *.produk ${product.name}* untuk memastikan nya`);
    }

    if (subCommand === 'batal') {
        if (global.addStokSession[sender]) {
            delete global.addStokSession[sender];
            return reply('[  !  ] Proses pengisian stok massal berhasil dibatalkan.');
        }
        return reply('[  !  ] Tidak ada proses pengisian stok yang sedang berjalan.');
    }
};

handler.command = ['addstok'];
handler.tags = ['owner'];
handler.owner = true;
handler.private = true;

export default handler;
