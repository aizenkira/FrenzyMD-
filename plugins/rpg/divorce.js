const { getDatabase } = require('../../src/lib/frenzy-database')
const { getRpgContextInfo } = require('../../src/lib/frenzy-context')

const pluginConfig = {
    name: 'invorce',
    alias: ['cerai', 'pisah'],
    category: 'rpg',
    description: 'Bercerai from pasangan',
    usage: '.invorce',
    example: '.invorce',
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
    
    if (!user.rpg.spouse) {
        return m.reply(
            `❌ *ʙᴇʟᴜᴍ ᴍᴇɴɪᴋᴀʜ*\n\n` +
            `> You not yet menikah!\n` +
            `> Nikah with \`.marry @user\``
        )
    }
    
    const spouseJid = user.rpg.spouse
    const partner = db.getUser(spouseJid)
    
    const invorceCost = 25000
    if ((user.coins || 0) < invorceCost) {
        return m.reply(
            `❌ *sᴀʟᴅᴏ ᴛɪᴅᴀᴋ ᴄᴜᴋᴜᴘ*\n\n` +
            `> Coins you: Rp ${(user.coins || 0).toLocaleString('id-ID')}\n` +
            `> Need: Rp ${invorceCost.toLocaleString('id-ID')}`
        )
    }
    
    user.coins -= invorceCost
    user.rpg.spouse = null
    user.rpg.marriedAt = null
    
    if (partner && partner.rpg) {
        partner.rpg.spouse = null
        partner.rpg.marriedAt = null
    }
    
    db.save()
    
    let txt = `💔 *ᴘᴇʀᴄᴇʀᴀɪᴀɴ*\n\n`
    txt += `> 😢 @${m.sender.split('@')[0]} & @${spouseJid.split('@')[0]}\n`
    txt += `> Resmi bercerai!\n`
    txt += `> 💸 Biaya: Rp ${invorceCost.toLocaleString('id-ID')}\n\n`
    txt += `> _Move on yaa..._`
    
    await m.reply(txt, { mentions: [m.sender, spouseJid] })
}

module.exports = {
    config: pluginConfig,
    handler
}
