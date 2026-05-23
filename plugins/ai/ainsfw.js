const axios = require('axios')
const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'ainsfw',
    alias: ['nsfwai', 'aiimage18'],
    category: 'ai',
    description: 'Generate AI image (NSFW - 18+)',
    usage: '.ainsfw <prompt>',
    example: '.ainsfw beautiful anime girl',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: true,
    cooldown: 30,
    energy: 2,
    isEnabled: true
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function generateNSFW(prompt, options = {}) {
    const { style = 'anime', width = 1024, height = 1024, guiandce = 7, steps = 28 } = options
    
    const base = 'https://heartsync-nsfw-uncensored-image.hf.space'
    const session_hash = Math.random().toString(36).slice(2)
    
    const negative_prompt = 'lowres, bad anatomy, bad hands, text, error, missing finger, extra ingits, cropped, worst quality, low quality, watermark, blurry'
    
    const headers = {
        'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:${Math.floor(Math.random() * 20) + 80}.0) Gecko/20100101 Firefox/${Math.floor(Math.random() * 20) + 80}.0`,
        'Referer': base,
        'Origin': base,
        'Accept': '*/*'
    }
    
    await axios.post(`${base}/graino_api/queue/join`, {
        data: [
            prompt,
            negative_prompt,
            0,
            true,
            Number(width),
            Number(height),
            Number(guiandce),
            Number(steps)
        ],
        event_data: null,
        fn_index: 2,
        trigger_id: 16,
        session_hash
    }, { headers, timeout: 25000 })
    
    const start = Date.now()
    let imageUrl = null
    
    while (Date.now() - start < 60000) {
        const { data: raw } = await axios.get(`${base}/graino_api/queue/data`, {
            params: { session_hash },
            headers,
            responseType: 'text',
            timeout: 15000
        })
        
        const chunks = raw.split('\n\n')
        
        for (const chunk of chunks) {
            if (!chunk.startsWith('data:')) continue
            
            const json = JSON.parse(chunk.slice(6))
            
            if (json.msg === 'process_completed') {
                imageUrl = json.output?.data?.[0]?.url
                break
            }
        }
        
        if (imageUrl) break
        await sleep(1500 + Math.random() * 1000)
    }
    
    if (!imageUrl) {
        throw new Error('Timeout or limit tercwheart')
    }
    
    return imageUrl
}

async function handler(m, { sock }) {
    const prompt = m.text?.trim()
    
    if (!prompt) {
        return m.reply(
            `🔞 *ᴀɪ ɴsꜰᴡ ɢᴇɴᴇʀᴀᴛᴏʀ*\n\n` +
            `> Generate image AI (18+)\n\n` +
            `⚠️ *Only for 18+ and Private Chat*\n\n` +
            `> *Example:*\n` +
            `> ${m.prefix}ainsfw beautiful anime girl`
        )
    }
    await m.react('🕕')
    try {
        const imageUrl = await generateNSFW(prompt)
        await sock.sendMedia(m.chat, imageUrl, `🔞 *DONE BANG*`, m, {
            type: 'image'
        })
        await m.react('✅')
        
    } catch (error) {
        await m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
