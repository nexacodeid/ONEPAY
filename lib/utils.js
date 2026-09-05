global.lidowners = global.lidowners || []

export async function initLidOwners(sock) {
  if (global.lidowners.length) return global.lidowners

  for (const num of global.owner) {
    const clean = num.replace(/\D/g, '')
    const jid = clean + "@s.whatsapp.net"

    const lid = await sock.signalRepository.lidMapping
      .getLIDForPN(jid)
      .catch(() => null)

    if (lid) {
      global.lidowners.push(lid.split("@")[0])
    }
  }

  return global.lidowners
}

export const runtime = (seconds) => {
        seconds = Number(seconds);
        let d = Math.floor(seconds / (3600 * 24));
        let h = Math.floor(seconds % (3600 * 24) / 3600);
        let m = Math.floor(seconds % 3600 / 60);
        let s = Math.floor(seconds % 60);
        return `${d}d ${h}h ${m}m ${s}s`;
    };

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));