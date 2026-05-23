const { getDatabase } = require('../../src/lib/frenzy-database')
const { addExpWithLevelCheck } = require('../../src/lib/frenzy-level')
const { getRpgContextInfo } = require('../../src/lib/frenzy-context')

const pluginConfig = {
    name: 'duel',
    alias: ['pvp', 'fight'],
    category: 'rpg',
    description: 'Duel PvP with other players',
    usage: '.duel @user <bet>',
    example: '.duel @user 5000',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 120,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    
    const target = m.mentionedJid?.[0] || m.quoted?.sender
    const bet = parseInt(args[1]) || 1000
    
    if (!target) {
        return m.reply(
            `⚔️ *ᴅᴜᴇʟ ᴘᴠᴘ*\n\n` +
            `╭┈┈⬡「 📋 *ᴜsᴀɢᴇ* 」\n` +
            `┃ > Tag opponent duel!\n` +
            `┃ > \`.duel @user 5000\`\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        )
    }
    
    if (target === m.sender) {
        return m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> Cannot duel self yourself!`)
    }
    
    if (bet < 1000) {
        return m.reply(`❌ *ɪɴᴠᴀʟɪᴅ ʙᴇᴛ*\n\n> Mat least bet Rp 1.000!`)
    }
    
    const player1 = db.getUser(m.sender)
    const player2 = db.getUser(target) || db.setUser(target)
    
    if ((player1.coins || 0) < bet) {
        return m.reply(
            `❌ *sᴀʟᴅᴏ ᴛɪᴅᴀᴋ ᴄᴜᴋᴜᴘ*\n\n` +
            `> Coins you: Rp ${(player1.coins || 0).toLocaleString('id-ID')}\n` +
            `> Need: Rp ${bet.toLocaleString('id-ID')}`
        )
    }
    
    if ((player2.coins || 0) < bet) {
        return m.reply(
            `❌ *ʟᴀᴡᴀɴ ᴛɪᴅᴀᴋ ᴄᴜᴋᴜᴘ*\n\n` +
            `> Opponent doesn't have enough balance to bet!`
        )
    }
    
    if (!player1.rpg) player1.rpg = {}
    if (!player2.rpg) player2.rpg = {}
    
    player1.rpg.health = player1.rpg.health || 100
    player2.rpg.health = player2.rpg.health || 100
    
    if (player1.rpg.health < 30) {
        return m.reply(
            `❌ *ʜᴇᴀʟᴛʜ ᴛᴇʀʟᴀʟᴜ ʀᴇɴᴅᴀʜ*\n\n` +
            `> Mat least 30 your phone for duel!\n` +
            `> Health you: ${player1.rpg.health} your phone`
        )
    }
    
    await sock.sendMessage(m.chat, { text: `⚔️ *ᴅᴜᴇʟ ᴅɪᴍᴜʟᴀɪ*\n\n> @${m.sender.split('@')[0]} vs @${target.split('@')[0]}\n> 💰 Bet: Rp ${bet.toLocaleString('id-ID')}`, contextInfo: getRpgContextInfo('⚔️ DUEL', 'Fight!') }, { quoted: m })
    
    await new Promise(r => setTimeout(r, 2000))
    
    const p1Power = (player1.rpg.level || 1) * 10 + Math.random() * 50
    const p2Power = (player2.rpg.level || 1) * 10 + Math.random() * 50
    
    const winner = p1Power > p2Power ? m.sender : target
    const loser = winner === m.sender ? target : m.sender
    const winnerData = winner === m.sender ? player1 : player2
    const loserData = winner === m.sender ? player2 : player1
    
    winnerData.coins = (winnerData.coins || 0) + bet
    loserData.coins = (loserData.coins || 0) - bet
    loserData.rpg.health = Math.max(0, (loserData.rpg.health || 100) - 20)
    
    const expGain = 500
    await addExpWithLevelCheck(sock, { ...m, sender: winner }, db, winnerData, expGain)
    
    db.save()
    
    let txt = `⚔️ *ʜᴀsɪʟ ᴅᴜᴇʟ*\n\n`
    txt += `🏆 Pemenang: @${winner.split('@')[0]}\n`
    txt += `💀 Kalah: @${loser.split('@')[0]}\n\n`
    txt += `> 💰 Here is: Rp ${bet.toLocaleString('id-ID')}\n`
    txt += `> 🚄 Exp: +${expGain} (winner)`
    
    await sock.sendMessage(m.chat, { text: txt, contextInfo: getRpgContextInfo('⚔️ DUEL', 'Result!') }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
