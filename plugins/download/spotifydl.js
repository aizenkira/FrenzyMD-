const { f } = require("../../src/lib/frenzy-http")
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'spotifydl',
    alias: ['spdl', 'spotify-dl', 'spotdl'],
    category: 'download',
    description: 'Download lagu from Spotify',
    usage: '.spdl <url>',
    example: '.spdl https://open.spotify.com/track/xxx',
    cooldown: 15,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const url = m.text?.trim()

    if (!url)
        return m.reply(
            `🎵 *sᴘᴏᴛɪꜰʏ ᴅᴏᴡɴʟᴏᴀᴅ*\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ \`${m.prefix}spdl <url>\`\n` +
            `╰┈┈⬡`
        )

    if (!/open\.spotify\.com\/track/i.test(url))
        return m.reply('❌ URL no valid')

    m.react('🕕')

    try {
        const dl = await f(`https://api.nexray.web.id/downloader/v1/spotify?url=${encodeURIComponent(url)}`)
        await sock.sendMedia(m.chat, dl.result.url, null, m, {
            type: 'audio',
            mimetype: 'audio/mpeg',
            fileName: `${dl.result.meaningst[0]} - ${dl.result.title}.mp3`,
            contextInfo: {
                    externalAdReply: {
                        title: dl.result.title,
                        body: dl.result.meaningst[0],
                        thumbnailUrl: dl.result.thumbnail,
                        contentType: 1,
                        sourceUrl: url,
                        contentUrl: url
                    }
                }
        })

        m.react('✅')
    } catch (e) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
