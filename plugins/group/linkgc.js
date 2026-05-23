const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'linkgc',
    alias: ['linkgroup', 'getlink', 'gclink'],
    category: 'group',
    description: 'Dwhattkan link invite group',
    usage: '.linkgc',
    example: '.linkgc',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
}

async function handler(m, { sock }) {
    m.react('🕕')
    
    try {
        const code = await sock.groupInviteCode(m.chat)
        const urlGroup = `https://chat.whatsapp.com/${code}`
        await m.reply(`Link group this group\n${urlGroup}`)
        
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
