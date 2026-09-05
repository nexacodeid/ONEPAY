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

const onePaySendRichResponse = (sock, target, payload, options) => sock.sendRichResponse(target, onePayPayload(payload), options)

const onePayReply = (reply, text, ...args) =>
    reply(onePayText(text), ...args)

let handler = async (m, { sock, prefix, jid, command }) => {
    let orders = global.db.orders || {};
    let products = global.db.products || {};
    let listOrder = Object.entries(orders);

    if (listOrder.length === 0) return onePayReply(m.reply.bind(m), 'Belum ada riwayat transaksi.');

    let tableRows = [];
    let totalSukses = 0;
    let totalPending = 0;
    let totalExpired = 0;
    let totalBatal = 0;
    let totalPendapatan = 0;
    let mentions = [];

    for (let [id, data] of listOrder) {
        let userId = data.sender || data.userid;
        let mentionUser = 'unknown';

        if (userId) {
            mentionUser = `@${userId.split('@')[0]}`;
            if (!mentions.includes(userId)) {
                mentions.push(userId);
            }
        }

        let status = data.status || 'PENDING';
        let productData = products[data.prodId] || {};
        let productName = productData.name ? productData.name.trim().toLowerCase() : 'unknown';
        
        let variantName = 'normal';
        let price = 0;
        
        if (productData.variants && Array.isArray(productData.variants) && productData.variants[data.varIdx]) {
            let variant = productData.variants[data.varIdx];
            variantName = variant.name ? variant.name.trim().toLowerCase() : 'normal';
            price = variant.price ? Number(variant.price) : 0;
        }

        if (status === 'SUCCESS') {
            totalSukses++;
            totalPendapatan += price;
        } else if (status === 'PENDING') {
            totalPending++;
        } else if (status === 'EXPIRED') {
            totalExpired++;
        } else if (status === 'CANCELLED' || status === 'BATAL') {
            totalBatal++;
        }

        tableRows.push([
            id,
            mentionUser,
            productName,
            variantName,
            String(price.toLocaleString('id-ID')),
            status
        ]);
    }

    let caption = `*REKAP TRANSAKSI*\n\n` +
                  `*Total Pendapatan:* Rp ${totalPendapatan.toLocaleString('id-ID')}\n` +
                  `*Pesanan Selesai:* ${totalSukses}\n` +
                  `*Pesanan Pending:* ${totalPending}\n` +
                  `*Pesanan Expired:* ${totalExpired}\n` +
                  `*Pesanan Batal:* ${totalBatal}`;

    await onePaySendRichResponse(sock, jid, {
        text: caption,
        table: {
            title: "Daftar Transaksi",
            headers: ["Invoice", "Pembeli", "Produk", "Varian", "Harga", "Status"],
            rows: tableRows
        },
    mentionedJid: mentions });
};

handler.command = ['rekap', 'listorder'];
handler.tags = ['owner'];
handler.owner = true;

export default handler;
