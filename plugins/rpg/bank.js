const { getDatabase } = require('../../src/lib/frenzy-database')
const { getRpgContextInfo } = require('../../src/lib/frenzy-context')

const pluginConfig = {
    name: 'bank',
    alias: ['atm', 'nabung', 'deposit', 'tarik', 'withdraw'],
    category: 'rpg',
    description: 'Bank system for safely store money from robbers',
    usage: '.bank <deposit/withdraw> <amount>',
    example: '.bank deposit 10000',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const cleanJid = m.sender.replace(/@.+/g, '')
    
    let user = db.getUser(m.sender)
    if (!user) {
        user = db.setUser(m.sender, {})
    }
    
    if (!db.db.data.users[cleanJid].rpg) {
        db.db.data.users[cleanJid].rpg = {}
    }
    if (typeof db.db.data.users[cleanJid].rpg.bank !== 'number') {
        db.db.data.users[cleanJid].rpg.bank = 0
    }
    
    const currentBalance = db.db.data.users[cleanJid].coins || 0
    const currentBank = db.db.data.users[cleanJid].rpg.bank || 0
    
    const args = m.args || []
    const action = args[0]?.toLowerCase()
    const amountStr = args[1]
    
    if (action === 'deposit' || action === 'depo') {
        let amount = 0
        if (amountStr === 'all') {
            amount = currentBalance
        } else {
            amount = parseInt(amountStr)
        }
        
        if (!amount || amount <= 0) return m.reply(`❌ Enter amount valid!`)
        if (currentBalance < amount) return m.reply(`❌ Not enough cash! Cash: Rp ${currentBalance.toLocaleString('id-ID')}`)
        
        db.db.data.users[cleanJid].coins = currentBalance - amount
        db.db.data.users[cleanJid].rpg.bank = currentBank + amount
        
        await db.save()
        
        const newBank = db.db.data.users[cleanJid].rpg.bank
        return m.reply(`✅ Success deposit: Rp ${amount.toLocaleString('id-ID')}\n🏦 Bank: Rp ${newBank.toLocaleString('id-ID')}`)
    }
    
    if (action === 'withdraw' || action === 'tarik') {
        let amount = 0
        if (amountStr === 'all') {
            amount = currentBank
        } else {
            amount = parseInt(amountStr)
        }
        
        if (!amount || amount <= 0) return m.reply(`❌ Enter amount valid!`)
        if (currentBank < amount) return m.reply(`❌ Not enough bank balance! Bank: Rp ${currentBank.toLocaleString('id-ID')}`)
        
        db.db.data.users[cleanJid].rpg.bank = currentBank - amount
        db.db.data.users[cleanJid].coins = currentBalance + amount
        
        await db.save()
        
        const newBalance = db.db.data.users[cleanJid].coins
        return m.reply(`✅ Success tarik: Rp ${amount.toLocaleString('id-ID')}\n💰 Cash: Rp ${newBalance.toLocaleString('id-ID')}`)
    }
    
    let txt = `🏦 *ʙᴀɴᴋ sʏsᴛᴇᴍ*\n\n`
    txt += `> 💰 Cash: Rp ${currentBalance.toLocaleString('id-ID')}\n`
    txt += `> 🏦 Bank: Rp ${currentBank.toLocaleString('id-ID')}\n\n`
    txt += `> Usage: \`.bank deposit <amount>\`\n`
    txt += `> Usage: \`.bank withdraw <amount>\`\n`
    txt += `> Tip: Usage 'all' for all money.`
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}

