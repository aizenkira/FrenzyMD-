const { f } = require("../../src/lib/frenzy-http")
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: ['nglspam'],
    alias: ['spamngl'],
    category: 'tools',
    description: 'Generate image NGL',
    usage: '.nglspam <username>|<message>|<amount>',
    example: '.nglspam <username>|<message>|<amount>',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const [username, message, amount] = m.text.split('|')
    
    if (!text) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}spamngl <username>|<message>|<amount>\`\n\n` +
            `> Example: \`${m.prefix}spamngl Zann|Haii|33\``
        )
    }
    
    await m.react('🕕')
    
    try {
        const apiUrl = `https://api.nexray.web.id/tools/spamngl?url=${encodeURIComponent('https://ngl.link/' + username)}&message=${encodeURIComponent(message)}&amount=${encodeURIComponent(amount)}`
        const data = await f(apiUrl)
        if(data.status){
            await m.reply('✅ Success spam ngl')
        }else{
            await m.reply('❌ Failed spam ngl')
        }
        
        m.react('✅')
        
    } catch (err) {
        m.react('☢')
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
