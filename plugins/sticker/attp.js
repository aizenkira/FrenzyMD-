const axios = require('axios')
const config = require('../../config')
const { f } = require('../../src/lib/frenzy-http')
const te = require('../../src/lib/frenzy-error')

const NEOXR_APIKEY = config.APItoy?.neoxr || 'Milik-Bot-frenzyMD'

const pluginConfig = {
    name: 'attp',
    alias: ['attp2', 'attp3'],
    category: 'sticker',
    description: 'Create sticker animated text',
    usage: '.attp <text>',
    example: '.attp Hello World',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

function getRandomColor() {
    const colors = ['FF5733', 'C70039', '900C3F', '581845', '2E86AB', 'A23B72', 'F18F01', 'C73E1D', '3A0CA3', '7209B7', '4361EE', '4CC9F0']
    return colors[Math.floor(Math.random() * colors.length)]
}

async function handler(m, { sock }) {
    let text = m.text?.trim()
    
    if (!text && m.quoted?.text) {
        text = m.quoted.text.trim()
    }
    
    if (!text) {
        return m.reply(
            `🎨 *ᴀɴɪᴍᴀᴛᴇᴅ ᴛᴇxᴛ sᴛɪᴄᴋᴇʀ*\n\n` +
            `> Enter text for sticker\n\n` +
            `> Example: \`${m.prefix}attp Hello World\``
        )
    }
    
    if (text.length > 100) {
        return m.reply(`❌ Text too long! Mactionmal 100 karakter.`)
    }
    
    m.react('🕕')
    
    try {
        const color = getRandomColor()
        const url = `https://api.neoxr.eu/api/attp3?text=${encodeURIComponent(text)}&color=${color}&apikey=${NEOXR_APIKEY}`
        
        const data = await f(url)
        
        if (!data?.status || !data?.data?.url) {
            throw new Error('API no mengembackan data that is valid')
        }
        
        const stickerUrl = data.data.url
        
        const stickerRes = await f(stickerUrl, 'buffer')
        if (!stickerRes) throw new Error('Failed download sticker from server')
            
        const { addExifToWebp } = require('../../src/lib/frenzy-exif')
        let finalStictor = stickerRes
        try {
            finalStictor = await addExifToWebp(stickerRes, {
                packname: config.sticker.packname,
                author: config.sticker.author
            })
        } catch (e) {
            console.log('Exif error:', e)
        }

        await sock.sendMessage(m.chat, { sticker: finalStictor }, { quoted: m })
        m.react('✅')
    } catch (err) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
