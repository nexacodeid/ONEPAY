import './config.js'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import util from 'util'
import { exec } from 'child_process'
import chokidar from 'chokidar'
import { fileURLToPath, pathToFileURL } from 'url'
import { onePayText, brandOnePaySocket, ONEPAY_WEBSITE } from './lib/onepay.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginFolder = path.join(__dirname, 'plugins');

global.plugins = {};
global.antispam = global.antispam || {}

async function scanDir(dir) {
    let subdirs = await fs.promises.readdir(dir, { withFileTypes: true });
    let files = await Promise.all(subdirs.map(async (dirent) => {
        let res = path.resolve(dir, dirent.name);
        return dirent.isDirectory() ? scanDir(res) : res;
    }));
    return files.flat();
}

const blue = (t) => `\x1b[96m${t}\x1b[0m`
const green = (t) => `\x1b[92m${t}\x1b[0m`
const red = (t) => `\x1b[31m${t}\x1b[0m`
const yellow = (t) => `\x1b[93m${t}\x1b[0m`

async function loadPlugin(filename) {  
    const fileUrl = pathToFileURL(filename).href;  
    try {  
        const module = await import(`${fileUrl}?update=${Date.now()}`);  
        return module.default || module;  
    } catch (e) {  
        console.error(red(`[ ERROR ] Gagal memuat plugin ${path.basename(filename)}:`), e);  
        return null;  
    }  
}  
  
async function initPlugins() {  
    try {  
        let files = await scanDir(pluginFolder);  
        for (let file of files) {  
            if (file.endsWith('.js')) {  
                let name = file.replace(path.join(__dirname, 'plugins'), '').replace(/\\/g, '/');  
                global.plugins[name] = await loadPlugin(file);  
            }  
        }  
        console.log(green(`[ SUCCESS ] Memuat ${Object.keys(global.plugins).length} plugin`));  
    } catch (e) {  
        console.error(red(`[ ERROR ] Gagal inisialisasi folder plugin:`), e);  
    }  
}  
  
await initPlugins();  
  
const watcher = chokidar.watch(pluginFolder, {  
    persistent: true,  
    ignoreInitial: true,  
});  
  
watcher  
    .on('add', async (filename) => {  
        console.log(green(`[ BARU ] Terdeteksi file baru: ${path.basename(filename)}`));  
        let name = filename.replace(path.join(__dirname, 'plugins'), '').replace(/\\/g, '/');  
        global.plugins[name] = await loadPlugin(filename);  
    })  
    .on('change', async (filename) => {  
        console.log(blue(`[ UPDATE ] Memuat ulang file: ${path.basename(filename)}`));  
        let name = filename.replace(path.join(__dirname, 'plugins'), '').replace(/\\/g, '/');  
        global.plugins[name] = await loadPlugin(filename);  
    })  
    .on('unlink', (filename) => {  
        console.log(red(`[ HAPUS ] File dihapus: ${path.basename(filename)}`));  
        let name = filename.replace(path.join(__dirname, 'plugins'), '').replace(/\\/g, '/');  
        delete global.plugins[name];  
    });

export const handler = async (sock, m) => {
    if (!m.message) return
    if (m.key.fromMe) return

    const body =
  m.message?.conversation ||
  m.message?.extendedTextMessage?.text ||
  m.message?.imageMessage?.caption ||
  m.message?.videoMessage?.caption ||
  m.message?.templateButtonReplyMessage?.selectedId ||   
  m.message?.buttonsResponseMessage?.selectedButtonId ||
  m.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
  (m.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson &&
    JSON.parse(m.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson)?.id) ||
  ''

    const prefix = global.prefix.find(p => body.startsWith(p))
    const isCmd = !!prefix
    const command = isCmd
        ? body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase()
        : ''
    
    const text = isCmd
        ? body.slice(prefix.length + command.length).trim()
        : body.trim()

    const isGroup = m.key.remoteJid.endsWith('@g.us')
    const isNewsletter = m.key.remoteJid.endsWith('@newsletter')
    const chatType = isGroup ? 'Group' : isNewsletter ? 'Newsletter' : 'Private'

    const sender = isGroup ? m.key.participant : m.key.remoteJid
    const number = sender?.split('@')[0] || '-'
    const pushname = m.pushName || 'Unknown'
    const jid = m.key.remoteJid
    if (!jid) return
    const lidBotNumber = await sock.decodeJid(sock.user.lid);
    const botNumber = await sock.decodeJid(sock.user.id);
    const isOwner =
  global.owner.includes(number) ||
  global.lidowners?.includes(number)
    const isPremium = isOwner || global.premium.includes(number)

    // OnePay branding lives in lib/onepay.js, not config.js.
    brandOnePaySocket(sock)

    const reply = (text) => {
        return sock.sendMessage(jid, { text: onePayText(text) }, { quoted: m })
    }

    m.reply = reply

    const msgType = Object.keys(m.message)[0]
    const timeLog = new Date().toLocaleTimeString('id-ID')
    if (isCmd) {
        console.log(green(`┌─ [ COMMAND DETECTED ] ───`))
        console.log(green(`│ Waktu : ${timeLog}`))
        console.log(green(`│ User  : ${pushname} (@${number})`))
        console.log(green(`│ Room  : ${chatType} (${jid})`))
        console.log(green(`┠─ [ DATA ] ───`))
        console.log(green(`│ Cmd   : ${prefix}${command}`))
        if (text) console.log(green(`│ Args  : ${text}`))
        console.log(green(`└───────────────────────────\n`))
    } else if (body) {
        console.log(blue(`┌─ [ MESSAGE DETECTED ] ───`))
        console.log(blue(`│ Waktu : ${timeLog}`))
        console.log(blue(`│ User  : ${pushname} (@${number})`))
        console.log(blue(`│ Room  : ${chatType} (${jid})`))
        console.log(blue(`┠─ [ CONTENT ] ───`))
        console.log(blue(`│ Type  : ${msgType}`))
        console.log(blue(`│ Text  : ${body}`))
        console.log(blue(`└───────────────────────────\n`))
    }
    
    if (isOwner && body) {
        if (body.startsWith("=>")) {
            let code = body.slice(2).trim()
            let { key } = await sock.sendMessage(jid, { text: "Evaling..." }, { quoted: m })
            try {
                let result = await eval(`(async () => { return ${code} })()`)
                await sock.sendMessage(jid, { text: util.format(result), edit: key })
            } catch (e) {
                await sock.sendMessage(jid, { text: util.format(e), edit: key })
            }
            return
        }

        if (body.startsWith(">")) {
            let code = body.slice(1).trim()
            let { key } = await sock.sendMessage(jid, { text: "Evaling..." }, { quoted: m })
            try {
                let result = await eval(body.slice(2))
                await sock.sendMessage(jid, { text: util.inspect(result), edit: key })
            } catch (e) {
                await sock.sendMessage(jid, { text: util.format(e), edit: key })
            }
            return
        }

        if (body.startsWith("$")) {
            let cmd = body.slice(1).trim()
            let { key } = await sock.sendMessage(jid, { text: "Executing..." }, { quoted: m })
            exec(cmd, async (err, stdout, stderr) => {
                if (err) return await sock.sendMessage(jid, { text: util.format(err), edit: key })
                if (stderr) return await sock.sendMessage(jid, { text: stderr, edit: key })
                await sock.sendMessage(jid, { text: stdout || "No output", edit: key })
            })
            return
        }
    }
    
    if (!isCmd && global.addVarianSession?.[sender] && isOwner && body) {
        const pluginAddVarian = global.plugins['/owner-addvarian.js'] || global.plugins['owner-addvarian.js'];
        if (pluginAddVarian) {
            try {
                await pluginAddVarian(m, { sock, text: body, prefix, command: 'addvarian', reply, sender, jid, isOwner, isAdmin: true, isPremium });
                return;
            } catch (e) {
                console.error('Error Interceptor AddVarian:', e);
            }
        }
    }
        
    if (global.addStokSession[sender] && global.addStokSession[sender].stage === 'WAITING_FILE' && (msgType === 'documentMessage' || (msgType === 'extendedTextMessage' && m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.documentMessage))) {
    const session = global.addStokSession[sender];
    const docMessage = msgType === 'documentMessage' ? m.message.documentMessage : m.message.extendedTextMessage.contextInfo.quotedMessage.documentMessage;

    if (docMessage.mimetype !== 'text/plain') {
        return reply('[!] File harus berupa format .txt! Silakan kirim ulang file yang valid.');
    }

    let buffer;
    try {
        const { downloadContentFromMessage } = await import('@whiskeysockets/baileys');
        const stream = await downloadContentFromMessage(docMessage, 'document');
        let chunks = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        buffer = Buffer.concat(chunks);
    } catch (err) {
        console.error(err);
        return reply('[!] Gagal mendownload file, silakan kirim ulang.');
    }

    if (!buffer) return reply('[!] Gagal mendownload file, silakan kirim ulang.');

    const fileContent = buffer.toString('utf-8');
    const rawStocks = fileContent.split(',');
    const parsedStocks = [];

    rawStocks.forEach(raw => {
        if (!raw.trim()) return;
        let lines = raw.split(/\r?\n/);
        let fields = [];

        lines.forEach(line => {
            let parts = line.split(':');
            if (parts.length >= 2) {
                let key = parts.shift().trim();
                let val = parts.join(':').trim();
                if (key && val) {
                    fields.push({ key: key, value: val });
                }
            }
        });

        if (fields.length > 0) {
            parsedStocks.push({ fields: fields });
        }
    });

    if (parsedStocks.length === 0) return reply('[!] File .txt tidak berisi data dengan format yang benar (Kolom: Isi).');

    session.stage = 'WAITING_CONFIRM';
    session.tempStokData = parsedStocks;

    let sampleText = session.tempStokData[0].fields.map(f => `${f.key}: ${f.value}`).join('\n');

    return await sock.sendButton(jid, {
        caption: `*VERIFIKASI DATA STOK*\n\n- Total terdeteksi: *${parsedStocks.length} item stok*\n\n*Sampel Data 1:*\n\`\`\`${sampleText}\`\`\`\n\nApakah data di atas sudah benar untuk dimasukkan ke database?`,
        footer: global.toko?.footer || "OnePay Store",
        buttons: [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Ya", id: `.addstok confirm_yes` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Tidak", id: ".addstok batal" }) }
        ],
        bottom_sheet: false
    }, { quoted: m });
}

    
    if (!isCmd && (msgType === 'imageMessage' || (msgType === 'extendedTextMessage' && m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage))) {
        if (global.db?.orders) {
            const userOrders = Object.values(global.db.orders).filter(o => o.userid === sender && o.status === 'PENDING');
            if (userOrders.length > 0) {
                const pluginBeli = global.plugins['/user-beli.js'] || global.plugins['user-beli.js'];
                if (pluginBeli) {
                    try {
                        await pluginBeli(m, { sock, text, prefix, command, reply, sender, jid, isOwner, isAdmin: false, isPremium });
                        return;
                    } catch (e) {
                        console.error('Error auto-trigger plugin beli:', e);
                    }
                }
            }
        }
    }
    
    global.antispam = global.antispam || {}

if (
    isCmd &&
    !isGroup &&
    !isOwner &&
    global.appConfig?.antispam?.status
) {
    const config = global.appConfig.antispam
    const now = Date.now()

    if (!global.antispam[sender]) {
        global.antispam[sender] = {
            count: 0,
            last: now,
            warned: false,
            cooldown: 0,
            cooldownMsg: false,
            violations: 0,
            lastCmd: '',
            sameCmd: 0
        }
    }

    const spam = global.antispam[sender]

    if (now - spam.last > config.interval) {
        spam.count = 0
        spam.sameCmd = 0
        spam.violations = 0
        spam.warned = false
        spam.cooldownMsg = false
    }

    spam.last = now

    if (spam.cooldown > now) {
        spam.violations++

        if (!spam.cooldownMsg) {
            spam.cooldownMsg = true

            let left = Math.ceil((spam.cooldown - now) / 1000)

            reply(
                `Kamu sedang terkena cooldown karena spam command.\n\n` +
                `Silakan tunggu ${left} detik sebelum menggunakan bot kembali.`
            )
        }

        if (spam.violations >= config.block) {
    await sock.sendMessage(jid, {
        text:
`Kamu akan diblokir & blacklist otomatis oleh sistem karena terdeteksi melakukan spam melewati batas yg bisa di toleransi.

Kalau merasa ini keliru atau ga seneng sama sistemnya, hubungi owner terus spam/gelut dia aja 🗿`
    }, { quoted: m }).catch(() => null)
    await sock.updateBlockStatus(sender, 'block')
        .catch(() => null)
    delete global.antispam[sender]
    return
}
        return
    }

    spam.count++

    if (spam.lastCmd === command) {
        spam.sameCmd++
    } else {
        spam.sameCmd = 0
    }

    spam.lastCmd = command

    if (
        (spam.count >= config.warning ||
        spam.sameCmd >= 5) &&
        !spam.warned
    ) {
        spam.warned = true
        spam.cooldown = now + config.cooldown
        spam.cooldownMsg = false

        return reply(
            `Terdeteksi spam command.\n\n` +
            `Bot dikunci sementara selama ${config.cooldown / 1000} detik.\n` +
            `Jangan spam command terus menerus ya.`
        )
    }
}
    if (!isCmd) return
    if (global.selfmode && !isOwner) return

    let groupMetadata = {}
    let participants = []
    let isAdmin = false

    if (isGroup) {
        groupMetadata = await sock.groupMetadata(jid)
        participants = groupMetadata.participants || []
        isAdmin = participants.some(v => v.id === sender && v.admin !== null)
    }

        for (let name in plugins) {
        const plugin = plugins[name]
        if (!plugin || !plugin.command) continue
        let isMatch = false
        if (Array.isArray(plugin.command)) {
            isMatch = plugin.command.includes(command)
        } else if (plugin.command instanceof RegExp) {
            isMatch = plugin.command.test(command)
        } else if (typeof plugin.command === 'string') {
            isMatch = plugin.command === command
        }
        if (isMatch) {
            if (plugin.owner && !isOwner) return reply(global.mess.owner)
            if (plugin.premium && !isPremium) return reply(global.mess.premium)
            if (plugin.group && !isGroup) return reply(global.mess.group)
            if (plugin.admin && !isAdmin) return reply(global.mess.admin)
            if (plugin.private && isGroup) return reply(global.mess.private)

            try {
                await plugin(m, { sock, text, prefix, command, reply, sender, jid, isOwner, isAdmin, isPremium })
            } catch (e) {
                console.error(e)
            }
            break
        }
    }
}
