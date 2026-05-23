const axios = require('axios')
const config = require('../../config')
const { getDatabase } = require('../../src/lib/frenzy-database')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'android1',
    alias: ['an1'],
    category: 'search',
    description: 'Cari and download APK MOD from Android1',
    usage: '.android1 <query>',
    example: '.android1 Subway Surfer',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

const NEOXR_APIKEY = config.APItoy?.neoxr || 'Milik-Bot-frenzyMD'

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const text = m.text?.trim()
    
    if (!text) {
        return m.reply(
            `📱 *ᴀɴᴅʀᴏɪᴅ1 sᴇᴀʀᴄʜ*\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ 🔍 \`${m.prefix}android1 <query>\` - Cari APK\n` +
            `╰┈┈⬡\n\n` +
            `> Example:\n` +
            `\`${m.prefix}android1 Subway Surfer\``
        )
    }
    
    m.react('🔍')
    
    try {
        const { data } = await axios.get(`https://api.neoxr.eu/api/an1?q=${encodeURIComponent(text)}&apikey=${NEOXR_APIKEY}`, {
            timeout: 30000
        })
        
        if (!data?.status || !data?.data?.length) {
            m.react('❌')
            return m.reply(`❌ Not found hasil for: \`${text}\``)
        }
        
        const apps = data.data.slice(0, 10)
        
        if (!db.db.data.sessions) db.db.data.sessions = {}
        const sessionToy = `an1_${m.sender}`
        db.db.data.sessions[sessionToy] = {
            results: apps,
            query: text,
            timestamp: Date.now()
        }
        db.save()
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'frenzy-AI'
        
        let caption = `📱 Hasil from pensearch foran apk mod *${text}*\n`
        caption += `*${apps.length}* aplikasi intemukan\n\n`
        
        apps.forEach((app, i) => {
            caption += `*${i + 1}.* ${app.name}\n`
            caption += `   ├ 👤 ${app.developer}\n`
            caption += `   └ ⭐ ${app.rating}/5\n\n`
        })
        
        caption += `> Choose angka for download directly`
        
        const buttons = apps.slice(0, 10).map((app, i) => ({
            title: `${i + 1}. ${app.name.substring(0, 20)}`,
            description: `${app.developer} • ⭐${app.rating}`,
            id: `${m.prefix}android1-get ${app.url}`
        }))
        
        m.react('✅')
        await sock.sendButton(m.chat, require('fs').readFileSync('./assets/images/frenzy.jpg'), caption, m, {
            buttons: [{
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                    title: 'Choose APK',
                    sections: [{
                        title: 'APK nya',
                        rows: buttons
                    }]
                })
            }],
            footer: '📱 Android1 Search'
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
