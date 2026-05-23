const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'resetrulesgroup',
    alias: ['resetgrouprules'],
    category: 'group',
    description: 'Reset rules group to default (admin only)',
    usage: '.resetrulesgroup',
    example: '.resetrulesgroup',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m) {
    const db = getDatabase()
    
    db.setGroup(m.chat, { groupRules: null })
    
    m.reply(
        `✅ *ɢʀᴜᴘ ʀᴜʟᴇs ᴅɪʀᴇsᴇᴛ*\n` +
        `Rules group success inreset to default!\n` +
        `Type \`${m.prefix}rulesgroup\` for view.`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
