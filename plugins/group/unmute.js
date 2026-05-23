const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'unmute',
    alias: ['unbisukan'],
    category: 'group',
    description: 'Unmute the group',
    usage: '.unmute',
    example: '.unmute',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    isBotAdmin: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const group = db.getGroup(m.chat) || {}
    const groupName = m.groupMetadata.subject

    if (!group.mute) return m.reply('❌ Group no currently muted.')

    db.setGroup(m.chat, { ...group, mute: false })
    m.reply(`✅ Group *${groupName}* success in-unmute by @${m.sender.split('@')[0]}\n\nAll member now can send message.`, { mentions: [m.sender] })
}

module.exports = {
    config: pluginConfig,
    handler
}
