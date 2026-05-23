const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'clankick',
    alias: ['kickclan'],
    category: 'clan',
    description: 'Kick member from clan (leader only)',
    usage: '.clankick @user',
    example: '.clankick @user',
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
    if (clan.leader !== m.sender) return m.reply(`❌ Only leader that can kick`)

    const target = m.mentionedJid?.[0] || m.quoted?.sender
    if (!target) {
        return m.reply(
            `👢 *CLAN KICK*\n\n` +
            `Tag or reply member to be kicked\n\n` +
            `Example: *.clankick @user*`
        )
    }

    if (target === m.sender) return m.reply(`❌ Cannot kick self yourself`)
    if (!clan.members.includes(target)) return m.reply(`❌ User not a member of the clan this`)

    clan.members = clan.members.filter(jid => jid !== target)
    db.setUser(target, { clanId: null })
    db.save()

    const emblem = clan.emblem || '🏰'

    await m.reply(
        `${emblem} *KICKED*\n\n` +
        `@${target.split('@')[0]} kicked from *${clan.name}*\n` +
        `Sisa members: ${clan.members.length}/50`,
        { mentions: [target] }
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
