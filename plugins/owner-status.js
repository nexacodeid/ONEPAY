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
import { fileURLToPath } from 'url';
import { saveDB } from '../lib/database.js';
import { sleep } from '../lib/utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, '../config.js');

let handler = async (m, { sock, text, reply }) => {
    const __onepayOriginalReply = reply
    reply = (text, ...args) => __onepayOriginalReply(onePayText(text), ...args)
    const status = text.toLowerCase();
    if (!['buka', 'tutup'].includes(status)) {
        return reply('[  !  ] Status tidak valid. Gunakan .mode buka atau .mode tutup');
    }

    try {
        let lines = fs.readFileSync(configPath, 'utf8').split('\n');
        let insideToko = false;
        let found = false;

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('global.toko')) insideToko = true;
            
            if (insideToko && lines[i].includes('status:')) {
                lines[i] = lines[i].replace(/status:\s*["'](buka|tutup)["']/, `status: "${status}"`);
                found = true;
                break; 
            }
            
            if (insideToko && lines[i].includes('}')) insideToko = false;
        }

        if (!found) return reply('[  !  ] Variabel status di dalam global.toko tidak ditemukan.');

        fs.writeFileSync(configPath, lines.join('\n'), 'utf8');
        global.toko.status = status;

        if (status === 'buka' && global.db.notify && global.db.notify.length > 0) {
            let totalUsers = global.db.notify.length;
            let pesan = `✨ *TOKO SUDAH BUKA KEMBALI!* ✨\n\nHaii, penantian kamu berakhir! Toko kami sudah online dan siap melayani pesananmu lagi.\n\nStok produk yang kamu incar tadi sudah ready & fresh banget. Jangan sampai kehabisan lagi ya, karena yang lain juga lagi berebutan nih! 🏃💨\n\nYuk, langsung gas checkout sekarang sebelum nyesel karena kehabisan lagi. Kami tunggu pesanan kamu di sini ya!`;
            
            for (let jid of global.db.notify) {
                await onePaySendMessage(sock, jid, { text: pesan }).catch(() => null);
                await sleep(5000); 
            }
            
            global.db.notify = [];
            saveDB(global.db);
            
            return reply(`[  !  ] Mode toko diubah menjadi *BUKA* & notifikasi telah dikirim ke ${totalUsers} pelanggan.`);
        }

        return reply(`[  !  ] Mode toko berhasil diubah menjadi: *${status.toUpperCase()}*`);
    } catch (e) {
        console.error(e);
        return reply('[  !  ] Gagal memperbarui config.js.');
    }
};

handler.command = ['mode'];
handler.tags = ['owner'];
handler.owner = true;

export default handler;
