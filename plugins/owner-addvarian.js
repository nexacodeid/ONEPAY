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

global.addVarianSession = global.addVarianSession || {};

let handler = async (m, { sock, command, text, prefix, reply, jid, sender }) => {
    const __onepayOriginalReply = reply
    reply = (text, ...args) => __onepayOriginalReply(onePayText(text), ...args)
    const args = text ? text.trim().split(/ +/) : [];
    const subCommand = args[0] || '';

    if (subCommand === 'batal') {
        if (global.addVarianSession[sender]) {
            delete global.addVarianSession[sender];
            return reply('[  !  ] Proses penambahan varian dibatalkan.');
        }
        return reply('[  !  ] Tidak ada sesi yang sedang berjalan.');
    }

    if (!global.addVarianSession[sender] && !subCommand.startsWith('select_')) {
        const products = Object.values(global.db.products || {});
        if (products.length === 0) return reply('[  !  ] Belum ada produk di database.');

        let listBtns = products.map(p => ({
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: `[ ${p.type.toUpperCase()} ] ${p.name}`,
                id: `${prefix + command} select_prod ${p.id}`
            })
        }));

        return await onePaySendButton(sock, jid, {
            caption: `Pilih produk yang ingin ditambahkan variannya:`,
            footer: global.toko?.footer || "OnePay Store",
            buttons: listBtns,
            bottom_sheet: true,
            bottom_name: "Pilih Produk"
        }, { quoted: m });
    }

    if (subCommand === 'select_prod') {
        let prodId = args[1];
        let product = global.db.products[prodId];
        if (!product) return reply('[  !  ] Produk tidak ditemukan.');

        global.addVarianSession[sender] = {
            prodId: prodId,
            type: product.type,
            stage: 'WAITING_NAME',
            timestamp: Date.now()
        };

        return await onePaySendButton(sock, jid, {
            caption: `*PRODUK TERPILIH: ${product.name.toUpperCase()}*\n\nMasukkan nama varian yang ingin dibuat:`,
            buttons: [
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Batal", id: `${prefix + command} batal` }) }
            ],
            bottom_sheet: false
        }, { quoted: m });
    }

    const session = global.addVarianSession[sender];
    if (session) {
        let product = global.db.products[session.prodId];
        if (!product) {
            delete global.addVarianSession[sender];
            return reply('[  !  ] Produk hilang dari database.');
        }

        if (session.stage === 'WAITING_NAME') {
            if (!text || !text.trim()) return reply('[  !  ] Nama varian tidak boleh kosong.');
            session.varName = text.trim();
            session.stage = 'WAITING_PRICE';
            return reply(`*NAMA VARIAN:* ${session.varName}\n\nMasukkan harga untuk varian ini (Angka saja):`);
        }

        if (session.stage === 'WAITING_PRICE') {
            if (!text) return reply('[  !  ] Harga tidak boleh kosong.');
            const price = parseInt(text.trim());
            if (isNaN(price)) return reply('[  !  ] Harga harus berupa angka valid.');
            session.varPrice = price;

            if (session.type === 'static') {
                session.stage = 'WAITING_FIELDS';
                return reply(`*HARGA VARIAN:* Rp ${session.varPrice.toLocaleString('id-ID')}\n\nProduk ini bertipe *STATIS*.\nMasukkan data konfigurasi kolom untuk varian ini.\n\nFormat: \`NamaKolom: Isi, NamaKolom2: Isi\`\nContoh: \`Durasi: 30 Hari, Fitur: Full Garansi\``);
            } else {
                if (!product.variants) product.variants = [];
                product.variants.push({
                    name: session.varName,
                    price: session.varPrice,
                    stocks: []
                });

                saveDB(global.db);
                delete global.addVarianSession[sender];

                return await onePaySendButton(sock, jid, {
                    caption: `*VARIAN DINAMIS BERHASIL DITAMBAHKAN*\n\nProduk: ${product.name}\nVarian: ${session.varName}\nHarga: Rp ${session.varPrice.toLocaleString('id-ID')}\n\nSilakan isi stok dengan klik tombol di bawah ini.`,
                    footer: global.toko?.footer || "OnePay Store",
                    buttons: [
                        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Isi Stok", id: `.addstok` }) }
                    ],
                    bottom_sheet: false
                }, { quoted: m });
            }
        }

        if (session.stage === 'WAITING_FIELDS') {
            if (!text || !text.trim()) return reply('[  !  ] Konfigurasi kolom tidak boleh kosong.');

            const parsedFields = [];
            const fieldPairs = text.split(',');

            fieldPairs.forEach(pair => {
                let splitPair = pair.split(':');
                if (splitPair.length >= 2) {
                    let k = splitPair.shift().trim();
                    let v = splitPair.join(':').trim();
                    if (k && v) {
                        parsedFields.push({ key: k, value: v });
                    }
                }
            });

            if (parsedFields.length === 0) {
                return reply('[  !  ] Format kolom salah. Gunakan tanda titik dua (:) sebagai pemisah dan koma (,) antar kolom.');
            }

            if (!product.variants) product.variants = [];
            product.variants.push({
                price: session.varPrice,
                fields: parsedFields
            });

            saveDB(global.db);
            delete global.addVarianSession[sender];

            let fieldsPreview = parsedFields.map(f => `- ${f.key}: ${f.value}`).join('\n');
            return reply(`*VARIAN STATIS BERHASIL DITAMBAHKAN*\n\nProduk: ${product.name}\nHarga: Rp ${session.varPrice.toLocaleString('id-ID')}\n\nStruktur Kolom:\n${fieldsPreview}`);
        }
    }
};

handler.command = ['addvarian', 'tambahvarian'];
handler.tags = ['owner'];
handler.owner = true;

export default handler;

