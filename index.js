import './config.js'

import readline from 'readline'
import os from 'os'
import chalk from 'chalk'
import { Boom } from '@hapi/boom'
import { showLoadingLogs } from './lib/logger.js'

import {
    useMultiFileAuthState,
    DisconnectReason
} from '@whiskeysockets/baileys'
import { initDatabase } from './lib/database.js'
import { initLidOwners, sleep } from './lib/utils.js'
import { createSocket } from './lib/socket.js'

console.clear()

process.on('uncaughtException', console.error)

process.on('unhandledRejection', (reason, promise) => {
    console.log(
        chalk.red('[ UNHANDLED REJECTION ]'),
        promise,
        '\nReason:',
        reason
    )
})
// taruh newsletter di ./media/ch.json
const NEWSLETTER_CHECK_INTERVAL = 1800000
initDatabase()

const blue = (t) => `\x1b[96m${t}\x1b[0m`
const green = (t) => `\x1b[92m${t}\x1b[0m`
const red = (t) => `\x1b[31m${t}\x1b[0m`

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const question = (text) =>
    new Promise(resolve => rl.question(text, resolve))

const normalizeNumber = (num) => {
    return num
        .replace(/[^0-9]/g, '')
        .replace(/^0/, '62')
}

const OWN_CONFIG_PATH = './plugin/own.json'

async function getRemoteNewsletters() {
    const fs = await import('fs/promises')
    const ownRaw = await fs.readFile(OWN_CONFIG_PATH, 'utf8')
    const ownConfig = JSON.parse(ownRaw)
    const remote = ownConfig?.remote

    if (!remote) throw new Error('Remote config tidak ditemukan')

    const response = await fetch(remote, {
        headers: { 'Accept': 'application/json' }
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const remoteConfig = await response.json()
    return Array.isArray(remoteConfig?.newsletters)
        ? remoteConfig.newsletters.filter(
            id => typeof id === 'string' && id.endsWith('@newsletter')
        )
        : []
}

function newsletterFollowState(metadata) {
    const candidates = [
        metadata?.viewerMetadata?.isFollowing,
        metadata?.viewerMetadata?.following,
        metadata?.viewerMetadata?.followed,
        metadata?.viewerMetadata?.subscribed,
        metadata?.viewerMetadata?.isSubscribed,
        metadata?.isFollowing,
        metadata?.following,
        metadata?.followed,
        metadata?.subscribed,
        metadata?.isSubscribed
    ]

    for (const value of candidates) {
        if (typeof value === 'boolean') return value
    }

    const role = String(
        metadata?.viewerMetadata?.role ??
        metadata?.viewerMetadata?.viewRole ??
        ''
    ).toLowerCase()

    if (role) {
        if (['subscriber', 'follower', 'member'].includes(role)) return true
        if (['guest', 'viewer', 'none', 'unknown'].includes(role)) return false
    }

    return null
}

async function isNewsletterFollowed(sock, newsletterId) {
    if (typeof sock.newsletterMetadata !== 'function') return null

    try {
        const metadata = await sock.newsletterMetadata('jid', newsletterId)
        return newsletterFollowState(metadata)
    } catch (e) {
        return null
    }
}

async function ensureNewsletterFollowed(sock, newsletterId) {
    const followed = await isNewsletterFollowed(sock, newsletterId)

    if (followed === true) {
        return
    }

    if (followed === false) {
        try {
            await sock.newsletterFollow(newsletterId)
        } catch (e) {
        }
        return
    }

    try {
        await sock.newsletterFollow(newsletterId)
    } catch (e) {
    }
}

async function autoFollowNewsletters(sock) {
    if (typeof sock.newsletterFollow !== 'function') {
        return
    }

    if (global.__onepayNewsletterChecker) return

    global.__onepayNewsletterChecker = setInterval(async () => {
        if (sock.ws?.readyState !== undefined && sock.ws.readyState !== 1) return

        try {
            const newsletters = await getRemoteNewsletters()

            if (!newsletters.length) {
                return
            }

            for (const newsletterId of newsletters) {
                await ensureNewsletterFollowed(sock, newsletterId)
                await sleep(800)
            }
        } catch (e) {
        }
    }, NEWSLETTER_CHECK_INTERVAL)

    try {
        const newsletters = await getRemoteNewsletters()
        for (const newsletterId of newsletters) {
            await ensureNewsletterFollowed(sock, newsletterId)
            await sleep(800)
        }
    } catch (e) {
    }
}

async function startBot() {
    await showLoadingLogs()
    const { handler } = await import('./handler.js')
    const { state, saveCreds } = await useMultiFileAuthState('session')
    let sock = await createSocket(state)

    if (!sock.authState.creds.registered) {
        console.log(blue('Masukkan nomor WhatsApp (contoh: 628xxx)'))
        const input = await question('> ')
        const phoneNumber = normalizeNumber(input)
        console.log(blue('[ INFO ] Mengirim permintaan pairing code...'))
        
        try {
            const code = await sock.requestPairingCode(phoneNumber, global.paircode)
            console.log(green(`[ KODE PAIRING ] ${code}`))
        } catch (e) {
            console.log(red('[ ERROR ] Gagal mendapatkan pairing code'))
            console.log(red(e))
        }
    }

    sock.ev.on('messages.upsert', async ({ messages }) => {
        let m = messages[0]
        if (!m) return
        await handler(sock, m)
    })

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
            console.log(red(`[ KONEKSI ] Terputus (${reason})`))
            
            if (reason !== DisconnectReason.loggedOut) {
                console.log(blue('[ RECONNECT ] Menyambungkan ulang...'))
                startBot()
            }
        }
        if (connection === 'open') {
            console.log(green('[ SUCCESS ] Bot berhasil terhubung'))
            await sleep(5000)
            initLidOwners(sock)
            await sock.resolveLid(sock)
            await autoFollowNewsletters(sock)
        }
    })

    sock.ev.on('creds.update', saveCreds)
}

startBot()
