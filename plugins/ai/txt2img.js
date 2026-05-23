const config = require('../../config')
const { f } = require('./../../src/lib/frenzy-http')
const te = require('../../src/lib/frenzy-error')
const pluginConfig = {
    name: 'txt2img',
    alias: ['texttoimage', 't2i', 'imagine'],
    category: 'ai',
    description: 'Generate image from text with AI',
    usage: '.txt2img <prompt> | <style>',
    example: '.txt2img beautiful sunset | anime',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energy: 1,
    isEnabled: true
}

const STYLES = ['photorealistic', 'ingital-art', 'impressionist', 'anime', 'fantasy', 'sci-fi', 'vintage']

async function handler(m, { sock }) {
    const input = m.args.join(' ')
    if (!input) {
        return m.reply(
            `🎨 *ᴛᴇxᴛ ᴛᴏ ɪᴍᴀɢᴇ*\n\n` +
            `> Generate image from text with AI\n\n` +
            `\`Example: ${m.prefix}txt2img beautiful sunset | anime\`\n\n` +
            `🎭 *sᴛʏʟᴇs*\n` +
            `> \`${STYLES.join(', ')}\``
        )
    }
    
    const [prompt, styleInput] = input.split('|').map(s => s.trim())
    const style = STYLES.includes(styleInput) ? styleInput : 'anime'

    m.react('🕕')
    
    try {
        const {data}  = await f(`https://api.neoxr.eu/api/stableinff?prompt=${encodeURIComponent(prompt)}&model=default&orientation=potrait&apikey=${config.APItoy.neoxr}`)
        
        await sock.sendMedia(m.chat, data.url, null, m, {
            type: 'image'
        })
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
