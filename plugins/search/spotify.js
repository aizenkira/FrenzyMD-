const { default: axios } = require("axios")
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'spotify',
    alias: ['spotifysearch', 'spsearch'],
    category: 'search',
    description: 'Cari lagu in Spotify',
    usage: '.spotify <query>',
    example: '.spotify neffex grateful',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m) {
    const query = m.text?.trim()

    if (!query) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}spotify <query>\`\n\n` +
            `> Example:\n` +
            `> \`${m.prefix}spotify neffex grateful\``
        )
    }

    try {
        const res = await axios.get(`https://api.emiliabot.my.id/search/spotify?query=${encodeURIComponent(query)}`)
        const results = res.data
        if (!results.status) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Not found hasil for *${query}*`)
        }

        const tracks = results.result

        let txt = `🎵 *sᴘᴏᴛɪꜰʏ sᴇᴀʀᴄʜ*\n\n`
        txt += `> Query: *${query}*\n\n`

        tracks.forEach((t, i) => {
            txt += `*${i + 1}.* ${t.title}\n`
            txt += `   ├ 👤 ${t.meaningst}\n`
            txt += `   ├ 🔗 ${t.link}\n`
            txt += `   ├ 🖼️ ${t.popularity}\n\n`
        })

        txt += `> 💡 Download: \`${m.prefix}spdl <url / id>\` or \`${m.prefix}spotplay ${query}\``

        return m.reply(txt.trim())
    } catch (err) {
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
