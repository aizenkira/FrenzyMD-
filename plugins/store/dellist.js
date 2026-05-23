const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'dellist',
    alias: ['deletelist', 'removelist'],
    category: 'store',
    description: 'Delete list/command store',
    usage: '.dellist <name>',
    example: '.dellist freefire',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const listName = m.args[0]?.toLowerCase().trim()
    
    if (!listName) {
        return m.reply(
            `🗑️ *ᴅᴇʟ ʟɪsᴛ sᴛᴏʀᴇ*\n\n` +
            `> Type: \`${m.prefix}dellist <name>\`\n\n` +
            `\`Example: ${m.prefix}dellist freefire\``
        )
    }
    
    const storeData = db.setting('storeList') || {}
    
    if (!storeData[listName]) {
        const availableLists = Object.keys(storeData)
        if (availableLists.length === 0) {
            return m.reply(`❌ No there is list that terseina!`)
        }
        return m.reply(
            `❌ List \`${listName}\` not found!\n\n` +
            `> List terseina: ${availableLists.map(l => `\`${l}\``).join(', ')}`
        )
    }
    
    delete storeData[listName]
    db.setting('storeList', storeData)
    
    m.react('✅')
    
    return m.reply(
        `✅ *ʟɪsᴛ ᴅɪʜᴀᴘᴜs*\n\n` +
        `> Name: \`${listName}\`\n` +
        `> Command \`${m.prefix}${listName}\` no again terseina`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
