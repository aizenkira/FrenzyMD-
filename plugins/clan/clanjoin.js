const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'clanjoin',
    alias: ['joinclan', 'guildjoin'],
    category: 'clan',
    description: 'Gabung to clan',
    usage: '.clanjoin <clan_id>',
    example: '.clanjoin clan_123456',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true
}

const MAX_MEMBERS = 50

async function handler(m) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    const clanId = m.text?.trim()

    if (!clanId) {
        return m.reply(
            `🏰 *JOIN CLAN*\n\n` +
            `Enter ID clan!\n\n` +
            `Example: *.clanjoin clan_123456*\n` +
            `Check ID: *.clanleaderboard*`
        )
    }

    if (user.clanId) {
        return m.reply(`❌ You already punya clan\nTooutside first: *.clanleave*`)
    }

    if (!db.db.data.clans) db.db.data.clans = {}

    const clan = db.db.data.clans[clanId]
        || Object.values(db.db.data.clans).find(c => c.name.toLowerCase() === clanId.toLowerCase())
        || Object.values(db.db.data.clans).find(c => c.id.toLowerCase() === clanId.toLowerCase())
    if (!clan) return m.reply(`❌ Clan not found`)
    if (!clan.isOpen) return m.reply(`❌ *${clan.name}* currently tertutup`)
    if (clan.members.length >= MAX_MEMBERS) return m.reply(`❌ *${clan.name}* already full (${MAX_MEMBERS}/${MAX_MEMBERS})`)

    clan.members.push(m.sender)
    db.setUser(m.sender, { clanId })
    db.save()

    const emblem = clan.emblem || '🏰'

    await m.reply(
        `${emblem} *WELCOME!*\n\n` +
        `@${m.sender.split('@')[0]} bergabung to *${clan.name}*\n\n` +
        `Leader: @${clan.leader.split('@')[0]}\n` +
        `Members: ${clan.members.length}/${MAX_MEMBERS}\n\n` +
        `View info: *.claninfo*`,
        { mentions: [m.sender, clan.leader] }
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
