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

import fs from 'fs'
import { execSync } from 'child_process'

let handler = async (m, { sock, reply }) => {
    const __onepayOriginalReply = reply
    reply = (text, ...args) => __onepayOriginalReply(onePayText(text), ...args)
    const sampahDir = './sampah'
    if (!fs.existsSync(sampahDir)) fs.mkdirSync(sampahDir)

    try {
        for (let f of fs.readdirSync(sampahDir)) {
            fs.unlinkSync(`${sampahDir}/${f}`)
        }

        reply('Wait....')

        const zipName = global.namebot.replace(/\s+/g, '_') + '.zip'
        const zipPath = `${sampahDir}/${zipName}`

        const exclude = [
            'node_modules',
            'session',
            'package-lock.json',
            'yarn.lock',
            '.npm',
            '.cache',
            'sampah'
        ]

        const files = fs.readdirSync('.').filter(v => !exclude.includes(v))
        if (!files.length) return reply('Tidak ada file yang bisa dibackup.')

        execSync(`zip -r "${zipPath}" ${files.map(v => `"${v}"`).join(' ')}`)

        await onePaySendMessage(sock, 
            m.key.remoteJid,
            {
                document: fs.readFileSync(zipPath),
                fileName: zipName,
                mimetype: 'application/zip'
            },
            { quoted: m }
        )

        fs.unlinkSync(zipPath)

    } catch (e) {
        console.error(e)
        reply('Backup gagal.')
    }
}

handler.command = ['backup', 'backupsc', 'bck']
handler.tags = ['owner']
handler.help = ['backup']
handler.owner = true

export default handler