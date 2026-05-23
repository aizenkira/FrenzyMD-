const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'claninvite',
    alias: ['inviteclan'],
    category: 'clan',
    description: 'Invite & directly added user to clan',
    usage: '.claninvite @user',
    example: '.claninvite @user',
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
    if (!clan) return m.reply(`❌ Clan not found`)

    const target = m.mentionedJid?.[0] || m.quoted?.sender
    if (!target) {
        return m.reply(
            `📨 *CLAN INVITE*\n\n` +
            `Tag or reply user to be inunandg\n\n` +
            `Example: *.claninvite @user*`
        )
    }

    if (target === m.sender) return m.reply(`❌ Cannot invite self yourself`)

    const targetUser = db.getUser(target)
    if (targetUser?.clanId) return m.reply(`❌ User the said already punya clan`)
    if (clan.members.length >= 50) return m.reply(`❌ Clan already full (50/50)`)

    clan.members.push(target)
    db.setUser(target, { clanId: user.clanId })
    db.save()

    const emblem = clan.emblem || '🏰'

    await m.reply(
        `${emblem} *INVITED!*\n\n` +
        `@${target.split('@')[0]} bergabung to *${clan.name}*\n` +
        `Members: ${clan.members.length}/50`,
        { mentions: [m.sender, target] }
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
