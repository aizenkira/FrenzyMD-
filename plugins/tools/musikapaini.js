const axios = require('axios')
const FormData = require('form-data')
const config = require('../../config')
const { downloadMediaMessage } = require('frenzy')
const path = require('path')
const fs = require('fs')
const te = require('../../src/lib/frenzy-error')

const NEOXR_APIKEY = config.APItoy?.neoxr || 'Milik-Bot-frenzyMD'

const pluginConfig = {
    name: 'musikwhatthis',
    alias: ['whatmusic', 'shazam', 'recognizemusic', 'mai'],
    category: 'tools',
    description: 'Identifikasi lagu from audio',
    usage: '.musikwhatthis (reply audio)',
    example: '.musikwhatthis',
    cooldown: 20,
    energy: 2,
    isEnabled: true
}

let thumbTools = null
try {
    const p = path.join(process.cwd(), 'assets/images/frenzy-tools.jpg')
    if (fs.existsSync(p)) thumbTools = fs.readFileSync(p)
} catch {}

function getContextInfo(title, body) {
    const saluranId = config.saluran?.id || '120363406397452589@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'frenzy-AI'

    const ctx = {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        }
    }

    if (thumbTools) {
        ctx.externalAdReply = {
            title,
            body,
            thumbnail: thumbTools,
            contentType: 1,
            renderLargerThumbnail: false,
            sourceUrl: config.saluran?.link || ''
        }
    }

    return ctx
}

async function uploadToTmpFiles(buffer, filename) {
    const form = new FormData()
    form.append('file', buffer, { filename, contentType: 'application/octet-stream' })
    
    const res = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
        headers: form.getHeaders(),
        timeout: 60000
    })
    
    if (!res.data?.data?.url) throw new Error('Upload failed')
    return res.data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
}

async function handler(m, { sock }) {
    let audioBuffer = null
    let filename = 'audio.mp3'
    
    if (m.quoted?.message) {
        const quotedMsg = m.quoted.message
        const audioMsg = quotedMsg.audioMessage || quotedMsg.documentMessage
        
        if (audioMsg) {
            try {
                audioBuffer = await downloadMediaMessage(
                    { toy: m.quoted.key, message: quotedMsg },
                    'buffer',
                    {}
                )
                filename = audioMsg.fileName || 'audio.mp3'
            } catch {}
        }
    }
    
    if (!audioBuffer && m.message) {
        const audioMsg = m.message.audioMessage || m.message.documentMessage
        if (audioMsg) {
            try {
                audioBuffer = await m.download()
                filename = audioMsg.fileName || 'audio.mp3'
            } catch {}
        }
    }
    
    if (!audioBuffer) {
        return m.reply(
            `🎵 *ᴍᴜsɪᴋ ᴀᴘᴀ ɪɴɪ?*\n\n` +
            `> Identifikasi lagu from audio\n\n` +
            `*How to use:*\n` +
            `> Reply audio with \`${m.prefix}musikwhatthis\`\n` +
            `> Or send audio + caption command`
        )
    }
    
    m.react('🎵')
    
    try {
        await m.reply('🕕 *ᴍᴇɴɢᴜᴘʟᴏᴀᴅ...*\n\n> Mengupload audio...')
        
        const audioUrl = await uploadToTmpFiles(audioBuffer, filename)
        
        await m.reply('🔍 *ᴍᴇɴɢɪᴅᴇɴᴛɪꜰɪᴋᴀsɪ...*\n\n> Mensearch for info lagu...')
        
        const apiUrl = `https://api.neoxr.eu/api/whatmusic?url=${encodeURIComponent(audioUrl)}&apikey=${NEOXR_APIKEY}`
        const { data } = await axios.get(apiUrl, { timeout: 60000 })
        
        if (!data?.status || !data?.data) {
            m.react('❌')
            return m.reply('❌ *ɢᴀɢᴀʟ*\n\n> Lagu no intonali or API error')
        }
        
        const music = data.data
        const links = music.links || {}
        
        let text = `🎵 *ʟᴀɢᴜ ᴅɪᴛᴇᴍᴜᴋᴀɴ!*\n\n`
        text += `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n`
        text += `┃ 🎶 Title: ${music.title || '-'}\n`
        text += `┃ 👤 Artist: ${music.meaningst || '-'}\n`
        text += `┃ 💿 Album: ${music.album || '-'}\n`
        text += `┃ 📅 Release: ${music.release || '-'}\n`
        text += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        
        const buttons = []
        
        if (links.spotify?.track?.id) {
            buttons.push({
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    insplay_text: '🎧 Spotify',
                    url: `https://open.spotify.com/track/${links.spotify.track.id}`
                })
            })
        }
        
        if (links.youtube?.vid) {
            buttons.push({
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    insplay_text: '▶️ YouTube',
                    url: `https://youtube.com/watch?v=${links.youtube.vid}`
                })
            })
        }
        
        if (links.deezer?.track?.id) {
            buttons.push({
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    insplay_text: '🎵 Deezer',
                    url: `https://deezer.com/track/${links.deezer.track.id}`
                })
            })
        }
        
        const msgContent = {
            text,
            footer: '🎵 Music Recognition',
            contextInfo: getContextInfo('🎵 MUSIK APA INI', music.title || 'Music Found')
        }
        
        if (buttons.length > 0) {
            msgContent.interactiveButtons = buttons
        }
        
        await sock.sendMessage(m.chat, msgContent, { quoted: m })
        
        m.react('✅')
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
