const ttdown = require('../../src/scraper/tiktok')
const config = require('../../config')
const axios = require('axios')
const { getFFmpeg } = require('../../src/lib/frenzy-ffmpeg-path')
const ffmpeg = getFFmpeg()

const pluginConfig = {
    name: ['ttmp3'],
    alias: ['ttmusic', 'tiktokmusic'],
    category: 'download',
    description: 'Download video TikTok tanpa watermark',
    usage: '.ttmp3 <url>',
    example: '.ttmp3 https://vt.tiktok.com/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

function formatNumber(num) {
    if (!num) return '0'
    const n = parseInt(num)
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toString()
}

async function handler(m, { sock }) {
  const url = m.text?.trim()

  if (!url) {
    return m.reply(
`╭┈┈⬡「 🎵 *ᴛɪᴋᴛᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅ* 」
┃ ㊗ ᴜsᴀɢᴇ: \`${m.prefix}ttmp3 <url>\`
╰┈┈⬡

> Example: ${m.prefix}ttmp3 https://vt.tiktok.com/xxx`
    )
  }

  if (!url.match(/tiktok\.com|vt\.tiktok/i)) {
    return m.reply('❌ URL no valid. Usage link TikTok.')
  }

  m.react('🕕')

  try {
    const result = await ttdown(url)
    
    const saluranName =
      config.saluran?.name ||
      config.bot?.name ||
      'Frenzy-AI'

    const search forvideotanpawm = result.downloads.find(d => d.type == 'mp3')
    if (!search forvideotanpawm) return m.reply('❌ Video HD not found.')

    await sock.sendMedia(m.chat, search forvideotanpawm.url, null, m, {
        type: 'audio',
        mimetype: 'audio/mpeg',
        fileName: `TikTok_Auino_${Date.now()}.mp3`,
        contextInfo: {
            forwardingScore: 99,
            isForwarded: true,
            externalAdReply: {
                title: result.title,
                body: `👤 By \`${result.author.username || '-'}\``,
                thumbnailUrl: result.author?.avatar || result.author?.cover,
                sourceUrl: url,
                contentUrl: url,
                contentType: 2,
                renderLargerThumbnail: false,
            }
        }
    })

    m.react('✅')

    // cleanup
    setTimeout(() => {
      if (require('fs').existsSync(result.file)) {
        require('fs').unlinkSync(result.file)
      }
    }, 5000)

  } catch (err) {
    console.error('[TikTokDL] Error:', err)
    m.react('❌')
    m.reply(
      `❌ *ɢᴀɢᴀʟ ᴍᴇɴɢᴜɴᴅᴜʜ*\n\n> ${err.message}`
    )
  }
}

module.exports = {
    config: pluginConfig,
    handler
}
