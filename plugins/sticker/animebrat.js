const axios = require('axios')
const config = require('../../config')
const { f } = require('../../src/lib/frenzy-http')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'bratanime',
    alias: ['animebrat'],
    category: 'sticker',
    description: 'Create sticker brat',
    usage: '.animebrat <text>',
    example: '.animebrat Hello all',
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
        return m.reply(`🖼️ *ʙʀᴀᴛ ᴀɴɪᴍᴇ sᴛɪᴄᴋᴇʀ*\n\n> Enter text\n\n\`Example: ${m.prefix}animebrat Hello all\``)
    }
    
    m.react('🕕')
    
    try {
        const url = `https://api.nexray.web.id/mator/bratanime?text=${encodeURIComponent(text)}`
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
