const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'setgoodbye',
    alias: ['customgoodbye'],
    category: 'group',
    description: 'Set custom goodbye message',
    usage: '.setgoodbye <message>',
    example: '.setgoodbye Bye {user}, see you again!',
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
    const text = m.text || m.args.join(' ')
    
    if (!text) {
        return m.reply(
            `📝 *sᴇᴛ ɢᴏᴏᴅʙʏᴇ*\n\n` +
            `╭┈┈⬡「 📋 *ᴘʟᴀᴄᴇʜᴏʟᴅᴇʀ* 」\n` +
            `┃ ◦ \`{user}\` - Name member\n` +
            `┃ ◦ \`{group}\` - Name group\n` +
            `┃ ◦ \`{count}\` - Sisa member\n` +
            `╰┈┈⬡\n\n` +
            `\`Example:\`\n` +
            `\`${m.prefix}setgoodbye Bye {user}! 👋\`\n` +
            `\`Sampai jumpa again!\``
        )
    }
    
    db.setGroup(m.chat, { goodbyeMsg: text, goodbye: true, leave: true })
    db.save()
    
    m.react('✅')
    
    await m.reply(
        `✅ Goodbye success in set become *${text}*\nWant reset? type ${m.prefix}resetgoodbye`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
