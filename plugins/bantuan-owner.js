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

let handler = async (m, { sock, command, jid }) => {
    let owners = global.owner || []

    if (owners.length < 1) {
        return onePayReply(m.reply.bind(m), 'Owner tidak tersedia.')
    }

    let buttons = owners.map(num => {
        let cleanNum = num.replace(/[^0-9]/g, '')
        let waLink = `https://wa.me/${cleanNum}`

        return {
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
                display_text: `${cleanNum}`,
                url: waLink,
                merchant_url: waLink
            })
        }
    })

    await onePaySendButton(sock, jid, {
        image: {
            url: global.thumb.help
        },
        caption:
`Haii *${m.pushName || 'Kak'}* 👋

Jika ada pertanyaan, kendala transaksi, atau ingin request produk tertentu, silakan hubungi ${command} melalui tombol di bawah yaa~`,
        footer: global.toko?.footer || 'OnePay Store',
        buttons,
        bottom_sheet: false
    }, { quoted: m })
}

handler.command = ['owner', 'cs']
handler.tags = ['bantuan']

export default handler