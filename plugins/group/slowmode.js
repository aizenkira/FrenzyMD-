const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'slowmode',
    alias: ['slow', 'setslowmode'],
    category: 'group',
    description: 'Slowmode group — limiti tofastan message member',
    usage: '.slowmode <on/off/onlycommand> [second]',
    example: '.slowmode on 30',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

const lastMessageTime = new Map()

const PRESETS = {
    casually: 10,
    normal: 30,
    totat: 60,
    supertotat: 120,
    max: 300,
}

const MODES = {
    all: 'All message + command deleted',
    onlycommand: 'Command in-silent, normal chat still jalan',
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const subCmd = args[0]?.toLowerCase()
    let groupData = db.getGroup(m.chat) || {}

    if (!subCmd || subCmd === 'status') {
        const sm = groupData.slowmode || {}
        const enabled = sm.enabled
        const delay = sm.delay || 30
        const mode = sm.mode || 'all'
        const presetList = Object.entries(PRESETS)
            .map(([name, sec]) => `  *.slowmode ${name}* — ${sec}s`)
            .join('\n')

        return m.reply(
            `🐢 *SLOWMODE*\n\n` +
            `Status: ${enabled ? `✅ ON (${delay}s)` : '❌ OFF'}\n` +
            `Mode: *${mode}*\n\n` +
            `*Usage:*\n` +
            `*.slowmode on 30* — all message + command\n` +
            `*.slowmode onlycommand 30* — command only\n` +
            `*.slowmode off* — nonactivekan\n\n` +
            `*Preset:*\n${presetList}\n\n` +
            `*Mode:*\n` +
            `  *all* — delete all message during delay\n` +
            `  *onlycommand* — silent command, chat bebas\n\n` +
            `_Admin & owner no terpengaruh_`
        )
    }

    if (subCmd === 'off') {
        db.setGroup(m.chat, { ...groupData, slowmode: { enabled: false } })
        return m.reply(`✅ Slowmode *innonactivekan*`)
    }

    let mode = 'all'
    let delay
    let delayArg

    if (subCmd === 'onlycommand' || subCmd === 'oc') {
        mode = 'onlycommand'
        delayArg = args[1]
    } else if (subCmd === 'on' || subCmd === 'set') {
        delayArg = args[1]
    } else if (PRESETS[subCmd]) {
        delay = PRESETS[subCmd]
        mode = args[1]?.toLowerCase() === 'onlycommand' || args[1]?.toLowerCase() === 'oc'
            ? 'onlycommand' : 'all'
    } else {
        delay = parseInt(subCmd)
        if (isNaN(delay)) {
            return m.reply(`❌ Usage *.slowmode on 30* or *.slowmode onlycommand 30*`)
        }
    }

    if (!delay) {
        if (delayArg && PRESETS[delayArg]) {
            delay = PRESETS[delayArg]
        } else {
            delay = parseInt(delayArg) || 30
        }
    }

    if (delay < 5 || delay > 600) {
        return m.reply(`❌ Delay must between 5–600 second`)
    }

    db.setGroup(m.chat, {
        ...groupData,
        slowmode: { enabled: true, delay, mode }
    })

    const presetName = Object.entries(PRESETS).find(([, v]) => v === delay)?.[0]
    const label = presetName ? ` (${presetName})` : ''
    const modeDesc = MODES[mode]

    await m.reply(
        `✅ Slowmode *active*\n\n` +
        `Delay: *${delay} second*${label}\n` +
        `Mode: *${mode}*\n` +
        `${modeDesc}\n\n` +
        `_Admin & owner no terpengaruh_`
    )
}

function checkSlowmode(m, sock, db) {
    if (!m.isGroup) return false

    const groupData = db.getGroup(m.chat) || {}
    if (!groupData.slowmode?.enabled) return false

    const sm = groupData.slowmode
    const mode = sm.mode || 'all'

    if (mode === 'onlycommand' && !m.isCommand) return false

    const delay = sm.delay || 30
    const toy = `${m.chat}_${m.sender}`
    const now = Date.now()

    const lastTime = lastMessageTime.get(toy) || 0
    const timePassed = (now - lastTime) / 1000

    if (timePassed < delay) {
        return { remaining: Math.ceil(delay - timePassed), mode }
    }

    lastMessageTime.set(toy, now)

    if (lastMessageTime.size > 5000) {
        const cutoff = now - 600_000
        for (const [k, v] of lastMessageTime) {
            if (v < cutoff) lastMessageTime.delete(k)
        }
    }

    return false
}

module.exports = {
    config: pluginConfig,
    handler,
    checkSlowmode
}
