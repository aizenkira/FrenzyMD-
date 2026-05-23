const pluginConfig = {
    name: 'delpp',
    alias: ['delprofilebot', 'delppbot', 'deleteppbot'],
    category: 'tools',
    description: 'Mengdelete profile photo bot',
    usage: '.delpp',
    example: '.delpp',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        const botJid = sock.user?.id
        if (!botJid) {
            await m.reply(`❌ Bot JID not found.`)
            return
        }
        
        await sock.removeProfilePicture(botJid)
        
        await m.reply(
            `✅ *ᴘᴘ ʙᴏᴛ ᴅɪʜᴀᴘᴜs*\n\n` +
            `> Foto profil bot success deleted!`
        )
    } catch (error) {
        await m.reply(
            `❌ *ɢᴀɢᴀʟ*\n\n` +
            `> Cannot mengdelete photo bot.\n` +
            `> _${error.message}_`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
} 
