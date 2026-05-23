const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'similarity',
    alias: ['setsimilarity', 'sim'],
    category: 'owner',
    description: 'Mengactivekan/menonactivekan feature similarity (saran typo)',
    usage: '.similarity <on/off>',
    example: '.similarity on',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args
    
    if (!args[0]) {
        return m.reply(`⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n> \`.similarity on\` - Activekan\n> \`.similarity off\` - Matikan`)
    }
    
    const mode = args[0].toLowerCase()
    
    if (mode === 'on') {
        db.setting('similarity', true)
        m.react('✅')
        await m.reply(`✅ *sᴜᴋsᴇs*\n\n> Feature similarity command *DIAKTIFKAN*`)
    } else if (mode === 'off') {
        db.setting('similarity', false)
        m.react('✅')
        await m.reply(`✅ *sᴜᴋsᴇs*\n\n> Feature similarity command *DIMATIKAN*`)
    } else {
        return m.reply(`⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n> \`.similarity on\` - Activekan\n> \`.similarity off\` - Matikan`)
    }
    
    await db.save()
}

module.exports = {
    config: pluginConfig,
    handler
}
