const { getDatabase } = require('../../src/lib/frenzy-database')
const config = require('../../config')

const pluginConfig = {
    name: 'setlimitdefault',
    alias: ['setdefaultlimit', 'limitdefault'],
    category: 'owner',
    description: 'Set default limit for user new',
    usage: '.setlimitdefault <amount>',
    example: '.setlimitdefault 50',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const args = m.args || []
    const newLimit = parseInt(args[0])
    
    if (!args[0] || isNaN(newLimit)) {
        const db = getDatabase()
        const currentDefault = db.setting('defaultLimit') || config.limits?.default || 25
        
        return m.reply(
            `📊 *sᴇᴛ ᴅᴇғᴀᴜʟᴛ ʟɪᴍɪᴛ*\n\n` +
            `> Limit default currently: \`${currentDefault}\`\n\n` +
            `*How to use:*\n` +
            `> \`${m.prefix}setlimitdefault <amount>\`\n\n` +
            `*Example:*\n` +
            `> \`${m.prefix}setlimitdefault 50\``
        )
    }
    
    if (newLimit < 1 || newLimit > 1000) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Limit must between 1 - 1000`)
    }
    
    const db = getDatabase()
    db.setting('defaultLimit', newLimit)
    
    await m.reply(
        `✅ *ʙᴇʀʜᴀsɪʟ*\n\n` +
        `> Default limit inchange become: \`${newLimit}\`\n` +
        `> User new will will come limit this`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
