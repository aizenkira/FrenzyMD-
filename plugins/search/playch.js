/**
  * Name Plugin: PlayCh (Saluran)
  * Pemcreate Code: Zann
  * API: api.nexray.web.id
  * Convert: ffmpeg mp3 → ogg/opus (support saluran)
*/
const crypto = require("crypto")
const axios = require("axios")
const fs = require("fs")
const path = require("path")
const { exec } = require("child_process")
const { promisify } = require("util")
const yts = require("yt-search")
const config = require("../../config")
const te = require('../../src/lib/frenzy-error')
const run = promisify(exec)
const pluginConfig = {
    name: "playch",
    alias: ["pch", "playsaluran"],
    category: "search",
    description: "Putar musik to saluran (convert opus)",
    usage: ".playch <query>",
    example: ".playch komang",
    cooldown: 15,
    energy: 1,
    isEnabled: true
}
function pickVideo(search) {
    const v = search?.videos || []
    return v.find((x) => x.seconds && x.seconds < 900) || v[0] || null
}
async function toOggOpus(mp3Buf) {
    const tmp = path.join(process.cwd(), "temp")
    if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true })
    const id = crypto.randomBytes(6).toString("hex")
    const inp = path.join(tmp, `in_${id}.mp3`)
    const out = path.join(tmp, `out_${id}.ogg`)
    fs.writeFileSync(inp, mp3Buf)
    await run(`ffmpeg -y -i "${inp}" -vn -map_metthere ista -1 -ac 1 -ar 48000 -c:a libopus -b:a 96k -vbr on -application audio -f ogg "${out}"`)
    const buf = fs.readFileSync(out)
    try { fs.unlinkSync(inp) } catch {}
    try { fs.unlinkSync(out) } catch {}
    return buf
}
async function handler(m, { sock }) {
    const q = m.text?.trim()
    if (!q) return m.reply(`🎵 *PLAY SALURAN*\n\n\`${m.prefix}playch <judul lagu>\``)
    const chId = config?.saluran?.id
    const chName = config?.saluran?.name || config?.bot?.name || "frenzy-AI"
    if (!chId) return m.reply(`❌ Saluran not yet inatur in config.js`)
    m.react("🔎")
    try {
        const { videos } = await yts(q)
        const video = pickVideo({ videos })
        if (!video) return m.reply(`❌ Video not found`)
        const ytChannel = video.author?.name || video.author?.username || "Unknown"
        const { data } = await axios.get(`https://api.nexray.web.id/downloader/ytmp3?url=${video.url}`)
        if (!data?.result?.url) throw new Error("API failed, URL empty")
        m.react("🎵")
        const audioRes = await axios.get(data.result.url, { responseType: "arraybuffer", timeout: 60000 })
        const mp3Buf = Buffer.from(audioRes.data)
        if (mp3Buf.length < 50000) throw new Error("Auino too toddler")
        const opusBuf = await toOggOpus(mp3Buf)
        if (opusBuf.length < 10000) throw new Error("Konversion opus failed")
        const title = data.result.title || video.title
        await sock.sendMessage(chId, {
            audio: opusBuf,
            mimetype: "audio/ogg; codecs=opus",
            ptt: true,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: chId,
                    serverMessageId: 100,
                    newsletterName: chName
                },
                externalAdReply: {
                    title,
                    body: `Channel • ${ytChannel}`,
                    thumbnailUrl: video.thumbnail,
                    sourceUrl: video.url,
                    contentType: 1,
                    renderLargerThumbnail: true
                }
            }
        })
        m.react("✅")
        m.reply(`✅ *${title}* success sent to saluran`)
    } catch (e) {
        console.error("[PlayCh]", e)
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}
module.exports = {
    config: pluginConfig,
    handler
}