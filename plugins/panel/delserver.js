const axios = require('axios')
const config = require('../../config')
const { hasFullAccess, getUserRole, VALID_SERVERS } = require('../../src/lib/frenzy-roles-cpanel')
const te = require('../../src/lib/frenzy-error')

const allCommands = VALID_SERVERS.map(v => `delserver${v}`)
const allAliases = VALID_SERVERS.map(v => `deleteserver${v}`)

const pluginConfig = {
    name: allCommands,
    alias: allAliases,
    category: 'panel',
    description: 'Delete server from panel (v1-v5)',
    usage: '.delserverv1 serverid',
    example: '.delserverv2 5',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
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
    
    const serverId = m.text?.trim()
    
    const serverConfig = getServerConfig(pteroConfig, serverToy)
    const missingConfig = validateConfig(serverConfig)
    
    if (missingConfig.length > 0) {
        const available = getAvailableServers(pteroConfig)
        let txt = `⚠️ *sᴇʀᴠᴇʀ ${serverLabel} ʙᴇʟᴜᴍ ᴋᴏɴꜰɪɢ*\n\n`
        if (available.length > 0) {
            txt += `> Server terseina: *${available.join(', ')}*\n`
            txt += `> Example: \`${m.prefix}delserver${available[0]} serverid\``
        } else {
            txt += `> Isi config pterodactyl in \`config.js\``
        }
        return m.reply(txt)
    }
    
    if (!serverId || isNaN(serverId)) {
        const available = getAvailableServers(pteroConfig)
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}${m.command} serverid\`\n\n` +
            `> Server terseina: *${available.join(', ') || 'none'}*\n` +
            `> View ID with \`${m.prefix}listserver${serverVersionon}\``
        )
    }
    
    try {
        const serverRes = await axios.get(`${serverConfig.domain}/api/application/servers/${serverId}`, {
            headers: {
                'Authorization': `Bearer ${serverConfig.apikey}`,
                'Content-Type': 'application/json',
                'Accept': 'Application/vnd.pterodactyl.v1+json'
            }
        })
        
        const server = serverRes.data.attributes
        
        await axios.delete(`${serverConfig.domain}/api/application/servers/${serverId}`, {
            headers: {
                'Authorization': `Bearer ${serverConfig.apikey}`,
                'Content-Type': 'application/json',
                'Accept': 'Application/vnd.pterodactyl.v1+json'
            }
        })
        
        return m.reply(
            `✅ *sᴇʀᴠᴇʀ ᴅɪʜᴀᴘᴜs*\n\n` +
            `> Panel: *${serverLabel}*\n` +
            `> Server ID: \`${serverId}\`\n` +
            `> Name: \`${server.name}\``
        )
        
    } catch (err) {
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
