const config = require('../../config')

const pluginConfig = {
    name: 'listban',
    alias: ['listbanned', 'banlist'],
    category: 'owner',
    description: 'Meview list banned user',
    usage: '.listban',
    example: '.listban',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const bannedUsers = config.bannedUsers || []
    
    if (bannedUsers.length === 0) {
        return m.reply(`🚫 *ʟɪsᴛ ʙᴀɴɴᴇᴅ*\n\n> No there is user that bannedned\n\n\`Usage: ${m.prefix}ban <number>\``)
    }
    
    let caption = `🚫 *ʟɪsᴛ ʙᴀɴɴᴇᴅ*\n\n`
    caption += `╭┈┈⬡「 ⛔ *ᴜsᴇʀs* 」\n`
    
    for (let i = 0; i < bannedUsers.length; i++) {
        caption += `┃ ${i + 1}. \`${bannedUsers[i]}\`\n`
    }
    
    caption += `╰┈┈⬡\n\n`
    caption += `> ᴛᴏᴛᴀʟ: \`${bannedUsers.length}\` ʙᴀɴɴᴇᴅ ᴜsᴇʀ`
    
    await m.reply(caption)
}

module.exports = {
    config: pluginConfig,
    handler
}
