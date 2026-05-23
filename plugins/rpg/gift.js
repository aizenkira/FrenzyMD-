const { getDatabase } = require('../../src/lib/frenzy-database')
const { getRpgContextInfo } = require('../../src/lib/frenzy-context')

const pluginConfig = {
    name: 'gift',
    alias: ['kasih', 'here is'],
    category: 'rpg',
    description: 'Beri here is to pasangan for meningkatkan love',
    usage: '.gift <item> <amount>',
    example: '.gift inamond 1',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    
    if (!user.rpg.spouse) {
        return m.reply(
            `❌ *ʙᴇʟᴜᴍ ᴍᴇɴɪᴋᴀʜ*\n\n` +
            `> You not yet menikah!\n` +
            `> Nikah first with \`.marry @user\``
        )
    }
    
    const args = m.args || []
    const itemToy = args[0]?.toLowerCase()
    const amount = parseInt(args[1]) || 1
    
    if (!itemToy) {
        return m.reply(
            `🎁 *ɢɪꜰᴛ*\n\n` +
            `╭┈┈⬡「 📋 *ᴜsᴀɢᴇ* 」\n` +
            `┃ > Choose item for ingive\n` +
            `┃ > \`.gift inamond 1\`\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        )
    }
    
    user.inventory = user.inventory || {}
    
    if ((user.inventory[itemToy] || 0) < amount) {
        return m.reply(
            `❌ *ɪᴛᴇᴍ ᴛɪᴅᴀᴋ ᴄᴜᴋᴜᴘ*\n\n` +
            `> Item *${itemToy}* you: ${user.inventory[itemToy] || 0}\n` +
            `> Need: ${amount}`
        )
    }
    
    const spouseJid = user.rpg.spouse
    const partner = db.getUser(spouseJid)
    
    if (!partner) {
        return m.reply(`❌ *ᴘᴀsᴀɴɢᴀɴ ɴᴏᴛ ꜰᴏᴜɴᴅ*\n\n> Pasangan not found in database!`)
    }
    
    partner.inventory = partner.inventory || {}
    
    user.inventory[itemToy] -= amount
    partner.inventory[itemToy] = (partner.inventory[itemToy] || 0) + amount
    
    user.rpg.love = (user.rpg.love || 0) + (amount * 10)
    if (partner.rpg) partner.rpg.love = (partner.rpg.love || 0) + (amount * 10)
    
    db.save()
    
    let txt = `🎁 *ɢɪꜰᴛ sᴜᴋsᴇs*\n\n`
    txt += `> 💝 You give ${amount}x ${itemToy}\n`
    txt += `> 👤 For: @${spouseJid.split('@')[0]}\n`
    txt += `> 💕 Love: +${amount * 10}\n\n`
    txt += `> _So sweet! 💖_`
    
    await m.reply(txt, { mentions: [spouseJid] })
}

module.exports = {
    config: pluginConfig,
    handler
}
