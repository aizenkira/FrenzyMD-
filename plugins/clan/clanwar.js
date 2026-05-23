const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'clanwar',
    alias: ['war', 'guildwar'],
    category: 'clan',
    description: 'War against opposing another clan',
    usage: '.clanwar <clan_id>',
    example: '.clanwar clan_123456',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3600,
    energy: 0,
    isEnabled: true
}

const REWARDS = {
    coinsWin: 30000,
    coinsLose: 6000,
    expWin: 15000,
    expLose: 3000,
    energyWin: 15,
    energyLose: 3,
    clanExpWin: 5000,
    clanExpLose: 1000
}

function calculatePower(db, clan) {
    let totalPower = 0
    for (const jid of clan.members) {
        const user = db.getUser(jid)
        const level = user?.rpg?.level || user?.level || 1
        const exp = user?.rpg?.exp || user?.exp || 0
        totalPower += (level * 100) + (exp / 10)
    }
    totalPower += (clan.level || 1) * 500
    totalPower += (clan.wins || 0) * 50
    return Math.floor(totalPower)
}

function getScaledRewards(clan) {
    const level = clan.level || 1
    const mult = 1 + (level * 0.1)
    return {
        coinsWin: Math.floor(REWARDS.coinsWin * mult),
        coinsLose: Math.floor(REWARDS.coinsLose * mult),
        expWin: Math.floor(REWARDS.expWin * mult),
        expLose: Math.floor(REWARDS.expLose * mult),
        energyWin: Math.floor(REWARDS.energyWin * mult),
        energyLose: Math.floor(REWARDS.energyLose * mult)
    }
}

function simulateWar(power1, power2) {
    const total = power1 + power2
    return Math.random() < (power1 / total) ? 1 : 2
}

function powerBar(p1, p2) {
    const total = p1 + p2
    const ratio = Math.round((p1 / total) * 10)
    return '🟩'.repeat(ratio) + '🟥'.repeat(10 - ratio)
}

async function handler(m) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    const targetClanId = m.text?.trim()

    if (!user?.clanId) return m.reply(`❌ You not yet punya clan`)

    if (!targetClanId) {
        return m.reply(
            `⚔️ *CLAN WAR*\n\n` +
            `Tantang another clan to battle!\n\n` +
            `Example: *.clanwar clan_123456*\n` +
            `Check ID: *.clanleaderboard*\n\n` +
            `Syarat: Mat least 3 member per clan\n` +
            `Cooldown: 1 hour`
        )
    }

    if (!db.db.data.clans) db.db.data.clans = {}

    const myClan = db.db.data.clans[user.clanId]
    const enemyClan = db.db.data.clans[targetClanId]
        || Object.values(db.db.data.clans).find(c => c.name.toLowerCase() === targetClanId.toLowerCase())
        || Object.values(db.db.data.clans).find(c => c.id.toLowerCase() === targetClanId.toLowerCase())

    if (!myClan) return m.reply(`❌ Clan you not found`)
    if (!enemyClan) return m.reply(`❌ Clan opponent not found`)
    if (user.clanId === targetClanId) return m.reply(`❌ Cannot war against opposing clan yourself`)
    if (myClan.members.length < 3) return m.reply(`❌ Clan you need at least 3 member`)
    if (enemyClan.members.length < 3) return m.reply(`❌ Clan opponent need at least 3 member`)

    const myPower = calculatePower(db, myClan)
    const enemyPower = calculatePower(db, enemyClan)
    const winner = simulateWar(myPower, enemyPower)
    const isWin = winner === 1

    const myR = getScaledRewards(myClan)
    const enemyR = getScaledRewards(enemyClan)

    if (isWin) {
        myClan.wins = (myClan.wins || 0) + 1
        myClan.exp = (myClan.exp || 0) + REWARDS.clanExpWin
        enemyClan.losses = (enemyClan.losses || 0) + 1
        enemyClan.exp = (enemyClan.exp || 0) + REWARDS.clanExpLose

        for (const jid of myClan.members) {
            db.updateCoins(jid, myR.coinsWin)
            db.updateExp(jid, myR.expWin)
            db.updateEnergy(jid, myR.energyWin)
        }
        for (const jid of enemyClan.members) {
            db.updateCoins(jid, enemyR.coinsLose)
            db.updateExp(jid, enemyR.expLose)
            db.updateEnergy(jid, enemyR.energyLose)
        }
    } else {
        myClan.losses = (myClan.losses || 0) + 1
        myClan.exp = (myClan.exp || 0) + REWARDS.clanExpLose
        enemyClan.wins = (enemyClan.wins || 0) + 1
        enemyClan.exp = (enemyClan.exp || 0) + REWARDS.clanExpWin

        for (const jid of myClan.members) {
            db.updateCoins(jid, myR.coinsLose)
            db.updateExp(jid, myR.expLose)
            db.updateEnergy(jid, myR.energyLose)
        }
        for (const jid of enemyClan.members) {
            db.updateCoins(jid, enemyR.coinsWin)
            db.updateExp(jid, enemyR.expWin)
            db.updateEnergy(jid, enemyR.energyWin)
        }
    }

    myClan.level = Math.floor(myClan.exp / 10000) + 1
    enemyClan.level = Math.floor(enemyClan.exp / 10000) + 1
    db.save()

    const myE = myClan.emblem || '🏰'
    const enE = enemyClan.emblem || '🏰'
    const bar = powerBar(myPower, enemyPower)
    const winnerClan = isWin ? myClan : enemyClan
    const winnerE = isWin ? myE : enE
    const r = isWin ? myR : myR

    let txt = `⚔️ *WAR RESULT*\n\n`
    txt += `${myE} *${myClan.name}*  vs  *${enemyClan.name}* ${enE}\n`
    txt += `💪 ${myPower.toLocaleString('id-ID')}  vs  ${enemyPower.toLocaleString('id-ID')}\n`
    txt += `${bar}\n\n`
    txt += `${winnerE} *${winnerClan.name} WINS!*\n\n`

    if (isWin) {
        txt += `🎁 Reward per member:\n`
        txt += `+Rp ${myR.coinsWin.toLocaleString('id-ID')} · +${myR.expWin.toLocaleString('id-ID')} EXP · +${myR.energyWin} Energy\n`
        txt += `+${REWARDS.clanExpWin.toLocaleString('id-ID')} Clan EXP`
    } else {
        txt += `😔 Konsolasi per member:\n`
        txt += `+Rp ${myR.coinsLose.toLocaleString('id-ID')} · +${myR.expLose.toLocaleString('id-ID')} EXP · +${myR.energyLose} Energy\n`
        txt += `+${REWARDS.clanExpLose.toLocaleString('id-ID')} Clan EXP`
    }

    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
