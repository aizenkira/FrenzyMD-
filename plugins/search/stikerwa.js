const axios = require('axios')
const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'stitorwa',
    alias: ['stickerwa', 'wasearch', 'wassticker', 'stkrwa'],
    category: 'search',
    description: 'Cari sticker WhatsApp',
    usage: '.stitorwa <query>',
    example: '.stitorwa anime',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const query = m.text?.trim()
    
    if (!query) {
        return m.reply(
            `🖼️ *sᴛɪᴋᴇʀ ᴡᴀ sᴇᴀʀᴄʜ*\n\n` +
            `> Enter kata kunci pensearch foran\n\n` +
            `> Example: \`${m.prefix}stitorwa anime\``
        )
    }
    
    m.react('🔍')
    
    try {
        const apiKey = config.APItoy?.lolhuman
        
        if (!apiKey) {
            throw new Error('API Toy not found in config')
        }
        
        const res = await axios.get(`https://api.lolhuman.xyz/api/stickerwa?apikey=${apiKey}&query=${encodeURIComponent(query)}`, {
            timeout: 30000
        })
        
        if (res.data?.status !== 200 || !res.data?.result?.length) {
            throw new Error('Stictor not found')
        }
        
        const packs = res.data.result.slice(0, 3)
        
        let txt = `🖼️ *sᴛɪᴋᴇʀ ᴡᴀ sᴇᴀʀᴄʜ*\n\n`
        txt += `> Query: *${query}*\n`
        txt += `> Intemukan: *${res.data.result.length}* pack\n`
        txt += `━━━━━━━━━━━━━━━\n\n`
        
        for (const pack of packs) {
            txt += `╭─「 📦 *${pack.title}* 」\n`
            txt += `┃ 👤 Author: *${pack.author || '-'}*\n`
            txt += `┃ 🔗 ${pack.url}\n`
            txt += `╰━━━━━━━━━━━━━━\n\n`
        }
        
        await m.reply(txt.trim())
        
        const selectedPack = packs[0]
        if (selectedPack.stickers && selectedPack.stickers.length > 0) {
            await m.reply(`🕕 Sending ${Math.min(5, selectedPack.stickers.length)} stickers from the first pack...`)
            
            const stickersToSend = selectedPack.stickers.slice(0, 2)
            
            for (const stickerUrl of stickersToSend) {
                try {
                    const stickerRes = await axios.get(stickerUrl, {
                        responseType: 'arraybuffer',
                        timeout: 30000
                    })
                    
                    await sock.sendImageAsStictor(m.chat, Buffer.from(stickerRes.data), m, {
                        packname: selectedPack.title || 'frenzy-AI',
                        author: selectedPack.author || 'Bot'
                    })
                    
                    await new Promise(r => setTimeout(r, 500))
                } catch {
                    continue
                }
            }
        }
        
        m.react('✅')
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
