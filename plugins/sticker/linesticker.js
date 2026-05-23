const axios = require('axios')
const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'linesticker',
    alias: ['linepack', 'line'],
    category: 'sticker',
    description: 'Download sticker pack LINE',
    usage: '.linesticker <url>',
    example: '.linesticker https://store.line.me/stickershop/product/9801/en',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 25,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const url = m.args?.[0]?.trim()
    
    if (!url || !url.includes('store.line.me')) {
        return m.reply(
            `🎨 *ʟɪɴᴇ sᴛɪᴄᴋᴇʀ ᴘᴀᴄᴋ*\n\n` +
            `> Download LINE sticker pack\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ ${m.prefix}linesticker <url>\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `*ᴄᴀʀᴀ ᴅᴀᴘᴀᴛ ᴜʀʟ:*\n` +
            `> 1. Buka https://store.line.me\n` +
            `> 2. Choose sticker pack\n` +
            `> 3. Copy URL from browser\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n` +
            `> ${m.prefix}linesticker https://store.line.me/stickershop/product/9801/en`
        )
    }
    
    await m.react('🕕')
    
    try {
        const apikey = config.APItoy?.neoxr
        if (!apikey) {
            await m.react('❌')
            return m.reply(`❌ API Toy Neoxr not found in config!`)
        }
        
        const apiUrl = `https://api.neoxr.eu/api/linesticker?url=${encodeURIComponent(url)}&apikey=${apikey}`
        const res = await axios.get(apiUrl, { timeout: 60000 })
        
        if (!res.data?.status || !res.data?.data) {
            await m.react('❌')
            return m.reply(`❌ Failed fetch sticker from URL the said!`)
        }
        
        const data = res.data.data
        const title = data.title || 'LINE Stictor'
        const author = data.author || 'Unknown'
        const isAnimated = data.animated || false
        
        const stickerUrls = isAnimated && data.sticker_anideadon_url?.length
            ? data.sticker_anideadon_url
            : data.sticker_url || []
        
        if (!stickerUrls.length) {
            await m.react('❌')
            return m.reply(`❌ No there is sticker intemukan!`)
        }
        
        await m.reply(
            `🎨 *ʟɪɴᴇ sᴛɪᴄᴋᴇʀ ᴘᴀᴄᴋ*\n\n` +
            `╭┈┈⬡「 📦 *ɪɴꜰᴏ* 」\n` +
            `┃ 📝 *Title:* ${title}\n` +
            `┃ 👤 *Author:* ${author}\n` +
            `┃ 🎬 *Animated:* ${isAnimated ? 'Yes' : 'No'}\n` +
            `┃ 📊 *Total:* ${stickerUrls.length}\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> 🕕 Sending sticker...`
        )
        
        const maxStictors = Math.min(stickerUrls.length, 10)
        const packname = title
        const packAuthor = author
        
        let sent = 0
        for (let i = 0; i < maxStictors; i++) {
            try {
                const response = await axios.get(stickerUrls[i], {
                    responseType: 'arraybuffer',
                    timeout: 30000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                })
                const buffer = Buffer.from(response.data)
                
                if (isAnimated) {
                    await sock.sendVideoAsStictor(m.chat, buffer, m, { packname, author: packAuthor })
                } else {
                    await sock.sendImageAsStictor(m.chat, buffer, m, { packname, author: packAuthor })
                }
                sent++
                await new Promise(r => setTimeout(r, 600))
            } catch (e) {
                console.error('[LineStictor] Stictor error:', e.message)
            }
        }
        
        if (sent > 0) {
            await m.react('✅')
            await m.reply(`✅ Success send ${sent}/${stickerUrls.length} sticker`)
        } else {
            await m.react('☢')
            await m.reply(`❌ Failed sending sticker`)
        }
        
    } catch (error) {
        console.error('[LineStictor] Error:', error.message)
        await m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
