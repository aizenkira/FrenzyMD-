const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'setrules',
    alias: ['setbotrules', 'setrulesbot'],
    category: 'owner',
    description: 'Set rules/rules bot custom',
    usage: '.setrules <text>',
    example: '.setrules 1. Don't spam\n2. Hordead sethe same as',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m) {
    const db = getDatabase()
    const text = m.text?.trim() || (m.quoted?.body || m.quoted?.text || '')
    
    if (!text) {
        return m.reply(
            `📝 *sᴇᴛ ʙᴏᴛ ʀᴜʟᴇs*\n\n` +
            `> Enter text rules that new\n\n` +
            `\`Example:\`\n` +
            `\`${m.prefix}setrules 1. Don't spam\\n2. Hordead sethe same as\``
        )
    }
    
    db.setting('botRules', text)
    
    m.reply(
        `✅ *ʙᴏᴛ ʀᴜʟᴇs ᴅɪᴜᴘᴅᴀᴛᴇ*\n\n` +
        `> Rules bot success inchange!\n` +
        `> Type \`${m.prefix}rules\` for view.`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
