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

let handler = async (m, { sock, text, reply, isOwner }) => {
    const __onepayOriginalReply = reply
    reply = (text, ...args) => __onepayOriginalReply(onePayText(text), ...args)
    if (!text || !text.includes('|')) {
        return reply(
            `Format salah!\n\n` +
            `Contoh:\n` +
            `.kirim 628xxx|Halo bang`
        )
    }

    let [number, ...msg] = text.split('|')

    let pesan = msg.join('|').trim()

    number = number.replace(/[^0-9]/g, '')

    if (!number || !pesan) {
        return reply('Nomor atau pesan tidak valid.')
    }

    let jid = number + '@s.whatsapp.net'

    try {
        let check = await sock.onWhatsApp(jid)

        if (!check || !check[0]?.exists) {
            return reply('Nomor tersebut tidak terdaftar di WhatsApp.')
        }

        await onePaySendMessage(sock, jid, {
            text: pesan
        })

        reply(
            `Berhasil mengirim pesan ke:\n` +
            `${number}`
        )
    } catch (e) {
        console.error(e)

        reply(
            `Gagal mengirim pesan.\n\n` +
            `${e.message}`
        )
    }
}

handler.command = ['kirim', 'send']
handler.tags = ['owner']
handler.owner = true

export default handler