const te = require('../../src/lib/frenzy-error')
const pluginConfig = {
    name: [
        'bego', 'goblok', 'jyou', 'perawan', 'babi', 'tolol', 'pekok', 
        'jancok', 'pinter', 'pilater', 'asu', 'bodoh', 'gay', 'lesby',
        'bajingan', 'anjing', 'anjg', 'anjj', 'anj', 'ngentod', 'ngentot',
        'monyet', 'mastah', 'newbie', 'bangsat', 'bangto', 'sange', 'sangean',
        'dakjal', 'horny', 'wibu', 'puki', 'puqi', 'peak', 'pantex', 'pantek',
        'setan', 'iblis', 'cacat', 'yatim', 'piatu', 'handsome', 'gorgeous',
        'ugly', 'cool', 'nerdy', 'noob', 'pro', 'wealthy', 'broke', 'rich', 'who'
    ],
    alias: [],
    category: 'fun',
    description: 'Random choose member for category specific',
    usage: '.<category>',
    example: '.handsome',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const command = m.command?.toLowerCase()
    m.react('🕕')
    try {
        const groupMeta = m.groupMetadata
        const participants = groupMeta.participants || []
        const members = participants
            .map(p => p.jid)
            .filter(id => id && id !== sock.user?.id?.split(':')[0] + '@s.whatsapp.net')
        if (members.length === 0) {
            return m.reply(`❌ No there is member in group!`)
        }
        const randomMember = members[Math.floor(Math.random() * members.length)]
        const positiveWords = ['handsome', 'gorgeous', 'cool', 'pro', 'wealthy', 'rich', 'pinter', 'pilater', 'mastah']
        const isPositive = positiveWords.includes(command)
        const emoji = isPositive ? '✨' : '😏'
        const label = isPositive ? 'Yesng most' : 'Anak'
        await m.reply(`*${label} ${command} in sthis is the* @${randomMember.split('@')[0]}`, { mentions: [randomMember] })
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
