const { getDatabase } = require('../../src/lib/frenzy-database')
const { getRpgContextInfo } = require('../../src/lib/frenzy-context')

const pluginConfig = {
    name: 'coinflip',
    alias: ['cf', 'flip', 'toss'],
    category: 'rpg',
    description: 'Gambling coin flip',
    usage: '.coinflip <heads/tails> <bet>',
    example: '.coinflip heads 5000',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    const args = m.args || []
    const choice = args[0]?.toLowerCase()
    const bet = parseInt(args[1])
    
    if (!choice || (choice !== 'heads' && choice !== 'tails' && choice !== 'h' && choice !== 't')) {
        return m.reply(
            `🪙 *ᴄᴏɪɴ ꜰʟɪᴘ*\n\n` +
            `╭┈┈⬡「 📋 *ᴜsᴀɢᴇ* 」\n` +
            `┃ > Choose heads (h) or tails (t)\n` +
            `┃ > \`.coinflip heads 5000\`\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        )
    }
    
    if (!bet || bet < 1000) {
        return m.reply(
            `❌ *ɪɴᴠᴀʟɪᴅ ʙᴇᴛ*\n\n` +
            `> Mat least bet Rp 1.000!\n` +
            `> Example: \`.coinflip heads 5000\``
        )
    }
    
    if ((user.coins || 0) < bet) {
        return m.reply(
            `❌ *sᴀʟᴅᴏ ᴛɪᴅᴀᴋ ᴄᴜᴋᴜᴘ*\n\n` +
            `> Coins you: Rp ${(user.coins || 0).toLocaleString('id-ID')}\n` +
            `> Need: Rp ${bet.toLocaleString('id-ID')}`
        )
    }
    
    user.coins -= bet
    
    const userChoice = (choice === 'heads' || choice === 'h') ? 'heads' : 'tails'
    const result = Math.random() < 0.5 ? 'heads' : 'tails'
    const emoji = result === 'heads' ? '🪙' : '⭕'
    
    await sock.sendMessage(m.chat, { text: `🪙 *ꜰʟɪᴘᴘɪɴɢ...*`, contextInfo: getRpgContextInfo('🪙 COINFLIP', 'Flipping!') }, { quoted: m })
    await new Promise(r => setTimeout(r, 1500))
    
    const isWin = userChoice === result
    
    let txt = `🪙 *ᴄᴏɪɴ ꜰʟɪᴘ*\n\n`
    txt += `> ${emoji} Hasil: *${result.toUpperCase()}*\n`
    txt += `> 🎯 Choicemu: *${userChoice.toUpperCase()}*\n\n`
    
    if (isWin) {
        const winnings = bet * 2
        user.coins = (user.coins || 0) + winnings
        txt += `✅ *ᴋᴀᴍᴜ ᴍᴇɴᴀɴɢ!*\n`
        txt += `> 💰 Win: *+Rp ${winnings.toLocaleString('id-ID')}*`
    } else {
        txt += `❌ *ᴋᴀᴍᴜ ᴋᴀʟᴀʜ!*\n`
        txt += `> 💸 Lost: *-Rp ${bet.toLocaleString('id-ID')}*`
    }
    
    db.save()
    await sock.sendMessage(m.chat, { text: txt, contextInfo: getRpgContextInfo('🪙 COINFLIP', 'Result!') }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
