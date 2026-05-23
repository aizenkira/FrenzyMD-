const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'setrulesgroup',
    alias: ['setgrouprules', 'setrulesgroup'],
    category: 'group',
    description: 'Set rules/rules group custom (admin only)',
    usage: '.setrulesgroup <text>',
    example: '.setrulesgroup 1. Don't spam\n2. Hordead sethe same as',
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
    const text = m.text?.trim() || (m.quoted?.body || m.quoted?.text || '')
    
    if (!text) {
        return m.reply(
            `📝 *sᴇᴛ ɢʀᴜᴘ ʀᴜʟᴇs*\n\n` +
            `> Enter text rules that new\n\n` +
            `\`Example:\`\n` +
            `\`${m.prefix}setrulesgroup 1. Don't spam\\n2. Hordead sethe same as\``
        )
    }
    
    db.setGroup(m.chat, { groupRules: text })
    
    m.reply(
        `✅ *ɢʀᴜᴘ ʀᴜʟᴇs ᴅɪᴜᴘᴅᴀᴛᴇ*\n\n` +
        `Rules group success inchange!\n` +
        `Type \`${m.prefix}rulesgroup\` for view.`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
