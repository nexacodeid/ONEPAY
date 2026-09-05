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

let handler = async (m, { sock, reply, sender, text, jid }) => {
    const __onepayOriginalReply = reply
    reply = (text, ...args) => __onepayOriginalReply(onePayText(text), ...args)
    if (!text) {
        return reply(
            `Format salah!\n\n` +
            `Contoh:\n` +
            `.report Ada bug di menu checkout\n\n` +
            `Atau reply gambar/video:\n` +
            `.report Nih errornya`
        )
    }

    let owners = global.owner || []

    if (owners.length < 1) {
        return reply('Owner tidak tersedia.')
    }

    let quotedMsg = null

    if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        quotedMsg = {
            key: {
                remoteJid: jid,
                id: m.message.extendedTextMessage.contextInfo.stanzaId,
                participant: m.message.extendedTextMessage.contextInfo.participant
            },
            message: m.message.extendedTextMessage.contextInfo.quotedMessage
        }
    }

    let selfType = Object.keys(m.message || {})[0]

    let isDirectMedia =
        /imageMessage|videoMessage/.test(selfType)

    let reportText =
`*REPORT BARU MASUK*

*User:* @${sender.split('@')[0]}
*Sumber:* ${jid.endsWith('@g.us') ? 'Group' : 'Private Chat'}

*Detail:*
${text}
`

    for (let num of owners) {
        let ownerJid = num.replace(/[^0-9]/g, '') + '@s.whatsapp.net'

        if (quotedMsg) {
            await onePaySendMessage(sock, ownerJid, {
                forward: quotedMsg
            }).catch(() => null)

        } else if (isDirectMedia) {
            await onePaySendMessage(sock, ownerJid, {
                forward: m
            }).catch(() => null)
        }

        await onePaySendMessage(sock, ownerJid, {
            text: reportText,
            mentions: [sender]
        })
    }

    await onePaySendMessage(sock, jid, {
        text:
`Laporan kamu berhasil dikirim dan akan segera ditinjau oleh tim terkait.

Terima kasih atas report yang kamu kirimkan.`
    }, { quoted: m })
}

handler.command = ['report']
handler.tags = ['bantuan']

export default handler