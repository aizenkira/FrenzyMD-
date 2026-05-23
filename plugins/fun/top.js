const te = require('../../src/lib/frenzy-error')
const pluginConfig = {
    name: 'top',
    alias: ['top5', 'toplist'],
    category: 'fun',
    description: 'Random top 5 member for category specific',
    usage: '.top <category>',
    example: '.top person pilater',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const category = m.args.join(' ')?.trim()
    
    if (!category) {
        return m.reply(
            `\`Example: ${m.prefix}top person pilater\``
        )
    }
    
    m.react('🕕')
    
    try {
        const groupMeta = m.groupMetadata
        const participants = groupMeta.participants || []
        
        const members = participants
            .map(p => p.jid)
            .filter(id => id && id !== sock.user?.id?.split(':')[0] + '@s.whatsapp.net')
        
        if (members.length < 2) {
            return m.reply(`❌ Member group reduce from 5 person!`)
        }
        
        const shuffled = members.sort(() => Math.random() - 0.5)
        const top5 = shuffled.slice(0, 5)
        
        const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣']
        let list = ''
        
        top5.forEach((jid, index) => {
            list += `*${index + 1}* ${medals[index]} @${jid.split('@')[0]}\n`
        })
        
        await m.reply(`🏆 *ᴛᴏᴘ 5 ${category.toUpperCase()}*\n${list}`, { mentions: top5 })
        m.react('✅')
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
