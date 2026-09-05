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

let handler = async (m, { sock, jid, text }) => {
  const args = text ? text.trim().split(/\s+/) : []
 
  if (!global.lastFaqMsg) global.lastFaqMsg = {}
  const lastMsg = global.lastFaqMsg[jid]
  if (lastMsg) {
    await onePaySendMessage(sock, jid, { delete: lastMsg }).catch(() => {})
    delete global.lastFaqMsg[jid]
  }
  if (!args[0] || args[0] === 'back') {
    const msg = await onePaySendButton(sock, jid, {
      text: "*FAQ*\nPertanyaan umum dari pelanggan",
      footer: toko.footer,
      buttons: global.faq.map((f, i) => ({
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: f.tanya,
          id: `.faq ${i}`
        })
      })),
      bottom_sheet: true,
      bottom_name: "FAQ"
    }, {quoted: m})
    global.lastFaqMsg[jid] = msg.key
    return
  }
  const index = Number(args[0])
  if (isNaN(index) || !global.faq[index]) return

  const faq = global.faq[index]
  const msg = await onePaySendButton(sock, jid, {
    caption: `*❓ ${faq.tanya}*\n\n${faq.jawab}`,
    footer: toko.footer,
    buttons: [
      {
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: "Back",
          id: ".faq back"
        })
      }
    ],
    bottom_sheet: false
  }, {quoted: m})
  global.lastFaqMsg[jid] = msg.key
}

handler.command = ['faq']
handler.tags = ['info', 'bantuan']
export default handler