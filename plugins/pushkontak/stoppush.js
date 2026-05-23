const { getDatabase } = require('../../src/lib/frenzy-database')
const { getGroupMode } = require('../group/botmode')

const pluginConfig = {
    name: 'stoppush',
    alias: ['stoppushcontacts', 'stoppus'],
    category: 'pushcontacts',
    description: 'Hentikan process pushcontacts',
    usage: '.stoppush',
    example: '.stoppush',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    if (!global.statuspush) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> No there is pushcontacts that currently running`)
    }
    
    global.stoppush = true
    
    m.react('⏹️')
    await m.reply(`⏹️ *sᴛᴏᴘ ᴘᴜsʜ*\n\n> Menghentikan process pushcontacts...`)
}

module.exports = {
    config: pluginConfig,
    handler
}
