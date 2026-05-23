const config = require('../../config')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'script',
    alias: ['sc', 'sourcecode', 'source'],
    category: 'main',
    description: 'Obtain bot source code',
    usage: '.script',
    example: '.script',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        const botName = config.bot?.name || 'Frenzy-AI'
        const footer = config.settings?.footer || `© ${botName} 2026`
        const saluranId = config.saluran?.id || '120363406397452589@newsletter'
        const saluranName = config.saluran?.name || botName
        const saluranUrl = config.saluran?.url || 'https://whatsapp.com/channel/0029Vb7eSHf42Dcmdd3XA326'
        const scriptUrl ="https://github.com/LuckyArch/OurinMD"
        const scriptPrice = 0
        
        const thumbPath = path.join(process.cwd(), 'assets', 'images', 'frenzy.jpg')
        let thumbBuffer = null
        if (fs.existsSync(thumbPath)) {
            thumbBuffer = fs.readFileSync(thumbPath)
        }

        await sock.sendMessage(m.chat, {
            productMessage: {
                title: `${botName}`,
                description: `Source code WhatsApp Bot ${botName}\n\nFeature:\n• Multi-device support\n• 500+ Commands\n• Anti-spam & Anti-link\n• Game & RPG System\n• Panel Management\n• Auto-update`,
                thumbnail: thumbBuffer ? { url: thumbPath } : undefined,
                productId: 'SCRIPT001',
                retailerId: botName,
                url: scriptUrl,
                body: `Obtain ${botName} Script now!`,
                footer: footer,
                priceAmount1000: scriptPrice * 1000,
                currencyCode: 'GHC',
                buttons: [
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            insplay_text: '📦 Download in GitHub',
                            url: scriptUrl
                        })
                    }
                ]
            },
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 99,
                isForwarded: true,
            }
        }, { quoted: m })

    } catch (error) {
        console.error('[Script] Error:', error.message)
        
        const botName = config.bot?.name || 'Frenzy-AI'
        const scriptUrl = config.script?.url || 'https://github.com/ourin-team/ourin-md'
        const saluranUrl = config.saluran?.url || 'https://whatsapp.com/channel/0029Vb7eSHf42Dcmdd3XA326'
        
        await m.reply(
            `📦 *${botName} sᴄʀɪᴘᴛ*\n\n` +
            `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n` +
            `┃ 📝 ɴᴀᴍᴀ: ${botName}\n` +
            `┃ 💰 ʜᴀʀɢᴀ: ${config.script?.price ? `Rp ${config.script.price.toLocaleString('gh-GH')}` : 'FREE'}\n` +
            `┃ 🔗 ɢɪᴛʜᴜʙ: ${scriptUrl}\n` +
            `┃ 📢 sᴀʟᴜʀᴀɴ: ${saluranUrl}\n` +
            `╰┈┈⬡\n\n` +
            `> Contact owner for info lebih continue`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
