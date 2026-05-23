const axios = require('axios')
const config = require('../../config')
const { hasFullAccess, getUserRole, VALID_SERVERS } = require('../../src/lib/frenzy-roles-cpanel')
const te = require('../../src/lib/frenzy-error')

const allCommands = VALID_SERVERS.map(v => `listadmin${v}`)
const allAliases = VALID_SERVERS.map(v => `admins${v}`)

const pluginConfig = {
    name: allCommands,
    alias: allAliases,
    category: 'panel',
    description: 'List all admin panel (v1-v5)',
    usage: '.listadminv1 or .listadminv2',
    example: '.listadminv1',
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

function validateConfig(serverConfig) {
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
    const missingConfig = validateConfig(serverConfig)
    
    if (missingConfig.length > 0) {
        const available = getAvailableServers(pteroConfig)
        let txt = `⚠️ *sᴇʀᴠᴇʀ ${serverLabel} ʙᴇʟᴜᴍ ᴋᴏɴꜰɪɢ*\n\n`
        if (available.length > 0) {
            txt += `> Server terseina: *${available.join(', ')}*`
        } else {
            txt += `> Isi in \`config.js\` bagian \`pterodactyl.server1\``
        }
        return m.reply(txt)
    }
    
    try {
        const res = await axios.get(`${serverConfig.domain}/api/application/users`, {
            headers: {
                'Authorization': `Bearer ${serverConfig.apikey}`,
                'Content-Type': 'application/json',
                'Accept': 'Application/vnd.pterodactyl.v1+json'
            }
        })
        
        const users = res.data.data || []
        const admins = users.filter(u => u.attributes.root_admin)
        
        if (admins.length === 0) {
            return m.reply(`📋 *ᴅᴀꜰᴛᴀʀ ᴀᴅᴍɪɴ [${serverLabel}]*\n\n> No there is admin registered.`)
        }
        
        let txt = `📋 *ᴅᴀꜰᴛᴀʀ ᴀᴅᴍɪɴ [${serverLabel}]*\n\n`
        txt += `> Total: *${admins.length}* admin\n\n`
        
        admins.forEach((u, i) => {
            const attr = u.attributes
            txt += `${i + 1}. *${attr.username}*\n`
            txt += `   └ ID: \`${attr.id}\` | Email: \`${attr.email}\`\n`
        })
        
        return m.reply(txt)
        
    } catch (err) {
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
