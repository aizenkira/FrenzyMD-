const { getDatabase } = require('../../src/lib/frenzy-database')
const { addExpWithLevelCheck } = require('../../src/lib/frenzy-level')
const { getRpgContextInfo } = require('../../src/lib/frenzy-context')

const pluginConfig = {
    name: 'beg',
    alias: ['ngemis', 'minta'],
    category: 'rpg',
    description: 'Beg for small change',
    usage: '.beg',
    example: '.beg',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    
    await m.reply('🙏 *sᴇᴅᴀɴɢ ᴍᴇɴɢᴇᴍɪs...*')
    await new Promise(r => setTimeout(r, 2000))
    
    const responses = [
        { success: true, money: 500, exp: 10, msg: 'A generous person gave you money!' },
        { success: true, money: 1000, exp: 20, msg: 'You will a tip from person good!' },
        { success: true, money: 2000, exp: 50, msg: 'WOW! Ada sultan that kasihan!' },
        { success: false, money: 0, exp: 0, msg: 'No there is that search forng...' },
        { success: false, money: 0, exp: 0, msg: 'The person ignored you...' },
        { success: true, money: 100, exp: 5, msg: 'Dwhatt small change from kantong person!' },
        { success: false, money: -500, exp: 0, msg: 'You malah inrobbers pengemis else!' }
    ]
    
    const result = responses[Math.floor(Math.random() * responses.length)]
    
    if (result.money > 0) {
        user.coins = (user.coins || 0) + result.money
        if (result.exp > 0) {
            await addExpWithLevelCheck(sock, m, db, user, result.exp)
        }
    } else if (result.money < 0) {
        user.coins = Math.max(0, (user.coins || 0) + result.money)
    }
    
    db.save()
    
    let txt = ''
    if (result.success && result.money > 0) {
        txt = `🙏 *ɴɢᴇᴍɪs sᴜᴋsᴇs*\n\n> ${result.msg}\n> 💰 Dwhatt: *+Rp ${result.money.toLocaleString('id-ID')}*`
        if (result.exp > 0) txt += `\n> 🚄 Exp: *+${result.exp}*`
    } else if (result.money < 0) {
        txt = `😭 *ɴɢᴇᴍɪs ɢᴀɢᴀʟ*\n\n> ${result.msg}\n> 💸 Lost: *Rp ${Math.abs(result.money).toLocaleString('id-ID')}*`
    } else {
        txt = `😢 *ɴɢᴇᴍɪs ɢᴀɢᴀʟ*\n\n> ${result.msg}`
    }
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
