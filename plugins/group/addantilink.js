const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'there isndtilink',
    alias: ['addalink', 'addblocklink'],
    category: 'group',
    description: 'Add a link to the antilink list',
    usage: '.there isndtilink <domain/pattern>',
    example: '.there isndtilink tiktok.com',
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
    const link = m.text?.toLowerCase()
    
    if (!link) {
        return m.reply(
            `🔗 *ᴀᴅᴅ ᴀɴᴛɪʟɪɴᴋ*\n\n` +
            `> Enter domain/pattern link to be inblock\n\n` +
            `\`Example:\`\n` +
            `\`${m.prefix}there isndtilink tiktok.com\`\n` +
            `\`${m.prefix}there isndtilink chat.whatsapp.com\`\n` +
            `\`${m.prefix}there isndtilink instagram.com\``
        )
    }
    
    const groupData = db.getGroup(m.chat) || {}
    const antilinkList = groupData.antilinkList || []
    
    if (antilinkList.includes(link)) {
        return m.reply(`⚠️ Link \`${link}\` already exist in list antilink!`)
    }
    
    antilinkList.push(link)
    db.setGroup(m.chat, { antilinkList })
    
    m.reply(
        `✅ *ᴀɴᴛɪʟɪɴᴋ ᴅɪᴛᴀᴍʙᴀʜ*\n\n` +
        `> Link: \`${link}\`\n` +
        `> Total: *${antilinkList.length}* link\n\n` +
        `> Usage \`${m.prefix}listantilink\` for view list`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
