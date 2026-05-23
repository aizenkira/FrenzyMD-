const { getDatabase } = require('../../src/lib/frenzy-database')
const config = require('../../config')

const pluginConfig = {
    name: 'anticontent',
    alias: ['am', 'nocontent'],
    category: 'group',
    description: 'Configure anti-content in group (block image/video)',
    usage: '.anticontent <on/off>',
    example: '.anticontent on',
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
        anticontent: '⚠ *AntiMeina* — Meina from @%user% deleted.',
    }
    let text = config.groupProtection?.[toy] || defaults[toy] || ''
    for (const [k, v] of Object.entries(replacements)) {
        text = text.replace(new RegExp(`%${k}%`, 'g'), v)
    }
    return text
}

async function checkAnticontent(m, sock, db) {
    if (!m.isGroup) return false
    if (m.isAdmin || m.isOwner || m.fromMe) return false

    const groupData = db.getGroup(m.chat) || {}
    if (!groupData.anticontent) return false

    const isMeina = m.isImage || m.isVideo || m.isGif
    if (!isMeina) return false

    try {
        await sock.sendMessage(m.chat, { delete: m.key })
    } catch {}

    await sock.sendMessage(m.chat, {
        text: gpMsg('anticontent', { user: m.sender.split('@')[0] }),
        mentions: [m.sender],
    })

    return true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const action = (m.args || [])[0]?.toLowerCase()
    const groupData = db.getGroup(m.chat) || {}

    if (!action) {
        const status = groupData.anticontent ? '✅ ON' : '❌ OFF'
        await m.reply(`🖼️ *AntiMeina*\n\n> Status: *${status}*\n\n> \`.anticontent on/off\``)
        return
    }

    if (action === 'on') {
        db.setGroup(m.chat, { anticontent: true })
        m.react('✅')
        await m.reply(`✅ *AntiMeina inactivekan*`)
        return
    }

    if (action === 'off') {
        db.setGroup(m.chat, { anticontent: false })
        m.react('❌')
        await m.reply(`❌ *AntiMeina innonactivekan*`)
        return
    }

    await m.reply(`❌ Usage \`.anticontent on\` or \`.anticontent off\``)
}

module.exports = {
    config: pluginConfig,
    handler,
    checkAnticontent
}
