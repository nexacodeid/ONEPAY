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

import { saveDB } from '../lib/database.js';

global.paymentProofs = global.paymentProofs || {};

let handler = async (m, { sock, command, text, reply, isOwner, jid, sender }) => {
    const __onepayOriginalReply = reply
    reply = (text, ...args) => __onepayOriginalReply(onePayText(text), ...args)
    const args = text ? text.split(' ') : [];
    
    if (!global.db.orders) global.db.orders = {};
    if (!global.db.users) global.db.users = {};

    if (!global.db.users[sender]) {
        global.db.users[sender] = {
            name: m.pushName || 'Customer Bot Store OnePay',
            txHistory: []
        };
        saveDB(global.db);
    }

    const userData = global.db.users[sender];
    const msgType = m.message ? Object.keys(m.message)[0] : '';
    const isImage = msgType === 'imageMessage' || (msgType === 'extendedTextMessage' && m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage);

    if (isImage && command !== 'batal' && !command?.startsWith('reject')) {
        const userOrders = Object.values(global.db.orders).filter(o => o.userid === sender && o.status === 'PENDING');
        if (userOrders.length === 0) return;

        const latestOrder = userOrders.sort((a, b) => b.timestamp - a.timestamp)[0];
        global.paymentProofs[latestOrder.id] = m;

        return await onePaySendButton(sock, jid, {
            caption: `Haii *${userData.name}*, bukti transfer untuk pesanan *${latestOrder.id}* sudah diterima.\n\nApakah gambar yang dikirim sudah benar?`,
            footer: global.toko?.footer || "OnePay Store",
            buttons: [
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Udah Benar", id: `.konfirmasi_tf ${latestOrder.id}` }) },
                { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Batal/Ganti Gambar", id: `.batal ${latestOrder.id}` }) }
            ],
            bottom_sheet: false
        }, { quoted: m });
    }

    switch (command) {
        case 'beli':
            const products = Object.values(global.db.products || {});
            if (products.length === 0) return reply('Produk kosong.');
                let listBtns = products.map(p => ({
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: p.name,
                        id: `.produk ${p.name}`
                    })
                }));

                return await onePaySendButton(sock, jid, {
                    caption: `Katalog ${global.toko?.nama || "Store"}\n\nPilih produk:`,
                    footer: global.toko?.footer || "Store",
                    buttons: listBtns,
                    bottom_sheet: true,
                    bottom_name: "Pilih Produk"
                }, { quoted: m });

        case 'checkout':
            if (args.length < 2) return reply('Format salah!');
            let cProdId = args[0];
            let varIdx = parseInt(args[1]);
            
            let cProduct = global.db.products[cProdId];
            if (!cProduct) return reply('Produk tidak ditemukan!');
            let cVariant = cProduct.variants[varIdx];

            if (cProduct.type === 'dynamic' && (!cVariant.stocks || cVariant.stocks.length === 0)) {
                return reply('Maaf, stok untuk varian ini sedang kosong.');
            }

            if (global.toko?.status === 'tutup') {
                return await onePaySendButton(sock, jid, {
                    caption: `Toko kami sedang tutup. Pembayaran akan dikonfirmasi setelah kami buka kembali. Tetap lanjutkan?`,
                    buttons: [
                        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Ya", id: `.proses_checkout ${cProdId} ${varIdx} confirmed` }) },
                        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Tidak", id: `.info_batal` }) }
                    ],
                    bottom_sheet: false
                }, { quoted: m });
            }

            await generateInvoice(sock, jid, sender, cProduct, cVariant, cProdId, varIdx, userData, m);
            break;

        case 'proses_checkout':
            if (args[2] === 'confirmed') {
                let pProdId = args[0];
                let pVarIdx = parseInt(args[1]);
                let pProduct = global.db.products[pProdId];
                let pVariant = pProduct?.variants[pVarIdx];
                if (!pProduct || !pVariant) return reply('Data produk tidak valid.');
                
                await generateInvoice(sock, jid, sender, pProduct, pVariant, pProdId, pVarIdx, userData, m);
            }
            break;

        case 'info_batal':
            return await onePaySendButton(sock, jid, {
                caption: "Ingin diberitahu saat Owner sudah kembali online dan membuka toko nya?",
                buttons: [
                    { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Ya", id: `.save_notify` }) },
                    { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Tidak", id: `.tutup_pesan` }) }
                ],
                bottom_sheet: false
            }, { quoted: m });

        case 'save_notify':
            if (!global.db.notify) global.db.notify = [];
            if (!global.db.notify.includes(sender)) {
                global.db.notify.push(sender);
                saveDB(global.db);
                
                let ownerJid = (global.owner[0].includes('@') ? global.owner[0] : global.owner[0] + '@s.whatsapp.net');
                await onePaySendMessage(sock, ownerJid, { text: `Notifikasi Aktif: Pelanggan @${sender.split('@')[0]} minta diinfokan saat toko buka.\n*Note:* Otomatis di infokan saat kamu mengetik .mode buka`, mentions: [sender] }).catch(() => null);
                
                return reply("Baik, notifikasi sudah diaktifkan. Kami akan mengabari kamu saat owner sudah online kembali. Terima kasih!");
            }
            return reply("Kamu sudah terdaftar dalam daftar notifikasi.");

        case 'tutup_pesan':
            return reply("Terima kasih sudah berkunjung. Sampai jumpa lagi, kami tunggu pesananmu di lain waktu!");

        case 'konfirmasi_tf':
            let kOrderId = args[0];
            let kOrder = global.db.orders[kOrderId];
            if (!kOrder) return reply('Order invalid.');

            if (kOrder.userid !== sender) {
                return reply('Akses ditolak! Tombol ini hanya bisa diklik oleh pembeli yang melakukan checkout.');
            }

            kOrder.status = 'WAITING_CONFIRMATION';
            saveDB(global.db);

            await reply(`Bukti transfer sedang dicek oleh Owner. Harap tunggu konfirmasi...`)
            let proofMsg = global.paymentProofs[kOrderId];
            let ownerJid = (global.owner[0].includes('@') ? global.owner[0] : global.owner[0] + '@s.whatsapp.net'); 

            if (proofMsg) {
                await onePaySendMessage(sock, ownerJid, { forward: proofMsg }).catch(e => console.error('Gagal forward gambar:', e));
            }

            await onePaySendButton(sock, ownerJid, {
                caption: `PESANAN BARU MASUK\n\nOrder ID: ${kOrderId}\nUser: ${userData.name} (@${kOrder.userid.split('@')[0]})\nProduk: ${global.db.products[kOrder.prodId].name}\n\nSilakan cek gambar di atas. Konfirmasi pembayaran dari user ini?`,
                footer: "Owner Panel - " + (global.toko?.nama || "Bot Store OnePay"),
                buttons: [
                    { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Terima", id: `.acc ${kOrderId}` }) },
                    { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Tolak", id: `.tolak ${kOrderId}` }) }
                ],
                bottom_sheet: false
            });
            break;

        case 'acc':
            if (!isOwner) return reply('Akses ditolak! Fitur ini khusus Owner.');
            let aOrderId = args[0];
            let aOrder = global.db.orders[aOrderId];
            
            if (!aOrder) return reply('Order tidak ditemukan di database.');
            if (aOrder.status !== 'WAITING_CONFIRMATION') return reply('Status pesanan ini bukan menunggu konfirmasi.');

            let targetUser = global.db.users[aOrder.userid] || { name: 'Customer' };
            let p = global.db.products[aOrder.prodId];
            let v = p.variants[aOrder.varIdx];

            aOrder.status = 'SUCCESS';
            saveDB(global.db);

            reply(`Order ${aOrderId} berhasil di ACC!`);

            if (p.type === 'static') {
                return onePaySendMessage(sock, aOrder.jid, { text: `PEMBAYARAN DITERIMA\n\nHaii *${targetUser.name}*, Invoice: ${aOrderId}\n\nPesanan kamu sedang diproses dan akan segera dikirim. Terima kasih!` }, { quoted: m });
            } else if (p.type === 'dynamic') {
                let stock = v.stocks.splice(0, 1)[0];
                saveDB(global.db);
                
                let msgToUser = `PEMBAYARAN DITERIMA\n\nHaii *${targetUser.name}*, berikut detail data pesanan untuk Invoice *${aOrderId}*:\n\n`;
                stock.fields.forEach(f => {
                    msgToUser += `${f.key}: ${f.value}\n`;
                });
                msgToUser += `\nTolong segera amankan data pesananmu!`;
                
                const isGroupTx = aOrder.jid.endsWith('@g.us');

                if (isGroupTx) {
                    await onePaySendMessage(sock, aOrder.jid, { text: `Haii *${targetUser.name}*, pembayaran invoice *${aOrderId}* diterima! Detail produk sudah dikirim ke Chat Pribadi (PC).` }, { quoted: m });
                    return onePaySendMessage(sock, aOrder.userid, { text: msgToUser });
                } else {
                    return onePaySendMessage(sock, aOrder.userid, { text: msgToUser });
                }
            }
            break;

        case 'tolak':
            if (!isOwner) return reply('Akses ditolak! Fitur ini khusus Owner.');
            let tOrderId = args[0];
            let tOrder = global.db.orders[tOrderId];
            
            if (!tOrder) return reply('Order tidak ditemukan di database.');
            if (tOrder.status !== 'WAITING_CONFIRMATION') return reply('Status pesanan ini bukan menunggu konfirmasi.');

            return await onePaySendButton(sock, jid, {
                caption: `PILIH ALASAN PENOLAKAN\n\nSilakan pilih alasan penolakan untuk Order ID *${tOrderId}* di bawah ini agar dikirimkan langsung ke pembeli.`,
                buttons: [
                    { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Bukti TF Tidak Valid", id: `.reject_reason ${tOrderId} 1` }) },
                    { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Nominal Tidak Sesuai", id: `.reject_reason ${tOrderId} 2` }) },
                    { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Stok Mendadak Habis", id: `.reject_reason ${tOrderId} 3` }) }
                ],
                bottom_sheet: false
            });

        case 'reject_reason':
            if (!isOwner) return reply('Akses ditolak!');
            let rOrderId = args[0];
            let reasonType = args[1];
            let rOrder = global.db.orders[rOrderId];

            if (!rOrder || rOrder.status !== 'WAITING_CONFIRMATION') return reply('Order sudah di-handle atau berkas hilang.');

            let reasonText = "Bukti transfer tidak valid atau tidak terbaca.";
            if (reasonType === '2') reasonText = "Nominal transfer tidak sesuai dengan tagihan invoice.";
            if (reasonType === '3') reasonText = "Maaf, stok item varian ini mendadak habis atau sedang gangguan.";

            rOrder.status = 'CANCELLED';
            saveDB(global.db);

            let rUser = global.db.users[rOrder.userid] || { name: 'Customer' };
            
            reply(`Order ${rOrderId} berhasil ditolak dengan alasan: _${reasonText}_`);
            
            return onePaySendMessage(sock, rOrder.jid, { 
                text: `Haii *${rUser.name}*, pembayaran untuk pesanan *${rOrderId}* telah *DITOLAK* oleh admin.\n\n*Alasan Penolakan:* ${reasonText}\n\n_Silakan hubungi admin (ketik .cs) atau lakukan checkout ulang jika dirasa ada kekeliruan._` 
            });

        case 'batal':
            let cancelId = args[0];
            let cancelOrder = global.db.orders[cancelId];
            if (!cancelOrder) return reply('Data pesanan tidak ditemukan.');
            
            if (cancelOrder.userid !== sender && !isOwner) {
                return reply('Akses ditolak! Kamu tidak bisa membatalkan pesanan milik orang lain.');
            }
            if (cancelOrder.status === 'SUCCESS') {
                return reply('Gagal membatalkan! Pesanan ini sudah sukses di-ACC dan diproses.');
            }
            if (cancelOrder.status === 'WAITING_CONFIRMATION') {
                return reply('Gagal membatalkan! Bukti transfer kamu sedang dalam proses pengecekan oleh Owner.');
            }
            if (cancelOrder.status === 'CANCELLED' || cancelOrder.status === 'EXPIRED') {
                return reply(`Pesanan ini memang sudah berstatus *${cancelOrder.status}*.`);
            }
            cancelOrder.status = 'CANCELLED';
            saveDB(global.db);

            await reply(`Pesanan *${cancelId}* berhasil dibatalkan.`);
            if (cancelOrder.msgKey) {
                await onePaySendMessage(sock, jid, { delete: cancelOrder.msgKey }).catch(() => null);
            }
            break;
    }
};

async function generateInvoice(sock, jid, sender, cProduct, cVariant, cProdId, varIdx, userData, m) {
    let orderId = 'ZD' + Date.now();
    let invMsg = `INVOICE PEMBAYARAN\n\n` +
                 `Haii *${userData.name}*, berikut detail pesanan kamu:\n\n` +
                 `Order ID: ${orderId}\n` +
                 `Produk: ${cProduct.name}\n` +
                 `Varian: ${cProduct.type === 'static' ? 'Standard' : cVariant.name}\n` +
                 `Total: Rp${cVariant.price.toLocaleString()}\n\n` +
                 `Pembayaran otomatis expired dalam 15 menit.\n\n` +
                 `CARA BAYAR:\n` +
                 `1. Scan QRIS pada gambar di atas\n` +
                 `2. Kirim foto bukti transfer nya ke sini`;

    let qrisUrl = global.payment?.qris || global.thumb.utama;

    let msgRes = await onePaySendButton(sock, jid, {
        caption: invMsg,
        image: { url: qrisUrl },
        footer: global.toko?.footer || "OnePay Payment",
        buttons: [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Batal", id: `.batal ${orderId}` }) }
        ],
        bottom_sheet: false
    }, { quoted: m });

    global.db.orders[orderId] = {
        id: orderId,
        jid: jid,
        userid: sender,
        prodId: cProdId,
        varIdx: varIdx,
        status: 'PENDING',
        timestamp: Date.now(),
        msgKey: msgRes?.key || null
    };
    
    if (!userData.txHistory.includes(orderId)) userData.txHistory.push(orderId);
    saveDB(global.db);

    setTimeout(async () => {
        let checkOrder = global.db.orders[orderId];
        if (checkOrder && checkOrder.status === 'PENDING') {
            checkOrder.status = 'EXPIRED';
            saveDB(global.db);
            await onePaySendMessage(sock, jid, { text: `Haii *${userData.name}*, waktu pembayaran untuk invoice *${orderId}* telah habis.` }, { quoted: m });
            if (checkOrder.msgKey) {
                await onePaySendMessage(sock, jid, { delete: checkOrder.msgKey }).catch(() => null);
            }
        }
    }, 15 * 60 * 1000);
}

handler.command = ['beli', 'checkout', 'proses_checkout', 'info_batal', 'save_notify', 'tutup_pesan', 'konfirmasi_tf', 'acc', 'tolak', 'reject_reason', 'batal'];
handler.tags = ['store'];

export default handler;
