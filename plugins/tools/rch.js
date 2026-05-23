const axios = require('axios')

const pluginConfig = {
    name: 'rch',
    alias: ['frch', 'reactch', 'fatoreactch', 'fatorch'],
    category: 'tools',
    description: 'Send react to post channel WhatsApp',
    usage: '.rch <link_post> <emoji>',
    example: '.rch https://whatsapp.com/channel/xxx/123 😂😍',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const args = m.args || []
    
    if (args.length < 2) {
        return m.reply(
            `⚠️ *ꜰᴏʀᴍᴀᴛ sᴀʟᴀʜ!*\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ \`${m.prefix}rch <link_post> <emoji>\`\n` +
            `╰┈┈⬡\n\n` +
            `📌 *Example:*\n` +
            `\`${m.prefix}rch https://whatsapp.com/channel/xxx/123 😂\`\n` +
            `\`${m.prefix}rch https://whatsapp.com/channel/xxx/123 😂😱🔥\``
        )
    }
    
    const link = args[0]
    const emoji = args.slice(1).join('')
    
    if (!link.includes('whatsapp.com/channel')) {
        return m.reply(`❌ *ʟɪɴᴋ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ*\n\n> Link must from channel WhatsApp!`)
    }
    
    if (!emoji) {
        return m.reply(`❌ *ᴇᴍᴏᴊɪ ᴋᴏsᴏɴɢ*\n\n> Enter emoji for react!`)
    }
    
    m.react('🕕')
    
    try {
        const url = `https://api-faa.my.id/faa/react-channel?url=${encodeURIComponent(link)}&react=${encodeURIComponent(emoji)}`
        
        const { data } = await axios.get(url, { timeout: 30000 })
        
        if (data?.status) {
            m.react('✅')
            await m.reply(
                `✅ *ʀᴇᴀᴄᴛ sᴇɴᴛ!*\n\n` +
                `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
                `┃ 🔗 Target: \`${data.info?.destination || link}\`\n` +
                `┃ 🎭 Emoji: ${data.info?.reaction_used?.replace(/,/g, ' ') || emoji.replace(/,/g, ' ')}\n` +
                `╰┈┈⬡`
            )
        } else {
            throw new Error(data?.message || 'Failed sending reaction')
        }
    } catch (err) {
        m.react('❌')
        await m.reply(
            `❌ *ɢᴀɢᴀʟ ᴍᴇɴɢɪʀɪᴍ ʀᴇᴀᴋsɪ*\n\n` +
            `> Limit RCH ran out, please wait day next \n\n`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
