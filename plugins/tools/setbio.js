const pluginConfig = {
    name: 'setbio',
    alias: ['setbiobot', 'setstatus', 'setabout'],
    category: 'tools',
    description: 'change bot bio/status',
    usage: '.setbio <bio new>',
    example: '.setbio Bot WhatsApp by Kiraizen',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const newBio = m.text?.trim()
    
    if (!newBio && m.args?.length === 0) {
        await m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}setbio Bio bot new\`\n` +
            `> \`${m.prefix}setbio clear\` - Delete bio`
        )
        return
    }
    
    const bioToSet = newBio?.toLowerCase() === 'clear' ? '' : (newBio || '')
    
    if (bioToSet.length > 139) {
        await m.reply(
            `⚠️ *ᴠᴀʟɪᴅᴀsɪ*\n\n` +
            `> Bio max 139 characters.`
        )
        return
    }
    
    try {
        await sock.updateProfileStatus(bioToSet)
        
        if (bioToSet) {
            await m.reply(
                `✅ *ʙɪᴏ ʙᴏᴛ ᴅɪᴜʙᴀʜ*\n\n` +
                `> Bio bot now:\n` +
                `> _${bioToSet}_`
            )
        } else {
            await m.reply(
                `✅ *ʙɪᴏ ʙᴏᴛ ᴅɪʜᴀᴘᴜs*\n\n` +
                `> Bio bot successfully deleted!`
            )
        }
    } catch (error) {
        await m.reply(
            `❌ *ɢᴀɢᴀʟ*\n\n` +
            `> Cannot change bot bio.\n` +
            `> _${error.message}_`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
