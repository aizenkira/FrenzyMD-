const { getDatabase } = require('../../src/lib/frenzy-database')
const { getRpgContextInfo } = require('../../src/lib/frenzy-context')

const pluginConfig = {
    name: 'transfer',
    alias: ['tf', 'send'],
    category: 'rpg',
    description: 'Transfer money or items to another user',
    usage: '.transfer <money/name_item> <amount> @user',
    example: '.transfer money 10000 @tag',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const sender = db.getUser(m.sender)
    
    const args = m.args || []
    if (args.length < 3) {
        return m.reply(
            `💸 *ᴛʀᴀɴsꜰᴇʀ*\n\n` +
            `╭┈┈⬡「 📋 *ᴜsᴀɢᴇ* 」\n` +
            `┃ > \`.transfer money 10000 @user\`\n` +
            `┃ > \`.transfer potion 5 @user\`\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        )
    }
    
    const type = args[0].toLowerCase()
    const amount = parseInt(args[1])
    const target = m.mentionedJid?.[0] || m.quoted?.sender
    
    if (!target) {
        return m.reply(`❌ *ᴛᴀʀɢᴇᴛ ɴᴏᴛ ꜰᴏᴜɴᴅ*\n\n> Tag user tujuan!`)
    }
    
    if (target === m.sender) {
        return m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> Cannot transfer to yourself!`)
    }
    
    if (!amount || amount <= 0) {
        return m.reply(`❌ *ɪɴᴠᴀʟɪᴅ ᴀᴍᴏᴜɴᴛ*\n\n> Amount must lebih from 0!`)
    }
    
    const recipient = db.getUser(target) || db.setUser(target)
    
    if (type === 'money' || type === 'balance') {
        if ((sender.coins || 0) < amount) {
            return m.reply(
                `❌ *sᴀʟᴅᴏ ᴛɪᴅᴀᴋ ᴄᴜᴋᴜᴘ*\n\n` +
                `> Coins you: Rp ${(sender.coins || 0).toLocaleString('id-ID')}\n` +
                `> Need: Rp ${amount.toLocaleString('id-ID')}`
            )
        }
        
        sender.coins -= amount
        recipient.coins = (recipient.coins || 0) + amount
        
        db.setUser(m.sender, sender)
        db.setUser(target, recipient)
        db.save()
        return m.reply(`✅ *ᴛʀᴀɴsꜰᴇʀ sᴜᴋsᴇs*\n\n> 💸 Insend: Rp ${amount.toLocaleString('id-ID')}\n> 👤 Penerima: @${target.split('@')[0]}`, { mentions: [target] })
    } else {
        sender.inventory = sender.inventory || {}
        recipient.inventory = recipient.inventory || {}
        
        if ((sender.inventory[type] || 0) < amount) {
            return m.reply(
                `❌ *ɪᴛᴇᴍ ᴛɪᴅᴀᴋ ᴄᴜᴋᴜᴘ*\n\n` +
                `> Item *${type}* you: ${sender.inventory[type] || 0}\n` +
                `> Need: ${amount}`
            )
        }
        
        sender.inventory[type] -= amount
        recipient.inventory[type] = (recipient.inventory[type] || 0) + amount
        
        db.setUser(m.sender, sender)
        db.setUser(target, recipient)
        db.save()
        return m.reply(`✅ *ᴛʀᴀɴsꜰᴇʀ sᴜᴋsᴇs*\n\n> 📦 Item: ${type}\n> 🔢 Amount: ${amount}\n> 👤 Penerima: @${target.split('@')[0]}`, { mentions: [target] })
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
