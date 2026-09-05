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

let handler = async (m, { sock, command, text, prefix, reply, jid }) => {
    const __onepayOriginalReply = reply
    reply = (text, ...args) => __onepayOriginalReply(onePayText(text), ...args)
    if (text && text.startsWith('confirm_delprod|')) {
        let prodId = text.split('|')[1];
        
        if (prodId === 'all') {
            global.db.products = {};
            saveDB(global.db);
            return reply('[  !  ] Berhasil menghapus semua produk dari database.');
        }

        if (global.db.products[prodId]) {
            let prodName = global.db.products[prodId].name;
            delete global.db.products[prodId];
            saveDB(global.db);
            return reply(`[  !  ] Berhasil menghapus produk: *${prodName}*`);
        }
        return reply('[  !  ] Produk tidak ditemukan.');
    }

    if (text && text.startsWith('delprod_target|')) {
        let prodId = text.split('|')[1];
        let caption = '';
        
        if (prodId === 'all') {
            caption = 'Data tidak bisa dipulihkan setelah dihapus\nApakah kamu yakin ingin menghapus SEMUA produk dari database?';
        } else {
            let product = global.db.products[prodId];
            if (!product) return reply('[  !  ] Produk tidak ditemukan.');
            caption = `Data tidak bisa dipulihkan setelah dihapus\nApakah kamu yakin ingin menghapus produk *${product.name.toUpperCase()}* beserta seluruh variannya?`;
        }

        return await onePaySendButton(sock, jid, {
            caption: caption,
            buttons: [
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Ya", id: `${prefix + command} confirm_delprod|${prodId}` }) },
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Tidak", id: `${prefix}menu` }) }
            ],
            bottom_sheet: false
        }, { quoted: m });
    }

    const products = Object.values(global.db.products || {});
    if (products.length === 0) return reply('[  !  ] Belum ada produk di database.');

    let productRows = products.map(p => ({
        id: `${prefix + command} delprod_target|${p.id}`,
        title: p.name,
        description: `Tipe: ${p.type.toUpperCase()} | Varian: ${p.variants?.length || 0}`
    }));

    return await onePaySendButton(sock, jid, {
        caption: `Pilih produk yang ingin dihapus:`,
        buttons: [
            {
                name: "single_select",
                buttonParamsJson: JSON.stringify({ 
                    title: "Pilih Produk", 
                    sections: [{ title: "Daftar Produk", rows: productRows }] 
                })
            },
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({ display_text: "Hapus Semua Produk", id: `${prefix + command} delprod_target|all` })
            }
        ],
        bottom_sheet: true,
        bottom_name: "Kelola Produk"
    }, { quoted: m });
};

handler.command = ['delproduk', 'hapusproduk'];
handler.tags = ['owner'];
handler.owner = true;

export default handler;
