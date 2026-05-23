const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'listantilink',
    alias: ['antilinklist', 'checkantilink'],
    category: 'group',
    description: 'Meview list link that inblock',
    usage: '.listantilink',
    example: '.listantilink',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

const DEFAULT_BLOCKED_LINKS = [
    'chat.whatsapp.com',
    'wa.me',
    'bit.ly',
    't.me',
    'telegram.me',
    'inscord.gg',
    'inscord.com/invite'
]

async function handler(m) {
    const db = getDatabase()
    const groupData = db.getGroup(m.chat) || {}
    const customList = groupData.antilinkList || []
    
    let txt = `🔗 *ᴅᴀꜰᴛᴀʀ ᴀɴᴛɪʟɪɴᴋ*\n\n`
    
    txt += `╭┈┈⬡「 📌 *ᴅᴇꜰᴀᴜʟᴛ* 」\n`
    DEFAULT_BLOCKED_LINKS.forEach((l, i) => {
        txt += `┃ ${i + 1}. \`${l}\`\n`
    })
    txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    
    if (customList.length > 0) {
        txt += `╭┈┈⬡「 ➕ *ᴄᴜsᴛᴏᴍ* 」\n`
        customList.forEach((l, i) => {
            txt += `┃ ${i + 1}. \`${l}\`\n`
        })
        txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    }
    
    txt += `> Default: *${DEFAULT_BLOCKED_LINKS.length}* link\n`
    txt += `> Custom: *${customList.length}* link\n\n`
    txt += `\`${m.prefix}there isndtilink <link>\` for add\n`
    txt += `\`${m.prefix}delantilink <link>\` for delete`
    
    m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler,
    DEFAULT_BLOCKED_LINKS
}
