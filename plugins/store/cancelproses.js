const { getDatabase } = require('../../src/lib/frenzy-database')
const config = require('../../config')

const pluginConfig = {
    name: 'cancelprocess',
    alias: ['cancelprocess', 'canceltrx'],
    category: 'store',
    description: 'Cancel process transaction',
    usage: '.cancelprocess @buyer',
    example: '.cancelprocess @628xxx',
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
    let sessions = db.setting('transactionSessions') || {}
    
    const mentioned = m.mentionedJid?.[0]
    const quoted = m.quoted?.sender
    const target = mentioned || quoted
    
    if (!target) {
        if (Object.keys(sessions).length === 0) {
            return m.reply(`❌ No there is transaction active`)
        }
        
        let list = `📋 *ᴛʀᴀɴsᴀᴋsɪ ᴀᴋᴛɪꜰ*\n\n`
        for (const [jid, session] of Object.entries(sessions)) {
            list += `> @${jid.split('@')[0]} - ${session.product} (${session.nominal})\n`
        }
        list += `\n> Cancel with \`${m.prefix}cancelprocess @buyer\``
        
        return m.reply(list, { mentions: Object.keys(sessions) })
    }
    
    if (!sessions[target]) {
        return m.reply(`❌ No there is transaction active for user this`)
    }
    
    const session = sessions[target]
    delete sessions[target]
    db.setting('transactionSessions', sessions)
    await db.save()
    
    m.reply(
        `✅ *ᴛʀᴀɴsᴀᴋsɪ ᴅɪʙᴀᴛᴀʟᴋᴀɴ*\n\n` +
        `> Product: ${session.product}\n` +
        `> Buyer: @${target.split('@')[0]}`,
        { mentions: [target] }
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
