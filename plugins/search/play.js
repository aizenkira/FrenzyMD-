/**
  * Name Plugin: Play
  * Pemcreate Code: Zann
  * API/Scraper: api.nexray.web.id
  * Saluran: https://whatsapp.com/channel/0029Vb7g5Qt90x2yn7bOlM2U
*/

const yts = require("yt-search")
const axios = require("axios")

const pluginConfig = {
    name: "play",
    alias: ["playaudio"],
    category: "search",
    description: "Putar musik from YouTube (Siputzx API)",
    usage: ".play <query>",
    example: ".play komang",
    cooldown: 15,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock, text }) {
    const query = m.text?.trim()
    if (!query) return m.reply(`🎵 *ᴘʟᴀʏ*\n\n> Example:\n\`${m.prefix}play komang\``)

    m.react("🕐")

    try {
        const search = await yts(query)
        if (!search.videos.length) throw "Video not found"
        
        const video = search.videos[0]
        
        const { data } = await axios.get(`https://api.nexray.web.id/downloader/ytmp3?url=${video.url}`)
 
        await sock.sendMessage(m.chat, {
            audio: { url: data?.result.url },
            mimetype: 'audio/mpeg',
            ptt: false,
            fileName: video.title + '.mp3',
            contextInfo: {
                forwardingScore: 9,
                isForwarded: true,
                externalAdReply: {
                    title: video.title,
                    body: `Good menikdead musiknya`,
                    contentType: 2,
                    contentUrl: video.url,
                    sourceUrl: video.url,
                    thumbnailUrl: video.thumbnail,
                    showAdAttribution: false,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m })

        m.react("✅")

    } catch (err) {
        console.error('[Play]', err)
        m.react("😭")
        m.reply(`Wowhh, feature putar musiknya again there is tondala kak, please try again later yak, don't spam`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}