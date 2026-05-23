const fs = require('fs')
const path = require('path')
const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'search forfeature',
    alias: ['searchcmd', 'findcmd', 'search for', 'search', 'cf'],
    category: 'main',
    description: 'Mensearch for feature berdasarkan keyword with detail complete',
    usage: '.search forfeature <keyword>',
    example: '.search forfeature sticker',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
}

function levenshteinInstance(str1, str2) {
    const m = str1.length
    const n = str2.length
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))
    
    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1]
            } else {
                dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
            }
        }
    }
    return dp[m][n]
}

function getSimilarity(str1, str2) {
    if (typeof str1 !== 'string' || typeof str2 !== 'string') return 0
    const maxLen = Math.max(str1.length, str2.length)
    if (maxLen === 0) return 1
    const instance = levenshteinInstance(str1.toLowerCase(), str2.toLowerCase())
    return (maxLen - instance) / maxLen
}

function matchesKeyword(text, keyword) {
    if (!text || !keyword) return false
    if (typeof text !== 'string' || typeof keyword !== 'string') return false
    const textLower = text.toLowerCase()
    const keywordLower = keyword.toLowerCase()
    
    if (textLower.includes(keywordLower)) return true
    if (keywordLower.includes(textLower)) return true
    
    const words = textLower.split(/\s+/)
    for (const word of words) {
        if (word.includes(keywordLower) || keywordLower.includes(word)) return true
    }
    
    const similarity = getSimilarity(textLower, keywordLower)
    if (similarity >= 0.6) return true
    
    return false
}

function loadAllPlugins() {
    const plugins = []
    const pluginsDir = path.join(__dirname, '..')
    
    try {
        const categories = fs.readdirSync(pluginsDir).filter(f => {
            const stat = fs.statSync(path.join(pluginsDir, f))
            return stat.isDirectory()
        })
        
        for (const category of categories) {
            const categoryPath = path.join(pluginsDir, category)
            const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'))
            
            for (const file of files) {
                try {
                    const plugin = require(path.join(categoryPath, file))
                    if (plugin.config && plugin.config.name) {
                        plugins.push({
                            name: Array.isArray(plugin.config.name) ? plugin.config.name[0] : plugin.config.name,
                            alias: plugin.config.alias || [],
                            category: plugin.config.category || category,
                            description: plugin.config.description || 'No there is description',
                            usage: plugin.config.usage || '',
                            example: plugin.config.example || '',
                            isEnabled: plugin.config.isEnabled !== false,
                            isPremium: plugin.config.isPremium || false,
                            isOwner: plugin.config.isOwner || false,
                            cooldown: plugin.config.cooldown || 0,
                            energy: plugin.config.energy || 0,
                            isCase: false
                        })
                    }
                } catch {}
            }
        }
    } catch {}
    
    try {
        const { getCaseCommands } = require('../../case/frenzy')
        const caseCommands = getCaseCommands()
        
        const caseAliases = {
            'cping': ['cspeed', 'clatency'],
            'listallcase': ['lcase', 'caselist', 'allcase'],
            'listallplugin': ['lplugin', 'pluginlist', 'allplugin']
        }
        
        const caseDescriptions = {
            'cping': 'Check ping case system',
            'listallcase': 'View list all case commands',
            'listallplugin': 'View list all plugin commands'
        }
        
        for (const [category, commands] of Object.entries(caseCommands)) {
            for (const cmd of commands) {
                plugins.push({
                    name: cmd,
                    alias: caseAliases[cmd] || [],
                    category: category,
                    description: caseDescriptions[cmd] || 'Case command',
                    usage: `.${cmd}`,
                    example: `.${cmd}`,
                    isEnabled: true,
                    isPremium: false,
                    isOwner: false,
                    cooldown: 5,
                    energy: 0,
                    isCase: true
                })
            }
        }
    } catch {}
    
    return plugins
}

async function handler(m, { sock }) {
    const keyword = m.text
    
    if (!keyword) {
        return m.reply(
            `🔍 *ᴄᴀʀɪ ꜰɪᴛᴜʀ*\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ \`${m.prefix}search forfeature <keyword>\`\n` +
            `╰┈┈⬡\n\n` +
            `> Example:\n` +
            `\`${m.prefix}search forfeature sticker\`\n` +
            `\`${m.prefix}search forfeature download\`\n` +
            `\`${m.prefix}search forfeature game\``
        )
    }
    
    m.react('🕕')
    
    try {
        const allPlugins = loadAllPlugins()
        const matches = []
        
        for (const plugin of allPlugins) {
            if (!plugin.isEnabled) continue
            
            let isMatch = false
            let matchScore = 0
            let matchReason = ''
            
            if (matchesKeyword(plugin.name, keyword)) {
                isMatch = true
                matchScore = Math.max(matchScore, getSimilarity(plugin.name, keyword) * 1.2)
                matchReason = 'name'
            }
            
            for (const alias of plugin.alias) {
                if (matchesKeyword(alias, keyword)) {
                    isMatch = true
                    matchScore = Math.max(matchScore, getSimilarity(alias, keyword) * 1.1)
                    matchReason = matchReason || 'alias'
                }
            }
            
            if (matchesKeyword(plugin.description, keyword)) {
                isMatch = true
                matchScore = Math.max(matchScore, getSimilarity(plugin.description, keyword) * 0.8)
                matchReason = matchReason || 'description'
            }
            
            if (matchesKeyword(plugin.category, keyword)) {
                isMatch = true
                matchScore = Math.max(matchScore, getSimilarity(plugin.category, keyword) * 0.7)
                matchReason = matchReason || 'category'
            }
            
            if (isMatch) {
                matches.push({ ...plugin, score: matchScore, matchReason })
            }
        }
        
        matches.sort((a, b) => b.score - a.score)
        
        if (matches.length === 0) {
            m.react('❌')
            return m.reply(`🔍 *ʜᴀsɪʟ ᴘᴇɴᴄᴀʀɪᴀɴ*\n\n> Not found feature with keyword \`${keyword}\``)
        }
        
        const saluranId = config.saluran?.id || '120363406397452589@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Frenzy-AI'
        
        let text = `🔍 *ʜᴀsɪʟ ᴘᴇɴᴄᴀʀɪᴀɴ: "${keyword}"*\n`
        text += `> Intemukan *${matches.length}* feature\n`
        text += `> Choose the correct command below:\n\n`
        
        const topMatches = matches.slice(0, 15)
        
        for (let i = 0; i < Math.min(5, topMatches.length); i++) {
            const p = topMatches[i]
            const badges = []
            if (p.isPremium) badges.push('💎')
            if (p.isOwner) badges.push('👑')
            
            text += `*${i + 1}. ${m.prefix}${p.name}* ${badges.join('')}\n`
            text += `📁 Category: \`${p.category}\`\n`
            text += `📝 ${p.description.slice(0, 50)}${p.description.length > 50 ? '...' : ''}\n`
            if (p.usage) text += `💡 Usage: \`${p.usage}\`\n`
            if (p.cooldown > 0) text += `⏱️ Cooldown: ${p.cooldown}s\n`
            text += `\n`
        }
        
        if (topMatches.length > 5) {
            text += `_+${topMatches.length - 5} hasil elsenya terseina_`
        }
        
        const buttons = topMatches.slice(0, 10).map((p, i) => ({
            title: `${m.prefix}${p.name}`,
            description: `${p.category} • ${p.description.slice(0, 40)}`,
            id: `${m.prefix}${p.name}`
        }))
        
        m.react('✅')
        
        await sock.sendButton(m.chat, fs.readFileSync('./assets/images/frenzy.jpg'), text, m, {
            buttons: [{
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                    title: '📋 Choose Command',
                    sections: [{
                        title: `Hasil for "${keyword}"`,
                        rows: buttons
                    }]
                })
            }]
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
