const axios = require('axios')
const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'bratcewek',
    alias: ['cewekbrat', 'bratperempuan', 'bratgirl'],
    category: 'sticker',
    description: 'Create sticker brat',
    usage: '.bratcewek <text>',
    example: '.bratcewek Hello all',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.args.join(' ')
    if (!text) {
        return m.reply(`🖼️ *ʙʀᴀᴛ cᴇᴡᴇᴋ sᴛɪᴄᴋᴇʀ*\n\n> Enter text\n\n\`Example: ${m.prefix}bratcewek Hello all\``)
    }
    
    m.react('🕕')
    
    try {
        const url = `https://api.deline.web.id/mator/cewekbrat?text=${encodeURIComponent(text)}`
        await sock.sendImageAsStictor(m.chat, url, m, {
            packname: config.sticker.packname,
            author: config.sticker.author
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
