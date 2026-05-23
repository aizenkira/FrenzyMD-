const axios = require('axios')
const config = require('../../config')
const { isLid, lidToJid } = require('../../src/lib/frenzy-lid')
const { hasFullAccess, getUserRole, VALID_SERVERS } = require('../../src/lib/frenzy-roles-cpanel')
const te = require('../../src/lib/frenzy-error')

const allCommands = VALID_SERVERS.map(v => `listserver${v}`)
const allAliases = VALID_SERVERS.map(v => `servers${v}`)

const pluginConfig = {
    name: allCommands,
    alias: allAliases,
    category: 'panel',
    description: 'List all server in panel (v1-v5)',
    usage: '.listserverv1 or .listserverv2',
    example: '.listserverv1',
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

function formatBytes(bytes) {
    if (bytes === 0) return 'Unlimited'
    const mb = bytes
    if (mb >= 1000) return `${(mb / 1000).toFixed(1)} GB`
    return `${mb} MB`
}

async function fetchAllServers(serverConfig) {
    let allServers = []
    let page = 1
    let totalPages = 1
    
    while (page <= totalPages) {
        const res = await axios.get(`${serverConfig.domain}/api/application/servers?page=${page}&per_page=50`, {
            headers: {
                'Authorization': `Bearer ${serverConfig.apikey}`,
                'Content-Type': 'application/json',
                'Accept': 'Application/vnd.pterodactyl.v1+json'
            }
        })
        
        const servers = res.data.data || []
        allServers = allServers.concat(servers)
        
        const meta = res.data.meta?.pagination
        if (meta) {
            totalPages = meta.total_pages || 1
        }
        page++
    }
    
    return allServers
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
            txt += `> Example: \`${m.prefix}listserver${available[0]}\``
        } else {
            txt += `> Isi config pterodactyl in \`config.js\``
        }
        return m.reply(txt)
    }
    
    try {
        await m.reply(`🕕 Fetch list server from *${serverLabel}*...`)
        
        const servers = await fetchAllServers(serverConfig)
        
        if (servers.length === 0) {
            return m.reply(`📋 *ᴅᴀꜰᴛᴀʀ sᴇʀᴠᴇʀ [${serverLabel}]*\n\n> No there is server registered.`)
        }
        
        let txt = `📋 *ᴅᴀꜰᴛᴀʀ sᴇʀᴠᴇʀ [${serverLabel}]*\n\n`
        txt += `> Total: *${servers.length}* server\n\n`
        
        servers.slice(0, 20).forEach((s, i) => {
            const attr = s.attributes
            const limits = attr.limits || {}
            txt += `${i + 1}. *${attr.name}*\n`
            txt += `   ├ ID: \`${attr.id}\`\n`
            txt += `   ├ RAM: \`${formatBytes(limits.memory)}\`\n`
            txt += `   └ CPU: \`${limits.cpu === 0 ? 'Unlimited' : limits.cpu + '%'}\`\n`
        })
        
        if (servers.length > 20) {
            txt += `\n> ... and ${servers.length - 20} server elsenya`
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
