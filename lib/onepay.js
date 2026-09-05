// OnePay Branding Module

export const ONEPAY_WEBSITE = 'https://onepay.id'

export const ONEPAY_NEWSLETTER = '120363411590123589@newsletter'

export function onePayText(text = '') {
    return String(text)
}

export function brandOnePaySocket(sock) {
    if (!sock) return sock

    try {
        if (sock.user) {
            sock.user.name = 'OnePay'
        }
    } catch {}

    return sock
}

export default {
    ONEPAY_WEBSITE,
    ONEPAY_NEWSLETTER,
    onePayText,
    brandOnePaySocket
}