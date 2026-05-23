const pluginConfig = {
    name: 'stopjpm',
    alias: ['stopjasher', 'stopjaser'],
    category: 'jpm',
    description: 'Hentikan process JPM',
    usage: '.stopjpm',
    example: '.stopjpm',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    if (!global.statusjpm) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> No there is JPM that currently running`)
    }
    
    global.stopjpm = true
    
    m.react('⏹️')
    await m.reply(`⏹️ *sᴛᴏᴘ ᴊᴘᴍ*\nMenghentikan process JPM...`)
}

module.exports = {
    config: pluginConfig,
    handler
}
