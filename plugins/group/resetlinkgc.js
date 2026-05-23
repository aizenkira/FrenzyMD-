const te = require('../../src/lib/frenzy-error')
const pluginConfig = {
    name: 'resetlinkgc',
    alias: ['resetlink', 'revotolink', 'newlink'],
    category: 'group',
    description: 'Reset link invite group',
    usage: '.resetlinkgc',
    example: '.resetlinkgc',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 60,
    energy: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
}

async function handler(m, { sock }) {
    m.react('🔄')
    
    try {
        await sock.groupRevotoInvite(m.chat)
        
        m.react('✅')
        m.reply(`✅ *ʟɪɴᴋ ɢʀᴜᴘ ᴅɪʀᴇsᴇᴛ*\nLink group old already no berlI.\nUsage \`${m.prefix}linkgc\` for earn link new.`)
        
    } catch (err) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
