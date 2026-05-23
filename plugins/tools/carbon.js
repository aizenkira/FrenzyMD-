const te = require('../../src/lib/frenzy-error')
const pluginConfig = {
    name: ['carbon', 'carbonify', 'carboncode'],
    alias: [],
    category: 'tools',
    description: 'Create image code with display/appearance carbon style',
    usage: '.carbon <code>',
    example: '.carbon console.log("Hello World")',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

const { generateCarbon } = require('../../src/lib/frenzy-carbon')

async function handler(m, { sock }) {
    const text = m.text || m.quoted?.text
    
    if (!text) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}carbon <code>\`\n` +
            `> Or reply message berisi code\n\n` +
            `> Example: \`${m.prefix}carbon console.log("Hello")\``
        )
    }
    
    await m.reply(`🕕 *Create carbon image...*`)
    
    try {
        const buffer = await generateCarbon(text)
        
        await sock.sendMessage(m.chat, {
            image: buffer,
            caption: `🖥️ *Carbon Code*\n> By: ${m.pushName}`
        }, { quoted: m })
        
        m.react('🖥️')
        
    } catch (err) {
        m.react('☢')
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
