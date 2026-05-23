const axios = require('axios')
const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'pacarsertifikat',
    alias: ['sertifikatpacar', 'certpacar', 'pacarcert'],
    category: 'canvas',
    description: 'Create sertifikat pacar',
    usage: '.pacarsertifikat <name1> <name2>',
    example: '.pacarsertifikat Buin Ani',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const args = m.args || []
    
    if (args.length < 2) {
        return m.reply(
            `💑 *sᴇʀᴛɪꜰɪᴋᴀᴛ ᴘᴀᴄᴀʀ*\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ ◦ \`${m.prefix}pacarsertifikat <name1> <name2>\`\n` +
            `╰┈┈⬡\n\n` +
            `> Example: \`${m.prefix}pacarsertifikat Buin Ani\``
        )
    }
    
    const name1 = args[0]
    const name2 = args.slice(1).join(' ')
    
    m.react('💑')
    
    try {
        const apiKey = config.APItoy?.lolhuman
        
        if (!apiKey) {
            throw new Error('API Toy not found in config')
        }
        
        const apiUrl = `https://api.lolhuman.xyz/api/pacarserti?apikey=${apiKey}&name1=${encodeURIComponent(name1)}&name2=${encodeURIComponent(name2)}`
        
        await sock.sendMedia(m.chat, apiUrl, null, m, {
            type: 'image',
        })
        
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
