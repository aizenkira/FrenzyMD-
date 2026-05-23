const { f } = require('../../src/lib/frenzy-http')
const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'anime-gen',
    alias: ['animegen', 'aianimegen', 'genai-anime'],
    category: 'ai',
    description: 'Generate AI anime art from prompt',
    usage: '.anime-gen <prompt>',
    example: '.anime-gen girl, vibrant color, smilling',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const prompt = m.text
    
    if (!prompt) {
        return m.reply(
            `🎨 *ᴀɴɪᴍᴇ ᴀʀᴛ ɢᴇɴᴇʀᴀᴛᴏʀ*\n\n` +
            `> Generate image anime AI from prompt!\n\n` +
            `*ᴄᴀʀᴀ ᴘᴀᴋᴀɪ:*\n` +
            `> \`${m.prefix}anime-gen <description>\`\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n` +
            `> \`${m.prefix}anime-gen girl, vibrant color, smilling, yellow pink grainent hwater\`\n` +
            `> \`${m.prefix}anime-gen boy, dark aesthetic, silver hwater, red eyes\`\n\n` +
            `*ᴛɪᴘs:*\n` +
            `> • Usage bahasa Inggris\n` +
            `> • Makin detail prompt, makin good hasil\n` +
            `> • Addkan style: vibrant, dark, pastel, etc`
        )
    }
    
    m.react('🎨')

    try {
        const NEOXR_APIKEY = config.APItoy?.neoxr || 'Milik-Bot-OurinMD'
        const apiUrl = `https://api.neoxr.eu/api/ai-anime?q=${encodeURIComponent(prompt)}&apikey=${NEOXR_APIKEY}`
        
        const data = await f(apiUrl)
        
        if (!data?.status || !data?.data?.url) {
            m.react('❌')
            return m.reply('❌ *ɢᴀɢᴀʟ*\n\n> Failed generate image. Please try again later!')
        }
        
        const result = data.data  
        await sock.sendMedia(m.chat, result.url, null, m, {
            type: 'image'
        })
        m.react('✅')
    } catch (error) {
        m.react('☢')
        if (error.code === 'ECONNABORTED') {
            m.reply('⏱️ *ᴛɪᴍᴇᴏᴜᴛ*\n\n> Request too old. Try again!')
        } else {
            m.reply(te(m.prefix, m.command, m.pushName))
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
