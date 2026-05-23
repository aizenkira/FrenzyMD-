const { pinterest } = require('btch-downloader')
const { generateWAMessage, generateWAMessageFromContent, jidNormalizedUser } = require('ourin')
const axios = require('axios')
const crypto = require('crypto')
const te = require('../../src/lib/frenzy-error')
const { f } = require('../../src/lib/frenzy-http')

const pluginConfig = {
    name: 'pins',
    alias: ['pinsearch', 'pinterestsearch'],
    category: 'search',
    description: 'Search image in Pinterest (album)',
    usage: '.pins <query>',
    example: '.pins Zhao Lusi',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock, config: botConfig }) {
    const query = m.text?.trim()
    if (!query) {
        return m.reply(
            `🔍 *ᴘɪɴᴛᴇʀᴇsᴛ sᴇᴀʀᴄʜ*\n\n` +
            `> Example:\n` +
            `\`${m.prefix}pins Zhao Lusi\``
        )
    }
    m.react('🕕')

    try {
        const data = await f(`https://api.siputzx.my.id/api/s/pinterest?query=${query}`)
        
        const results = data?.data?.slice(0, 10)
        if (!results || results.length === 0) {
            m.react('❌')
            return m.reply(`❌ Not found hasil for: ${query}`)
        }

        const contentPromises = results.map(async (item, i) => {
            const imageUrl =
                item.image_url

            if (!imageUrl) return null

            try {
                return {
                    image: { url: imageUrl },
                }
            } catch (e) {
                console.log('[Pins] Image error:', e.message)
                return null
            }
        })

        const contentList = (await Promise.all(contentPromises)).filter(m => m !== null)

        if (contentList.length === 0) {
            m.react('❌')
            return m.reply('❌ Failed memuat image')
        }


        try {
            
            await sock.sendMessage(m.chat, {
                albumMessage: contentList
            }, { quoted: m })
            m.react('✅')

        } catch (err) {
            console.log('[Pins] Album failed, send satu-satu:', err.message)

            for (const content of contentList) {
                await sock.sendMessage(
                    m.chat,
                    content,
                    { quoted: m }
                )
            }

            m.react('✅')
        }

    } catch (err) {
        console.error('[Pins] Error:', err.message)
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}