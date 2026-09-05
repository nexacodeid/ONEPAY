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

import fs from 'fs';
import path from 'path';

let handler = async (m, { sock, jid, command, prefix, reply }) => {
    const __onepayOriginalReply = reply
    reply = (text, ...args) => __onepayOriginalReply(onePayText(text), ...args)
    let quoted = m.quoted ? m.quoted : m;
    let mime = (quoted.msg || quoted).mimetype || '';

    if (!mime && m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        let qMsg = m.message.extendedTextMessage.contextInfo.quotedMessage;
        let type = Object.keys(qMsg)[0];
        let msg = qMsg[type];
        if (msg.mimetype) { quoted = { msg, mtype: type }; mime = msg.mimetype; }
    }

    if (!mime) return reply(`[ ! ] Kirim atau balas media dengan perintah ${prefix + command}`);
    return reply('Fitur upload URL eksternal dinonaktifkan. OnePay tidak menggunakan CDN eksternal. Media diproses langsung oleh bot.');
};

handler.command = ['tourl', 'upload', 'cdn'];
handler.tags = ['tools'];
export default handler;
