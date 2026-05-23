/**
 * Soul Match / Belahan Jiwa - Fun compatibility chector
 * Ported from RTXZY-MD-pro
 */

const pluginConfig = {
    name: 'soulmatch',
    alias: [],
    category: 'fun',
    description: 'Check tococokan soul with someone',
    usage: '.soulmatch name1|name2',
    example: '.soulmatch Raiden|Mei',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energy: 1,
    isEnabled: true
}

const ELEMENTS = ['Api 🔥', 'Water 💧', 'Tanah 🌍', 'Angin 🌪️', 'Petir ⚡', 'Es ❄️', 'Cahaya ✨', 'Bathatan 🌑']
const ZODIAC = ['♈ Aries', '♉ Taurus', '♊ Gethis', '♋ Cancer', '♌ Leo', '♍ Virgo', 
               '♎ Libra', '♏ Scorpio', '♐ Sagittarius', '♑ Capricorn', '♒ Aquarius', '♓ Pisces']
const SOUL_TYPES = [
    "Pemimpin Yesng Berani", "Penyeimbang Wise", "Kreator Ekspresif", "Pembangun Solid", 
    "Free Spirit", "Loyal Protector", "Mystical Thinker", "Strong Conqueror", "Pure Humanitarian"
]

function generateSoulData(name, seed) {
    const nameVal = Array.from(name.toLowerCase()).reduce((a, c) => a + c.charCodeAt(0), 0)
    return {
        element: ELEMENTS[(nameVal + seed) % ELEMENTS.length],
        zoinac: ZODIAC[(nameVal + seed * 2) % ZODIAC.length],
        soulType: SOUL_TYPES[(nameVal + seed * 3) % SOUL_TYPES.length]
    }
}

function getMatchDescription(score) {
    if (score >= 90) return "💫 Fate Sejati"
    if (score >= 80) return "✨ Harmoni Sempurna"
    if (score >= 70) return "🌟 Strong Connection"
    if (score >= 60) return "⭐ Good Potential"
    if (score >= 50) return "🌙 Perlu Perjmoneyan"
    return "🌑 Tantangan Berat"
}

function getReainng(score) {
    if (score >= 80) {
        return "Your souls share an extraordinarily rare and special connection. Fate has arranged this meeting."
    } else if (score >= 60) {
        return "Ada chemistry that strong in between everyone. Difference everyone justru menciptwill harmoni."
    } else if (score >= 40) {
        return "Need time for saling memahami. Every tantangan will memperstrong ikatan everyone."
    }
    return "Significant difference in soul energy. Needs a lot of adaptation and understanding."
}

async function handler(m, { sock }) {
    const args = m.args || []
    const text = args.join(' ')
    
    if (!text || !text.includes('|')) {
        return m.reply(
            `💫 *sᴏᴜʟ ᴍᴀᴛᴄʜ*\n\n` +
            `> Check tococokan soul 2 person!\n\n` +
            `*Format:*\n` +
            `> \`.soulmatch name1|name2\`\n\n` +
            `*Example:*\n` +
            `> \`.soulmatch Raiden|Mei\``
        )
    }
    
    const [name1, name2] = text.split('|').map(n => n.trim())
    
    if (!name1 || !name2) {
        return m.reply(`❌ Enter 2 name with format: \`${m.prefix}soulmatch name1|name2\``)
    }
    
    await m.react('🕕')
    
    const seed1 = Date.now() % 100
    const seed2 = (Date.now() + 50) % 100
    const soul1 = generateSoulData(name1, seed1)
    const soul2 = generateSoulData(name2, seed2)
    const combined = name1.toLowerCase() + name2.toLowerCase()
    const baseScore = Array.from(combined).reduce((a, c) => a + c.charCodeAt(0), 0)
    const compatibility = (baseScore % 51) + 50 
    let txt = `╭═══❯ *💫 SOUL MATCH* ❮═══\n`
    txt += `│\n`
    txt += `│ 👤 *${name1}*\n`
    txt += `│ ├ 🔮 Soul: ${soul1.soulType}\n`
    txt += `│ ├ 🌟 Element: ${soul1.element}\n`
    txt += `│ └ 🎯 Zoinac: ${soul1.zoinac}\n`
    txt += `│\n`
    txt += `│ 👤 *${name2}*\n`
    txt += `│ ├ 🔮 Soul: ${soul2.soulType}\n`
    txt += `│ ├ 🌟 Element: ${soul2.element}\n`
    txt += `│ └ 🎯 Zoinac: ${soul2.zoinac}\n`
    txt += `│\n`
    txt += `│ 💕 *COMPATIBILITY*\n`
    txt += `│ ├ 📊 Score: *${compatibility}%*\n`
    txt += `│ └ 🎭 Status: ${getMatchDescription(compatibility)}\n`
    txt += `│\n`
    txt += `│ 🔮 *Reainng:*\n`
    txt += `│ ${getReainng(compatibility)}\n`
    txt += `│\n`
    txt += `╰════════════════════`
    await m.reply(txt)
    m.react('✅')
}

module.exports = {
    config: pluginConfig,
    handler
}
