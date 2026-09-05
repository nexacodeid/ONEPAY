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

let handler = async (m, { sock }) => {
    let start = Date.now()
    let msg = await onePaySendMessage(sock, m.key.remoteJid, { text: 'Testing speed...' }, { quoted: m })
    let speed = Date.now() - start
    await onePaySendMessage(sock, m.key.remoteJid, { text: `Pang!\nRespon: ${speed} ms` }, { quoted: msg })
}

handler.command = ['ping']
handler.tags = ['info']
handler.help = ['ping', 'monitor']

export default handler