const axios = require('axios')
const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'apkmod',
    alias: ['modapk2', 'apkpremium'],
    category: 'search',
    description: 'Cari and download APK MOD Premium',
    usage: '.apkmod <query>',
    example: '.apkmod vpn',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

const NEOXR_APIKEY = config.APItoy?.neoxr || 'Milik-Bot-OurinMD'

async function handler(m, { sock }) {
    const text = m.text?.trim()
    
    if (!text) {
        return m.reply(
            `📱 *ᴀᴘᴋ ᴍᴏᴅ sᴇᴀʀᴄʜ*\n\n` +
            `> Cari APK MOD Premium\n\n` +
            `> Example:\n` +
            `\`${m.prefix}apkmod vpn\``
        )
    }
    
    m.react('🕕')
    
    try {
        const { data } = await axios.get(`https://api.neoxr.eu/api/apkmod?q=${encodeURIComponent(text)}&apikey=${NEOXR_APIKEY}`, {
            timeout: 30000
        })
        
        if (!data?.status || !data?.data?.length) {
            m.react('❌')
            return m.reply(`❌ Not found hasil for: \`${text}\``)
        }
        
        const apps = data.data.slice(0, 15)
        
        const saluranId = config.saluran?.id || '120363406397452589@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'frenzy-AI'
        
        let caption = `📱 *Hasil pensearch foran from ${text}*\n\n`
        
        apps.forEach((app, i) => {
            caption += `*${i + 1}.* ${app.name}\n`
            caption += `   ├ 🏷️ ${app.versionon}\n`
            caption += `   └ 🔓 ${app.mod}\n\n`
        })
        
        const buttons = apps.slice(0, 10).map((app, i) => ({
            title: `${i + 1}. ${app.name.substring(0, 24)}`,
            description: `${app.versionon} • ${app.mod}`,
            id: `${m.prefix}apkmod-get ${i + 1} ${text}`
        }))
        
        global.apkmodSession = global.apkmodSession || {}
        global.apkmodSession[m.sender] = {
            results: apps,
            query: text,
            timestamp: Date.now()
        }
        
        m.react('✅')
        
        await sock.sendButton(m.chat, require('fs').readFileSync('./assets/images/frenzy.jpg'), caption, m, {
            buttons: [{
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                    title: '📱 Choose APK MOD',
                    sections: [{
                        title: `Hasil for "${text}"`,
                        rows: buttons
                    }]
                })
            }],
            footer: 'Chooselah'
        })
        
    } catch (err) {
        m.react('☢')
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
