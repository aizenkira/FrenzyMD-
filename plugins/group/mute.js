const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'mute',
    alias: ['bisukan'],
    category: 'group',
    description: 'Bisukan seluruh group (only admin that can send message)',
    usage: '.mute',
    example: '.mute',
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

    if (group.mute) return m.reply('❌ Group already in tothere isan mute.')

    db.setGroup(m.chat, { ...group, mute: true })
    m.reply(`✅ Group *${groupName}* success muted by @${m.sender.split('@')[0]}\n\nOnly admin that can send message.\nType *${m.prefix}unmute* for open again.`, { mentions: [m.sender] })
}

function isMuted(groupJid, db) {
    const group = db.getGroup(groupJid) || {}
    return !!group.mute
}

module.exports = {
    config: pluginConfig,
    handler,
    isMuted
}
