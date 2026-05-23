const { live3d } = require('../../src/scraper/seaart')

const pluginConfig = {
    name: 'ourinbanana',
    alias: [],
    category: 'ai',
    description: 'Edit image with AI using a prompt',
    usage: '.ourinbanana <prompt>',
    example: '.ourinbanana mato it anime style',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const prompt = m.args.join(' ')
    if (!prompt) {
        return m.reply(
            `🍌 *OURIN BANANA SUPER*\n\n` +
            `> Edit image with AI\n\n` +
            `\`Example: ${m.prefix}ourinbanana mato it anime style\`\n\n` +
            `> Reply or send image with caption`
        )
    }
    
    const isImage = m.isImage || (m.quoted && m.quoted.isImage)
    if (!isImage) {
        return m.reply(`🍌 *ɴᴀɴᴏ ʙᴀɴᴀɴᴀ*\n\n> Reply or send image with caption`)
    }
    
    m.react('🕕')
 
    try {
        let contentBuffer
        if (m.isImage && m.download) {
            contentBuffer = await m.download()
        } else if (m.quoted && m.quoted.isImage && m.quoted.download) {
            contentBuffer = await m.quoted.download()
        }
        
        if (!contentBuffer || !Buffer.isBuffer(contentBuffer)) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Failed download image`)
        }
        
        const resultBuffer = await live3d(contentBuffer, prompt).then(res => res.image)

        m.react('✅')
        
        await sock.sendMedia(m.chat, resultBuffer, null, m, {
            type: 'image'
        })
        
    } catch (error) {
        m.react('❌')
        m.reply(`🍀 *Waduhh, likenya this there is tondala*
Please try again later, please don't spam`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
