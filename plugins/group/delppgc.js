const pluginConfig = {
    name: 'delppgc',
    alias: ['delprofilegc', 'delppgroup', 'deleteppgc'],
    category: 'group',
    description: 'Mengdelete profile photo group',
    usage: '.delppgc',
    example: '.delppgc',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    isBotAdmin: true,
    cooldown: 10,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        await sock.removeProfilePicture(m.chat)
        
        await m.reply(
            `✅ PP Group now already botak`
        )
    } catch (error) {
        await m.reply(
            `❌ *ɢᴀɢᴀʟ*\n\n` +
            `> Cannot mengdelete photo group.\n` +
            `> _${error.message}_`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
