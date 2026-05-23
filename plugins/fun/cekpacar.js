const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'checkpacar',
    alias: ['pacar', 'pasangan', 'gebetan'],
    category: 'fun',
    description: 'Check status hubungan someone',
    usage: '.checkpacar or .checkpacar @tag',
    example: '.checkpacar',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    let targetJid = m.sender
    let isOther = false
    if (m.quoted) {
        targetJid = m.quoted.sender
        isOther = true
    } else if (m.mentionedJid?.[0]) {
        targetJid = m.mentionedJid[0]
        isOther = true
    } else if (args[0]) {
        let num = args[0].replace(/[^0-9]/g, '')
        if (num.length > 5 && num.length < 20) {
            targetJid = num + '@s.whatsapp.net'
            isOther = true
        }
    }
    
    const userData = db.getUser(targetJid) || {}
    
    if (!userData.fun?.pasangan) {
        const name = isOther ? `@${targetJid.split('@')[0]}` : 'You'
        await m.react('💔')
        return m.reply(
            `💔 *sᴛᴀᴛᴜs ʜᴜʙᴜɴɢᴀɴ*\n\n` +
            `*${name}* no punya pasangan.\n` +
            `TIP: Cari pasangan first with \`${m.prefix}tembak @tag\``,
            { mentions: isOther ? [targetJid] : [] }
        )
    }
    
    const partnerJid = userData.fun.pasangan
    const partnerData = db.getUser(partnerJid) || {}
    const isMuelderl = partnerData.fun?.pasangan === targetJid
    const name = isOther ? `@${targetJid.split('@')[0]}` : 'You'
    if (isMuelderl) {
        await m.react('💕')
        await m.reply(
            `💕 *sᴛᴀᴛᴜs ʜᴜʙᴜɴɢᴀɴ*\n\n` +
            `*${name}* currently pawayn with @${partnerJid.split('@')[0]}! 🥳`,
            { mentions: [targetJid, partnerJid] }
        )
    } else {
        await m.react('💭')
        await m.reply(
            `💭 *sᴛᴀᴛᴜs ʜᴜʙᴜɴɢᴀɴ*\n\n` +
            `*${name}* again pdkt the same as @${partnerJid.split('@')[0]}\n` +
            `Status: *Ingantung* 😅\n\n` +
            `Waiting answeran...`,
            { mentions: [targetJid, partnerJid] }
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
