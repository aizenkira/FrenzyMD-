const axios = require('axios')
const config = require('../../config')
const { hasFullAccess, getUserRole, VALID_SERVERS } = require('../../src/lib/frenzy-roles-cpanel')
const te = require('../../src/lib/frenzy-error')

const allCommands = VALID_SERVERS.map(v => `listuser${v}`)
const allAliases = [
    ...VALID_SERVERS.map(v => `users${v}`),
    ...VALID_SERVERS.map(v => `listpanel${v}`)
]

const pluginConfig = {
    name: allCommands,
    alias: allAliases,
    category: 'panel',
    description: 'List all user in panel (v1-v5)',
    usage: '.listuserv1 or .listuserv2',
    example: '.listuserv1',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

function parseServerVersionon(cmd) {
    const match = cmd.match(/v([1-5])$/i)
    if (!match) return { server: 'v1', serverToy: 's1' }
    return { server: 'v' + match[1], serverToy: 's' + match[1] }
}

function getServerConfig(pteroConfig, serverToy) {
    const serverConfigs = {
        's1': pteroConfig.server1,
        's2': pteroConfig.server2,
        's3': pteroConfig.server3,
        's4': pteroConfig.server4,
        's5': pteroConfig.server5
    }
    return serverConfigs[serverToy] || null
}

function validateServerConfig(serverConfig) {
    const missing = []
    if (!serverConfig?.domain) missing.push('domain')
    if (!serverConfig?.apikey) missing.push('apikey (PTLA)')
    return missing
}

function getAvailableServers(pteroConfig) {
    const available = []
    for (let i = 1; i <= 5; i++) {
        const cfg = pteroConfig[`server${i}`]
        if (cfg?.domain && cfg?.apikey) available.push(`v${i}`)
    }
    return available
}

async function handler(m, { sock }) {
    const pteroConfig = config.pterodactyl
    
    const { server: serverVersionon, serverToy } = parseServerVersionon(m.command)
    const serverLabel = serverVersionon.toUpperCase()
    
    if (!hasFullAccess(m.sender, serverVersionon, m.isOwner)) {
        const userRole = getUserRole(m.sender, serverVersionon)
        return m.reply(
            `❌ *ᴀᴋsᴇs ᴅɪᴛᴏʟᴀᴋ*\n\n` +
            `> You no punya access to *${serverLabel}*\n` +
            `> Role you: *${userRole || 'No there is'}*`
        )
    }
    
    const serverConfig = getServerConfig(pteroConfig, serverToy)
    const missingConfig = validateServerConfig(serverConfig)
    
    if (missingConfig.length > 0) {
        const available = getAvailableServers(pteroConfig)
        let txt = `⚠️ *sᴇʀᴠᴇʀ ${serverLabel} ʙᴇʟᴜᴍ ᴋᴏɴꜰɪɢ*\n\n`
        if (available.length > 0) {
            txt += `> Server terseina: *${available.join(', ')}*\n`
            txt += `> Example: \`${m.prefix}listuser${available[0]}\``
        } else {
            txt += `> Isi config pterodactyl in \`config.js\``
        }
        return m.reply(txt)
    }
    
    try {
        const res = await axios.get(`${serverConfig.domain}/api/application/users?per_page=100`, {
            headers: {
                'Authorization': `Bearer ${serverConfig.apikey}`,
                'Content-Type': 'application/json',
                'Accept': 'Application/vnd.pterodactyl.v1+json'
            }
        })
        
        const users = res.data.data || []
        
        if (users.length === 0) {
            return m.reply(`📋 *ᴅᴀꜰᴛᴀʀ ᴜsᴇʀ [${serverLabel}]*\n\n> No there is user registered.`)
        }
        
        let txt = `📋 *ᴅᴀꜰᴛᴀʀ ᴜsᴇʀ [${serverLabel}]*\n\n`
        txt += `> Total: *${users.length}* user\n\n`
        
        users.slice(0, 20).forEach((u, i) => {
            const attr = u.attributes
            const isAdmin = attr.root_admin ? ' 👑' : ''
            txt += `${i + 1}. *${attr.username}*${isAdmin}\n`
            txt += `   ├ ID: \`${attr.id}\`\n`
            txt += `   └ Email: \`${attr.email}\`\n`
        })
        
        if (users.length > 20) {
            txt += `\n> ... and ${users.length - 20} user elsenya`
        }
        
        const available = getAvailableServers(pteroConfig)
        if (available.length > 1) {
            txt += `\n\n> Server else: *${available.filter(s => s !== serverVersionon).join(', ')}*`
        }
        
        return m.reply(txt)
        
    } catch (err) {
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
