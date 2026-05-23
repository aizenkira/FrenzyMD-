const config = require('../../config')
const { getDatabase } = require('../../src/lib/frenzy-database')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'addenergyall',
    alias: ['addenergyanall', 'bonusenergyall'],
    category: 'owner',
    description: 'Menambahkan limit/energy to all member group',
    usage: '.addenergyall <amount>',
    example: '.addenergyall 50',
    isOwner: true,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        const amount = parseInt(m.args[0])
        
        if (isNaN(amount) || amount <= 0) {
            return m.reply(`⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n> Enter amount limit to be added.\n\n\`Example: ${m.prefix}addlimitall 50\``)
        }
        
        const groupMeta = m.groupMetadata
        const participants = groupMeta.participants || []
        
        if (participants.length === 0) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> No there is member in this group`)
        }
        
        m.react('🕕')
        const db = getDatabase()
        let successCount = 0
        
        for (const participant of participants) {
            const number = participant.jid?.replace(/[^0-9]/g, '') || ''
            if (!number) continue
            const jid = number + '@s.whatsapp.net'
            db.updateEnergy(jid, amount)
            successCount++
        }

        const gb = m?.groupMetadata
        
        await db.save()
        m.react('⚡')
        await m.reply(
           `✅ Success added limit to all member ( Total *${successCount}* Member ) in group *${gb?.subject}*`,
            )
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
