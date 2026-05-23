const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'clanleave',
    alias: ['leaveclan', 'guildleave'],
    category: 'clan',
    description: 'Tooutside from clan',
    usage: '.clanleave',
    example: '.clanleave',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true
}

async function handler(m) {
    const db = getDatabase()
    const user = db.getUser(m.sender)

    if (!user?.clanId) return m.reply(`❌ You not yet punya clan`)
    if (!db.db.data.clans) db.db.data.clans = {}

    const clan = db.db.data.clans[user.clanId]
    if (!clan) {
        db.setUser(m.sender, { clanId: null })
        db.save()
        return m.reply(`❌ Clan not found, data inbersihkan`)
    }

    if (clan.leader === m.sender) {
        if (clan.members.length > 1) {
            return m.reply(
                `❌ You is the leader!\n\n` +
                `Transfer first: *.clantransfer @user*\n` +
                `Or kick all member first`
            )
        }
        delete db.db.data.clans[user.clanId]
        db.setUser(m.sender, { clanId: null })
        db.save()

        const emblem = clan.emblem || '🏰'
        return m.reply(`${emblem} Clan *${clan.name}* has inbubarkan`)
    }

    clan.members = clan.members.filter(jid => jid !== m.sender)
    db.setUser(m.sender, { clanId: null })
    db.save()

    await m.reply(`👋 You leave from *${clan.name}*`)
}

module.exports = {
    config: pluginConfig,
    handler
}
