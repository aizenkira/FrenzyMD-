const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'clancreate',
    alias: ['createclan', 'guildcreate'],
    category: 'clan',
    description: 'Create clan new',
    usage: '.clancreate <name>',
    example: '.clancreate DragonSlayer',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true
}

const CLAN_CREATE_COST = 50000
const MAX_CLAN_NAME = 20
const CLAN_EMBLEMS = ['🐉', '🦅', '🐺', '🦁', '🔥', '⚡', '🌙', '☀️', '💎', '🗡️']

function generateShortId(name, existingClans) {
    const clean = name.replace(/[^a-zA-Z]/g, '').toUpperCase()
    let id = clean.length >= 3 ? clean.slice(0, 3) : clean.padEnd(3, 'X')
    if (!existingClans[id]) return id
    id = clean.slice(0, 4) || id
    if (!existingClans[id]) return id
    for (let i = 1; i <= 99; i++) {
        const attempt = clean.slice(0, 3) + i
        if (!existingClans[attempt]) return attempt
    }
    return clean.slice(0, 2) + Math.random().toString(36).slice(2, 5).toUpperCase()
}

async function handler(m) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    const clanName = m.text?.trim()

    if (!clanName) {
        return m.reply(
            `⚔️ *CREATE CLAN*\n\n` +
            `Create clan and kumpulkan member!\n\n` +
            `Biaya: *Rp ${CLAN_CREATE_COST.toLocaleString('id-ID')}*\n` +
            `Max name: *${MAX_CLAN_NAME} karakter*\n\n` +
            `Example: *.clancreate DragonSlayer*`
        )
    }

    if (clanName.length > MAX_CLAN_NAME) {
        return m.reply(`❌ Name clan mactionmal ${MAX_CLAN_NAME} karakter`)
    }

    if (!/^[a-zA-Z0-9\s]+$/.test(clanName)) {
        return m.reply(`❌ Name clan only may huruf, angka, and spasi`)
    }

    if (!db.db.data.clans) db.db.data.clans = {}

    if (user.clanId) {
        return m.reply(`❌ You already punya clan\nTooutside first: *.clanleave*`)
    }

    const existingClan = Object.values(db.db.data.clans).find(c => c.name.toLowerCase() === clanName.toLowerCase())
    if (existingClan) {
        return m.reply(`❌ Name *${clanName}* already in use`)
    }

    if ((user.coins || 0) < CLAN_CREATE_COST) {
        return m.reply(
            `❌ Coins insufficient\n\n` +
            `Need: *Rp ${CLAN_CREATE_COST.toLocaleString('id-ID')}*\n` +
            `Punya: *Rp ${(user.coins || 0).toLocaleString('id-ID')}*`
        )
    }

    const emblem = CLAN_EMBLEMS[Math.floor(Math.random() * CLAN_EMBLEMS.length)]
    const clanId = generateShortId(clanName, db.db.data.clans)
    const clan = {
        id: clanId,
        name: clanName,
        emblem,
        leader: m.sender,
        members: [m.sender],
        exp: 0,
        level: 1,
        wins: 0,
        losses: 0,
        createdAt: new Date().toISOString(),
        description: 'Not yet there is description',
        isOpen: true
    }

    db.db.data.clans[clanId] = clan
    db.updateCoins(m.sender, -CLAN_CREATE_COST)
    db.setUser(m.sender, { clanId })
    await db.save()

    await m.reply(
        `${emblem} *CLAN CREATED*\n\n` +
        `*${clanName}*\n` +
        `Leader: @${m.sender.split('@')[0]}\n` +
        `Status: Open · 1/50 members\n\n` +
        `_-Rp ${CLAN_CREATE_COST.toLocaleString('id-ID')}_\n\n` +
        `Invite a friend: *.claninvite @user*\n` +
        `Or share ID: *${clanId}*`,
        { mentions: [m.sender] }
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
