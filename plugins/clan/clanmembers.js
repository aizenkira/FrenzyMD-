const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'clanmembers',
    alias: ['clanmember', 'guildmembers'],
    category: 'clan',
    description: 'View list member clan',
    usage: '.clanmembers',
    example: '.clanmembers',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
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

    const emblem = clan.emblem || '🏰'
    const mentions = []

    const memberLines = clan.members.map((jid, i) => {
        const memberUser = db.getUser(jid)
        const isLeader = jid === clan.leader
        const level = memberUser?.rpg?.level || memberUser?.level || 1
        const coins = (memberUser?.coins || 0).toLocaleString('id-ID')
        mentions.push(jid)

        const role = isLeader ? '👑' : '•'
        return `${role} @${jid.split('@')[0]}  Lv.${level} · Rp ${coins}`
    })

    await m.reply(
        `${emblem} *${clan.name}* — Members\n\n` +
        memberLines.join('\n') +
        `\n\n${clan.members.length}/50 members`,
        { mentions }
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
