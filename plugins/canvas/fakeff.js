const axios = require('axios')
const config = require('../../config')
const { uploadToTmpFiles } = require('../../src/lib/frenzy-tmpfiles')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'fatoff',
    alias: ['fatofreefire'],
    category: 'canvas',
    description: 'Create image ff',
    usage: '.fatoff <text>',
    example: '.fatoff Hello gorgeous',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const name = m.text
    if(!name) {
        return m.reply(`*FAKE FF*\n\n> Example: ${m.prefix}fatoff name1`)
    }
    m.react('🕕')
    
    try {
        await sock.sendMedia(m.chat, `https://api.nexray.web.id/mator/fatolobyff?nickname=${encodeURIComponent(name)}`, null, m, {
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
