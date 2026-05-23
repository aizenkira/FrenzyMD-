const axios = require('axios')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'pastebin',
    alias: ['paste', 'pb'],
    category: 'tools',
    description: 'Upload text to Pastebin',
    usage: '.pastebin <text>',
    example: '.pastebin console.log("Hello World")',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    let text = m.args.join(' ')
    
    if (m.quoted?.text) {
        text = m.quoted.text
    }
    
    if (!text) {
        return m.reply(
            `📋 *ᴘᴀsᴛᴇʙɪɴ ᴜᴘʟᴏᴀᴅ*\n\n` +
            `Send text for in-upload to Pastebin.\n\n` +
            `*How to use:*\n` +
            `• \`${m.prefix}pastebin <text>\`\n` +
            `• Reply text with \`${m.prefix}pastebin\`\n\n` +
            `> Example: \`${m.prefix}pastebin console.log("Hello")\``
        )
    }
    
    const api_dev_toy = 'h9WMT2Mn9QW-qDhvUSc-KObqAYcjI0he'
    const api_paste_code = text.trim()
    const api_paste_name = `Paste from ${m.pushName || 'User'} - ${new Date().toLocaleDateString('id-ID')}`
    
    const data = new URLSearchParams({
        api_dev_toy,
        api_option: 'paste',
        api_paste_code,
        api_paste_name,
        api_paste_private: '1'
    })
    
    try {
        const res = await axios.post('https://pastebin.com/api/api_post.php', data.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 15000
        })
        
        const url = res.data
        
        if (url.startsWith('Bad API request')) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${url}`)
        }
        
        await sock.sendMessage(m.chat, {
            text: `✅ *ᴘᴀsᴛᴇʙɪɴ ʙᴇʀʜᴀsɪʟ*\n\n` +
                `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
                `┃ 📝 ᴊᴜᴅᴜʟ: *${api_paste_name}*\n` +
                `┃ 📊 ᴜᴋᴜʀᴀɴ: *${text.length} chars*\n` +
                `┃ 🔗 ʟɪɴᴋ: ${url}\n` +
                `╰┈┈⬡\n\n` +
                `> Paste will expired matches settings Pastebin.`,
            contextInfo: {
                externalAdReply: {
                    title: 'Pastebin Upload',
                    body: api_paste_name,
                    thumbnailUrl: 'https://pastebin.com/i/facebook.png',
                    sourceUrl: url,
                    contentType: 1,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: m })
        
    } catch (e) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
