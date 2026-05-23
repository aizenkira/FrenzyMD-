const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'setwelcome',
    alias: ['customwelcome'],
    category: 'group',
    description: 'Set custom welcome message',
    usage: '.setwelcome <message>',
    example: '.setwelcome Hello {user}, forevert come in {group}!',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const text = m.fullArgs?.trim() || m.args.join(' ')
    
    if (!text) {
        return m.reply(
            `📝 *sᴇᴛ ᴡᴇʟᴄᴏᴍᴇ*\n\n` +
            `╭┈┈⬡「 📋 *ᴘʟᴀᴄᴇʜᴏʟᴅᴇʀ* 」\n` +
            `┃ ◦ \`{user}\` - Name member\n` +
            `┃ ◦ \`{group}\` - Name group\n` +
            `┃ ◦ \`{desc}\` - Description group\n` +
            `┃ ◦ \`{count}\` - Amount member\n` +
            `╰┈┈⬡\n\n` +
            `\`Example:\`\n` +
            `\`${m.prefix}setwelcome Hello {user}! 👋\`\n` +
            `\`Good come in {group}\``
        )
    }
    
    db.setGroup(m.chat, { welcomeMsg: text, welcome: true })
    db.save()
    
    m.react('✅')
    
    await m.reply(
        `✅ Welcome success in set become *${text}*\nWant reset? type ${m.prefix}resetwelcome`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
