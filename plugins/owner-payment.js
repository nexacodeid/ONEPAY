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

const onePayReply = (reply, text, ...args) =>
    reply(onePayText(text), ...args)

let handler = async (m, { sock, jid }) => {
    let paymentData = global.payment || {};
    
    if (Object.keys(paymentData).length === 0) return onePayReply(m.reply.bind(m), 'Belum ada data pembayaran di database.');

    let qrisUrl = paymentData.qris || '';
    let captionArr = [];

    captionArr.push(`╭──⧼ scan here ⧽`);
    
    for (let [method, value] of Object.entries(paymentData)) {
        let formattedMethod = method.charAt(0).toUpperCase() + method.slice(1);
        captionArr.push(`│┃⤿ ֵ 𝖼⃘𐑋  ˒˓ ${formattedMethod} ⨾ ${value}`);
    }
    
    captionArr.push(`╰─────────────❏`);

    let caption = captionArr.join('\n');

    if (qrisUrl && qrisUrl.trim() !== '') {
        try {
            await onePaySendMessage(sock, jid, {
                image: { url: qrisUrl },
                caption: caption
            }, { quoted: m });
        } catch (err) {
            await onePaySendMessage(sock, jid, {
                text: caption
            }, { quoted: m });
        }
    } else {
        await onePaySendMessage(sock, jid, {
            text: caption
        }, { quoted: m });
    }
};

handler.command = ['payment'];
handler.tags = ['store'];

export default handler;
