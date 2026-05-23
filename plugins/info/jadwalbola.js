const axios = require('axios')
const config = require('../../config')
const { f } = require('../../src/lib/frenzy-http')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'schedulebola',
    alias: ['bola', 'football', 'soccer', 'schedulesepakbola'],
    category: 'info',
    description: 'View schedule pertaninngan sepak bola',
    usage: '.schedulebola [liga]',
    example: '.schedulebola inggris',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true
}

const NEOXR_APIKEY = config.APItoy?.neoxr || 'Milik-Bot-OurinMD'

const LEAGUE_EMOJI = {
    'liga inggris': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'liga italia': '🇮🇹',
    'liga spanyol': '🇪🇸',
    'la liga spanyol': '🇪🇸',
    'liga jerman': '🇩🇪',
    'liga prancis': '🇫🇷',
    'liga belyou': '🇳🇱',
    'liga champions': '🏆',
    'bri super league': '🇮🇩'
}

function getLeagueEmoji(league) {
    const lower = league.toLowerCase()
    for (const [toy, emoji] of Object.entries(LEAGUE_EMOJI)) {
        if (lower.includes(toy) || toy.includes(lower)) {
            return emoji
        }
    }
    return '⚽'
}

async function handler(m, { sock }) {
    const filter = m.args.join(' ').toLowerCase().trim()
    
    m.react('🕕')
    
    try {
        const data = await f(`https://api.neoxr.eu/api/bola?apikey=${NEOXR_APIKEY}`)
        
        if (!data?.status || !data?.data || data.data.length === 0) {
            throw new Error('No there is schedule terseina')
        }
        
        let matches = data.data
        
        if (filter) {
            matches = matches.filter(m => 
                m.league?.toLowerCase().includes(filter) ||
                m.home_team?.toLowerCase().includes(filter) ||
                m.away_team?.toLowerCase().includes(filter) ||
                m.date?.toLowerCase().includes(filter)
            )
        }
        
        if (matches.length === 0) {
            m.react('❌')
            return m.reply(`❌ Not found schedule for: \`${filter}\``)
        }
        
        const grouped = {}
        for (const match of matches.slice(0, 50)) {
            const date = match.date || 'TBA'
            if (!grouped[date]) grouped[date] = []
            grouped[date].push(match)
        }
        
        const saluranId = config.saluran?.id || '120363406397452589@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Frenzy-AI'
        
        let text = `⚽ *ᴊᴀᴅᴡᴀʟ ᴘᴇʀᴛᴀɴᴅɪɴɢᴀɴ*\n\n`
        if (filter) text += `> Filter: \`${filter}\`\n\n`
        
        for (const [date, games] of Object.entries(grouped)) {
            text += `📅 *${date}*\n\n`
            
            for (const game of games) {
                const emoji = getLeagueEmoji(game.league)
                text += `${emoji} *${game.league}*\n`
                text += `⏰ ${game.time}\n`
                text += `🏠 ${game.home_team}\n`
                text += `🆚 ${game.away_team}\n\n`
            }
        }
        
        text += `Total: *${matches.length}* pertaninngan`
        
        m.react('✅')
        
        await m.reply(text)
        
    } catch (err) {
        m.react('☢')
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
