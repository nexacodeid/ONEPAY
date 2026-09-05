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

let handler = async (m, { sock, text, reply, jid }) => {
    const __onepayOriginalReply = reply
    reply = (text, ...args) => __onepayOriginalReply(onePayText(text), ...args)
    if (!text) {
        return reply(
            `Format salah!\n\n` +
            `Contoh:\n` +
            `.cekidch https://whatsapp.com/channel/0029Vb...`
        )
    }

    let link = text.trim()

    if (!link.includes('whatsapp.com/channel/')) {
        return reply('Link channel tidak valid.')
    }

    let code = link.split('/channel/')[1]?.split('?')[0]

    if (!code) {
        return reply('ID channel tidak ditemukan.')
    }

    try {
        let result = await sock.newsletterMetadata(
            "invite",
            code
        )

        let id = result.id
        let meta = result.thread_metadata

        await onePaySendButton(sock, jid, {
            text:
`*INFORMASI CHANNEL*
*Nama:*
${meta.name?.text || '-'}
*ID Channel:*
${result.id}
*Subscriber:*
${Number(meta.subscribers_count || 0).toLocaleString('id-ID')}
*Status Verifikasi:*
${meta.verification || '-'}
*Status Channel:*
${result.state?.type || '-'}
*Tanggal Dibuat:*
${new Date(Number(meta.creation_time) * 1000).toLocaleString('id-ID')}
`,
            footer: onePayText('OnePay • Panel & Product'),
            buttons: [
                {
                    name: "cta_copy",
                    buttonParamsJson: JSON.stringify({
                        display_text: "Salin ID",
                        copy_code: id
                    })
                }
            ]
        }, { quoted: m })

    } catch (e) {
        reply('Gagal mengambil data channel.')
    }
}

handler.command = ['cekidch', 'idch']
handler.tags = ['tools']

export default handler