const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'list',
    alias: ['storelist', 'listlist', 'pricelist'],
    category: 'store',
    description: 'Tampilkan all list store',
    usage: '.list',
    example: '.list',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const storeData = db.setting('storeList') || {}
    const lists = Object.entries(storeData)
    
    if (lists.length === 0) {
        return m.reply(
            `📦 *sᴛᴏʀᴇ ʟɪsᴛ*\n\n` +
            `> Not yet there is list that terseina\n\n` +
            `> Owner will added list with:\n` +
            `> \`${m.prefix}addlist <name>\` (reply message)`
        )
    }
    
    let txt = `📦 *sᴛᴏʀᴇ ʟɪsᴛ*\n\n`
    txt += `> Total: ${lists.length} list terseina\n\n`
    txt += `╭─「 📋 *ᴅᴀꜰᴛᴀʀ ᴘʀᴏᴅᴜᴋ* 」\n`
    
    for (const [name, data] of lists) {
        const preview = data.content
        txt += `┃\n`
        txt += `┃ 🏷️ \`${m.prefix}${name}\`\n`
        txt += `┃ └ ${preview}...\n`
        txt += `┃ └ 👁️ ${data.views || 0} views\n`
    }
    
    txt += `┃\n`
    txt += `╰───────────────\n\n`
    txt += `> Type command for view detail`
    
    m.react('📦')
    return m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
