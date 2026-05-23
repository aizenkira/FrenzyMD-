const nanoBanana = require('../../src/scraper/nanobanana')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'tofigure3',
    alias: ['figurine3', 'tofigure3', 'byoui3', 'actionfigure3'],
    category: 'ai',
    description: 'Change photo into action figure/figurine koleksi',
    usage: '.tofigure3 (reply/send image)',
    example: '.tofigure3',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energy: 3,
    isEnabled: true
}

const PROMPT = `Using the model, create a 1/7 scale commercialized figurine of the characters in the picture, 
in a realistic style, in a real environment. The figurine is placed on a computer desk. 
The figurine has a round transparent acrylic base, with no text on the base. 
The content on the computer screen is the modeling process of this figurine. 
Next to the computer screen is a BANDAI-style key packaging box printed with the original artwork. 
The packaging features two-inmensional flat illustrations.`

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && (m.quoted.isImage || m.quoted.type === 'imageMessage'))
    
    if (!isImage) {
        return m.reply(
            `🎭 *ᴛᴏ ꜰɪɢᴜʀ 3*\n\n` +
            `> Send/reply image for convert to figurine/action figure\n\n` +
            `\`${m.prefix}tofigure3\``
        )
    }
    
    m.react('🕕')
    
    try {
        let buffer
        if (m.quoted && m.quoted.isMeina) {
            buffer = await m.quoted.download()
        } else if (m.isMeina) {
            buffer = await m.download()
        }
        
        if (!buffer) {
            m.react('❌')
            return m.reply(`❌ Failed mendownload image`)
        }
        
        
        
        const result = await nanoBanana(buffer, PROMPT)
        
        m.react('✅')
        
        await sock.sendMedia(m.chat, result, null, m, {
            type: 'image'
        })
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
