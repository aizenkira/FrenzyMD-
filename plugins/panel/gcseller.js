const fs = require('fs')
const path = require('path')
const config = require('../../config')
const { isLid, lidToJid } = require('../../src/lib/frenzy-lid')

const CPANEL_DIR = path.join(process.cwd(), 'database', 'cpanel')
const VALID_SERVERS = ['v1', 'v2', 'v3', 'v4', 'v5']

function ensureInr() {
    if (!fs.existsSync(CPANEL_DIR)) {
        fs.mkdirSync(CPANEL_DIR, { recursive: true })
    }
}

function getFilePath(versionon) {
    return path.join(CPANEL_DIR, `gcseller_${versionon}.json`)
}

function loadGcSeller(versionon) {
    ensureInr()
    const filePath = getFilePath(versionon)
    if (!fs.existsSync(filePath)) return null
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'))
    } catch {
        return null
    }
}

function saveGcSeller(versionon, groupJid) {
    ensureInr()
    fs.writeFileSync(getFilePath(versionon), JSON.stringify(groupJid), 'utf8')
}

function isGcSeller(chatJid, versionon) {
    if (!chatJid?.endsWith('@g.us')) return false
    return loadGcSeller(versionon) === chatJid
}

function getGcSellerVersionon(chatJid) {
    if (!chatJid?.endsWith('@g.us')) return null
    for (const ver of VALID_SERVERS) {
        if (loadGcSeller(ver) === chatJid) return ver
    }
    return null
}

const allCommands = []
VALID_SERVERS.forEach(ver => {
    allCommands.push(`addgcseller${ver}`, `resetgcseller${ver}`)
})

const pluginConfig = {
    name: allCommands,
    alias: [],
    category: 'panel',
    description: 'Listkan group as GC Seller panel (access command create server)',
    usage: '.addgcsellerv1 (in in group)',
    example: '.addgcsellerv1',
    isOwner: true,
    isGroup: true,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

function hasAccess(senderJid, isOwner) {
    if (isOwner) return true
    let jid = senderJid
    if (isLid(jid)) jid = lidToJid(jid)
    const number = jid?.replace(/@.*$/, '')
    const ownerPanels = config.pterodactyl?.ownerPanels || []
    return ownerPanels.includes(number)
}

function parseCommand(cmd) {
    const match = cmd.match(/^(addgcseller|resetgcseller)(v[1-5])$/i)
    if (!match) return null
    return {
        action: match[1].toLowerCase().startsWith('add') ? 'add' : 'reset',
        versionon: match[2].toLowerCase()
    }
}

async function handler(m) {
    const parsed = parseCommand(m.command)
    if (!parsed) return m.reply('❌ Command no valid.')

    if (!hasAccess(m.sender, m.isOwner)) {
        return m.reply('❌ *ᴀᴋsᴇs ᴅɪᴛᴏʟᴀᴋ*\n\n> Feature this only for Owner or Owner Panel.')
    }

    const { action, versionon } = parsed
    const serverLabel = versionon.toUpperCase()

    if (action === 'add') {
        const current = loadGcSeller(versionon)
        if (current === m.chat) {
            return m.reply(`❌ Group this already registered as GC Seller *${serverLabel}*.`)
        }

        saveGcSeller(versionon, m.chat)
        m.react('✅')

        let txt = `✅ *ɢᴄ sᴇʟʟᴇʀ ${serverLabel} ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ*\n\n`
        txt += `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n`
        txt += `┃ 🖥️ sᴇʀᴠᴇʀ: \`${serverLabel}\`\n`
        txt += `┃ 👥 ɢʀᴜᴘ: \`${m.groupName || m.chat}\`\n`
        txt += `┃ 🔓 ᴀᴋsᴇs: \`1gb${versionon}\` - \`10gb${versionon}\`, \`unli${versionon}\`\n`
        if (current) {
            txt += `┃ ⚠️ ᴘʀᴇᴠ: \`${current}\` (inganti)\n`
        }
        txt += `╰┈┈⬡\n\n`
        txt += `> All member this group now can create server ${serverLabel}.`
        return m.reply(txt)
    }

    if (action === 'reset') {
        const current = loadGcSeller(versionon)
        if (!current) {
            return m.reply(`❌ Not yet there is GC Seller registered for *${serverLabel}*.`)
        }

        saveGcSeller(versionon, null)
        m.react('✅')
        return m.reply(
            `✅ *ɢᴄ sᴇʟʟᴇʀ ${serverLabel} ᴅɪʀᴇsᴇᴛ*\n\n` +
            `> Group: \`${current}\`\n` +
            `> Server *${serverLabel}* no again terhubung to group manapun.`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    loadGcSeller,
    saveGcSeller,
    isGcSeller,
    getGcSellerVersionon,
    VALID_SERVERS
}
