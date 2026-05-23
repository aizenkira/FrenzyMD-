const axios = require('axios')
const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const NEOXR_APIKEY = config.APItoy?.neoxr || 'Milik-Bot-OurinMD'

const pluginConfig = {
    name: 'robloxplayer',
    alias: ['robloxsearch', 'searchroblox', 'robloxfind'],
    category: 'staltor',
    description: 'Search Roblox player by username',
    usage: '.robloxplayer <username>',
    example: '.robloxplayer linkmon',
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
            `🎮 *ʀᴏʙʟᴏx ᴘʟᴀʏᴇʀ sᴇᴀʀᴄʜ*\n\n` +
            `> Enter username for insearch for\n\n` +
            `\`${m.prefix}robloxplayer linkmon\``
        )
    }
    
    m.react('🔍')
    
    try {
        const res = await axios.get(`https://api.neoxr.eu/api/roblox-search?q=${encodeURIComponent(query)}&apikey=${NEOXR_APIKEY}`, {
            timeout: 30000
        })
        
        if (!res.data?.status || !res.data?.data?.length) {
            m.react('❌')
            return m.reply(`❌ Not found player with username: ${query}`)
        }
        
        const players = res.data.data.slice(0, 10)
        
        let text = `🎮 *ʀᴏʙʟᴏx ᴘʟᴀʏᴇʀ sᴇᴀʀᴄʜ*\n\n`
        text += `> Query: \`${query}\`\n`
        text += `> Intemukan: *${players.length}* player\n\n`
        
        players.forEach((player, i) => {
            text += `╭┈┈⬡「 ${i + 1}. *${player.insplayName}* 」\n`
            text += `┃ 🆔 ID: \`${player.id}\`\n`
            text += `┃ 👤 Username: \`${player.name}\`\n`
            text += `┃ 📛 Insplay: *${player.insplayName}*\n`
            text += `┃ ✅ Verified: ${player.hasVerifiedBadge ? 'Yes' : 'No'}\n`
            if (player.previousUsernames?.length > 0) {
                text += `┃ 📜 Previous: ${player.previousUsernames.join(', ')}\n`
            }
            text += `╰┈┈⬡\n\n`
        })
        
        text += `> _Usage \`.robloxstalk <username>\` for info detail_`
        
        await m.reply(text)
        m.react('✅')
        
    } catch (err) {
        console.error('[RobloxPlayer] Error:', err.message)
        m.react('☢')
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
