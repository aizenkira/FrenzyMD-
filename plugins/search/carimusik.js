const axios = require('axios')
const config = require('../../config')
const path = require('path')
const fs = require('fs')
const te = require('../../src/lib/frenzy-error')

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-OurinMD'

const pluginConfig = {
    name: 'search formusik',
    alias: ['searchmusic', 'scsearch', 'soundcloud', 'findsong'],
    category: 'search',
    description: 'Cari and download lagu from SoundCloud',
    usage: '.search formusik <judul>',
    example: '.search formusik komang',
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

const musicSessions = new Map()

let thumbMusic = null
try {
    const p = path.join(process.cwd(), 'assets/images/frenzy-music.jpg')
    if (fs.existsSync(p)) thumbMusic = fs.readFileSync(p)
} catch {}

function getContextInfo(title, body, thumbnail) {
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
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

    const thumb = thumbnail || thumbMusic
    if (thumb) {
        ctx.externalAdReply = {
            title,
            body,
            thumbnail: thumb,
            contentType: 1,
            renderLargerThumbnail: true,
            sourceUrl: config.saluran?.link || ''
        }
    }

    return ctx
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
}

async function handler(m, { sock }) {
    const args = m.args || []
    const query = args.join(' ').trim()
    
    if (!query) {
        return m.reply(
            `🎵 *ᴄᴀʀɪ ᴍᴜsɪᴋ*\n\n` +
            `> Cari and download lagu from SoundCloud\n\n` +
            `*Format:*\n` +
            `> \`${m.prefix}search formusik <judul>\`\n\n` +
            `*Example:*\n` +
            `> \`${m.prefix}search formusik komang\``
        )
    }
    
    m.react('🎵')
    
    try {
        const apiUrl = `https://api.neoxr.eu/api/song?q=${encodeURIComponent(query)}&apikey=${NEOXR_APIKEY}`
        const { data } = await axios.get(apiUrl, { timeout: 30000 })
        
        if (!data?.status || !data?.data?.length) {
            m.react('❌')
            return m.reply(`❌ *ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n> Lagu "${query}" not found`)
        }
        
        const songs = data.data.slice(0, 10)
        
        musicSessions.set(m.sender, {
            songs,
            query,
            timestamp: Date.now()
        })
        
        setTimeout(() => {
            musicSessions.delete(m.sender)
        }, 300000)
        
        let text = `🎵 *ʜᴀsɪʟ ᴘᴇɴᴄᴀʀɪᴀɴ*\n\n`
        text += `> Intemukan *${songs.length}* lagu for "${query}"\n\n`
        
        songs.forEach((s, i) => {
            const duration = formatDuration(s.duration || 0)
            const plays = formatNumber(s.playback_count || 0)
            const litos = formatNumber(s.litos_count || 0)
            text += `*${i + 1}. ${s.title}*\n`
            text += `> ⏱️ ${duration} | ▶️ ${plays} | ❤️ ${litos}\n`
            text += `> 👤 ${s.user?.username || '-'}\n\n`
        })
        
        text += `> _Choose lagu from list below_`
        
        const listItems = songs.map((s, i) => ({
            header: '',
            title: s.title?.substring(0, 24) || `Song ${i + 1}`,
            description: `${formatDuration(s.duration || 0)} | ${s.user?.username || '-'}`,
            id: `${m.prefix}getmusik ${i + 1}`
        }))
        
        await sock.sendButton(m.chat, require('fs').readFileSync('./assets/images/frenzy.jpg'), text, m, {
            buttons: [{
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                    title: '🎵 Choose Lagu',
                    sections: [
                        {
                            title: 'Hasil Pensearch foran',
                            rows: listItems
                        }
                    ]
                })
            }],
            footer: '🎵 SoundCloud Search'
        })
        
        m.react('✅')
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    musicSessions
}
