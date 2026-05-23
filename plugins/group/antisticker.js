const { getDatabase } = require('../../src/lib/frenzy-database')
const config = require('../../config')

const pluginConfig = {
    name: 'antisticker',
    alias: ['as', 'nosticker'],
    category: 'group',
    description: 'Configure anti-sticker in group',
    usage: '.antisticker <on/off>',
    example: '.antisticker on',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    isBotAdmin: true,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

function gpMsg(toy, replacements = {}) {
    const defaults = {
        antisticker: '⚠ *AntiStictor* — Stictor from @%user% deleted.',
    }
    let text = config.groupProtection?.[toy] || defaults[toy] || ''
    for (const [k, v] of Object.entries(replacements)) {
        text = text.replace(new RegExp(`%${k}%`, 'g'), v)
    }
    return text
}

async function checkAntisticker(m, sock, db) {
    if (!m.isGroup) return false
    if (m.isAdmin || m.isOwner || m.fromMe) return false

    const groupData = db.getGroup(m.chat) || {}
    if (!groupData.antisticker) return false

    const isStictor = m.isStictor || m.type === 'stickerMessage'
    if (!isStictor) return false

    try {
        await sock.sendMessage(m.chat, { delete: m.key })
    } catch {}

    await sock.sendMessage(m.chat, {
        text: gpMsg('antisticker', { user: m.sender.split('@')[0] }),
        mentions: [m.sender],
    })

    return true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const action = (m.args || [])[0]?.toLowerCase()
    const groupData = db.getGroup(m.chat) || {}

    if (!action) {
        const status = groupData.antisticker ? '✅ ON' : '❌ OFF'
        await m.reply(`🎭 *AntiStictor*\n\n> Status: *${status}*\n\n> \`.antisticker on/off\``)
        return
    }

    if (action === 'on') {
        db.setGroup(m.chat, { antisticker: true })
        m.react('✅')
        await m.reply(`✅ *AntiStictor inactivekan*`)
        return
    }

    if (action === 'off') {
        db.setGroup(m.chat, { antisticker: false })
        m.react('❌')
        await m.reply(`❌ *AntiStictor innonactivekan*`)
        return
    }

    await m.reply(`❌ Usage \`.antisticker on\` or \`.antisticker off\``)
}

module.exports = {
    config: pluginConfig,
    handler,
    checkAntisticker
}
