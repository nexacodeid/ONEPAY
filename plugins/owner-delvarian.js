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

let handler = async (m, { sock, command, text, prefix, reply, jid, sender }) => {
    const __onepayOriginalReply = reply
    reply = (text, ...args) => __onepayOriginalReply(onePayText(text), ...args)
    if (text && text.startsWith('confirm_del|')) {
        let [prodId, variantIndexStr] = text.replace('confirm_del|', '').split('|');
        let product = global.db.products[prodId];
        if (!product || !product.variants) return reply('[  !  ] Produk atau varian tidak ditemukan.');

        let variantIndex = parseInt(variantIndexStr);
        if (isNaN(variantIndex) || !product.variants[variantIndex]) return reply('[  !  ] Varian tidak valid.');

        let deletedVariant = product.variants[variantIndex];
        let variantName = deletedVariant.name || `Statis (Rp ${deletedVariant.price.toLocaleString('id-ID')})`;

        product.variants.splice(variantIndex, 1);
        saveDB(global.db);

        return reply(`*VARIAN BERHASIL DIHAPUS*\n\nProduk: ${product.name}\nVarian: ${variantName}`);
    }

    if (text && text.startsWith('del_target|')) {
        let [prodId, variantIndexStr] = text.replace('del_target|', '').split('|');
        let product = global.db.products[prodId];
        if (!product) return reply('[  !  ] Produk tidak ditemukan.');
        
        let v = product.variants[variantIndexStr];
        let vName = product.type === 'static' ? `Statis - Rp ${v.price.toLocaleString('id-ID')}` : v.name;

        return await onePaySendButton(sock, jid, {
            caption: `Tidak ada opsi pemulihan setelah ini.\nApakah kamu yakin ingin menghapus varian *${vName}* dari produk *${product.name}*?`,
            buttons: [
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Ya", id: `${prefix + command} confirm_del|${prodId}|${variantIndexStr}` }) },
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Tidak", id: `${prefix + command}` }) }
            ],
            bottom_sheet: false
        }, { quoted: m });
    }
    const products = Object.values(global.db.products || {});
    if (products.length === 0) return reply('[  !  ] Belum ada produk di database.');

    let buttons = [];

    for (const p of products) {
        if (!p.variants || p.variants.length === 0) continue;

        buttons.push({
            name: "single_select",
            buttonParamsJson: JSON.stringify({
                title: p.name,
                sections: [{
                    title: `Varian ${p.name}`,
                    rows: p.variants.map((v, index) => {
                        let label = p.type === 'static' 
                            ? `Rp ${v.price.toLocaleString('id-ID')}` 
                            : `${v.name} - Rp ${v.price.toLocaleString('id-ID')}`;
                        
                        let desc = p.type === 'static'
                            ? v.fields.map(f => `${f.key}: ${f.value}`).join(', ')
                            : `Stok: ${v.stocks?.length || 0}`;

                        return {
                            id: `${prefix + command} del_target|${p.id}|${index}`,
                            title: label,
                            description: desc
                        };
                    })
                }]
            })
        });
    }

    if (buttons.length === 0) return reply('[  !  ] Tidak ada produk yang memiliki varian.');

    return await onePaySendButton(sock, jid, {
        caption: `Pilih produk dan varian yang ingin dihapus:`,
        footer: global.toko?.footer || "OnePay Store",
        buttons: buttons,
        bottom_sheet: true,
        bottom_name: "Pilih Produk"
    }, { quoted: m });
};

handler.command = ['delvarian', 'hapusvarian'];
handler.tags = ['owner'];
handler.owner = true;

export default handler;
