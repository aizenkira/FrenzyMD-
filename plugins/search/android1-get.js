const axios = require('axios')
const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'android1-get',
    alias: ['an1get', 'an1dl'],
    category: 'search',
    description: 'Download APK from Android1',
    usage: '.android1-get <url>',
    example: '.android1-get https://an1.com/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energy: 1,
    isEnabled: true
}

const NEOXR_APIKEY = config.APItoy?.neoxr || 'Milik-Bot-frenzyMD'

async function handler(m, { sock }) {
    const url = m.text?.trim()
    
    if (!url || !url.includes('an1.com')) {
        return m.reply(`❌ URL no valid! Must URL from an1.com`)
    }
    
    m.react('🕕')
    
    try {
        const { data } = await axios.get(`https://api.neoxr.eu/api/an1-get?url=${encodeURIComponent(url)}&apikey=${NEOXR_APIKEY}`, {
            timeout: 60000
        })
        
        if (!data?.status || !data?.data) {
            throw new Error('Failed fetch detail APK')
        }
        
        const app = data.data
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'frenzy-AI'
        if (app.url) {
            await sock.sendMessage(m.chat, {
                document: { url: app.url },
                fileName: app.name,
                mimetype: 'application/vnd.android.package-archive',
                contextInfo: {
                    forwardingScore: 99,
                    isForwarded: true,
                }
            }, { quoted: m })
            
            m.react('✅')
        } else {
            caption += `> ⚠️ Download URL no terseina`
            
            await sock.sendMessage(m.chat, {
                text: caption,
                contextInfo: {
                    forwardingScore: 9999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: saluranId,
                        newsletterName: saluranName,
                        serverMessageId: 127
                    }
                },
                interactiveButtons: [{
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        insplay_text: '🌐 Buka in Browser',
                        url: url
                    })
                }]
            }, { quoted: m })
            
            m.react('⚠️')
        }
        
    } catch (err) {
        console.log(err)
        m.react('☢')
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
