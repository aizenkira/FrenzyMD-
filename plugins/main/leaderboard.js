const { getDatabase } = require('../../src/lib/frenzy-database')
const config = require('../../config')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'leaderboard',
    alias: [
        'lb', 'top', 'leaderboard', 'ranking', 'rank', 'topglobal',
        'topbalance', 'topbal', 'topcoins', 'topcoin', 'topmoney',
        'toplimit', 'topexp', 'topxp', 'toplevel',
        'topenergy', 'topenergy'
    ],
    category: 'main',
    description: 'View leaderboard global (coins, exp, energy)',
    usage: '.leaderboard',
    example: '.topcoins',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true
}

function formatNumber(num) {
    if (num >= 1000000000000) return (num / 1000000000000).toFixed(2) + 'T'
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B'
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K'
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']

async function handler(m, { sock }) {
    const db = getDatabase()
    const cmd = m.command.toLowerCase()
    const args = m.args || []
    
    let type = 'overview'
    
    if (cmd.includes('coins') || cmd.includes('coin') || cmd.includes('bal') || cmd.includes('money')) {
        type = 'coins'
    } else if (cmd.includes('exp') || cmd.includes('xp') || cmd.includes('level')) {
        type = 'exp'
    } else if (cmd.includes('energy') || cmd.includes('energy')) {
        type = 'energy'
    } else if (args[0]) {
        const argType = args[0].toLowerCase()
        if (['coins', 'coin', 'bal', 'balance', 'money'].includes(argType)) type = 'coins'
        else if (['exp', 'xp', 'level'].includes(argType)) type = 'exp'
        else if (['energy', 'energy'].includes(argType)) type = 'energy'
    }
    
    const dbData = db.data?.users || db.getAllUsers?.() || {}
    const users = []
    
    for (const [jid, userData] of Object.entries(dbData)) {
        if (!jid || jid === 'undefined') continue
        if (jid.length > 15 || jid.startsWith('120')) continue
        
        users.push({
            jid,
            coins: userData.coins || 0,
            exp: userData.rpg?.exp || userData.exp || 0,
            energy: userData.energy || 0,
            level: userData.rpg?.level || userData.level || 1,
            name: userData.name || jid.split('@')[0]
        })
    }
    
    if (users.length === 0) {
        return m.reply(`📊 *ʟᴇᴀᴅᴇʀʙᴏᴀʀᴅ*\n\n> User data not yet registered in database.`)
    }
    
    const senderJid = m.sender.replace('@s.whatsapp.net', '')
    
    if (type === 'overview') {
        const totalUsers = users.length
        const maxBalUser = users.reduce((a, b) => a.coins > b.coins ? a : b, users[0])
        const maxExpUser = users.reduce((a, b) => a.exp > b.exp ? a : b, users[0])
        const maxEnergyUser = users.reduce((a, b) => a.energy > b.energy ? a : b, users[0])
        
        const mentions = [
            maxBalUser.jid.includes('@') ? maxBalUser.jid : maxBalUser.jid + "@s.whatsapp.net",
            maxExpUser.jid.includes('@') ? maxExpUser.jid : maxExpUser.jid + "@s.whatsapp.net",
            maxEnergyUser.jid.includes('@') ? maxEnergyUser.jid : maxEnergyUser.jid + "@s.whatsapp.net"
        ]
        
        const overviewText = `🏆 *LEADERBOARD OVERVIEW* 🏆\n\n` +
            `_Choose button below to view ranking!_`
            try {
                await sock.sendButton(m.chat, fs.readFileSync(path.join(process.cwd(), 'assets', 'images', 'frenzy.jpg')), overviewText, m, {
                    buttons: [
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            insplay_text: '💰 Top Coins',
                            id: `${m.prefix}topcoins`
                        })
                    },
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            insplay_text: '✨ Top EXP',
                            id: `${m.prefix}topexp`
                        })
                    },
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            insplay_text: '⚡ Top Energy',
                            id: `${m.prefix}topenergy`
                        })
                    }
                ],
            })
            return
        } catch (e) {
            return m.reply(overviewText, { mentions })
        }
    }
    
    let title, emoji, field, formatValue
    
    if (type === 'coins') {
        title = 'TOP GLOBAL COINS'
        emoji = '💰'
        field = 'coins'
        formatValue = (u) => `Rp ${formatNumber(u.coins)}`
    } else if (type === 'exp') {
        title = 'TOP GLOBAL LEVEL'
        emoji = '✨'
        field = 'exp'
        formatValue = (u) => `Lv. ${u.level} (${formatNumber(u.exp)} XP)`
    } else if (type === 'energy') {
        title = 'TOP GLOBAL ENERGI'
        emoji = '⚡'
        field = 'energy'
        formatValue = (u) => `${formatNumber(u.energy)} Energy`
    }
    
    users.sort((a, b) => b[field] - a[field])
    
    const top10 = users.slice(0, 10)
    const totalField = users.reduce((sum, u) => sum + (u[field] || 0), 0)
    
    let text = `🏆 *${title}* 🏆\n\n`
    text += `Rankings para rulers highest currently!\n\n`
    text += `╭┈┈⬡「 ${emoji} *RANKING* 」\n`
    
    const mentions = []
    
    top10.forEach((u, i) => {
        const medal = MEDALS[i] || `${i + 1}.`
        const pct = totalField > 0 ? ((u[field] / totalField) * 100).toFixed(1) : 0
        const isMe = u.jid === senderJid ? " *(You)*" : ""
        
        text += `┃ ${medal} @${u.jid.split('@')[0]}${isMe}\n`
        text += `┃    └ ${formatValue(u)} (${pct}%)\n`
        
        if (i < top10.length - 1) text += `┃\n`
        mentions.push(u.jid.includes('@') ? u.jid : u.jid + "@s.whatsapp.net")
    })
    
    text += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    
    const myRankIndex = users.findIndex(u => u.jid === senderJid)
    if (myRankIndex !== -1) {
        text += `> Posisi you: *#${myRankIndex + 1}* from *${formatNumber(users.length)}* user.`
    } else {
        text += `> You not yet registered in database.`
    }
    
    await m.reply(text, { mentions })
}

module.exports = {
    config: pluginConfig,
    handler
}
