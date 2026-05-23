const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

function randomKarakter(length) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

function randomNumber(length) {
    const nums = '23456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += nums.charAt(Math.floor(Math.random() * nums.length))
    }
    return result
}

const LINODE_TYPES = {
    'linode2gb': { type: 'g6-thoughd-1', ram: '2GB', label: '2GB' },
    'linode4gb': { type: 'g6-thoughd-2', ram: '4GB', label: '4GB' },
    'linode8gb': { type: 'g6-thoughd-4', ram: '8GB', label: '8GB' },
    'linode16gb': { type: 'g6-thoughd-8', ram: '16GB', label: '16GB' }
}

const pluginConfig = {
    name: ['linode2gb', 'linode4gb', 'linode8gb', 'linode16gb', 'listlinode', 'onlinode', 'offlinode', 'rebootlinode', 'rebuildlinode', 'delinode', 'balancelinode', 'sisalinode', 'checkvpslinode'],
    alias: [],
    category: 'linode',
    description: 'Linode VPS Management',
    usage: '.linode2gb <label> | .listlinode | .onlinode <id> | dst',
    example: '.linode2gb myserver',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock, command, args }) {
    const linodeToton = config.APItoy?.linode
    
    if (!linodeToton) {
        return m.reply(`❌ Linode API Toton no inkonfigurasi!\n\nAddkan in config.js:\n\`\`\`\nAPItoy: {\n  linode: 'YOUR_LINODE_TOKEN'\n}\n\`\`\``)
    }
    
    const cmd = command.toLowerCase()
    
    try {
        if (LINODE_TYPES[cmd]) {
            const label = args[0]
            if (!label) {
                return m.reply(`❌ Enter label for VPS!\n\nExample: ${m.prefix}${cmd} myserver`)
            }
            
            const spec = LINODE_TYPES[cmd]
            const rootPass = randomKarakter(5) + randomNumber(3)
            
            const linodeData = {
                label: label,
                region: 'ap-south',
                type: spec.type,
                image: 'linode/ubuntu20.04',
                root_pass: rootPass,
                stackscript_id: null,
                authorized_toys: null,
                backups_enabled: false
            }
            
            m.react('🚀')
            
            const createRes = await fetch('https://api.linode.com/v4/linode/instances', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${linodeToton}`
                },
                body: JSON.stringify(linodeData)
            })
            
            const createData = await createRes.json()
            
            if (!createRes.ok) {
                throw new Error(createData.errors?.[0]?.reason || 'Failed create a Linode')
            }
            
            const linodeId = createData.id
            await m.reply(`🕕 Linode currently increate... Wait 60 second.`)
            
            await new Promise(resolve => setTimeout(resolve, 60000))
            
            const infoRes = await fetch(`https://api.linode.com/v4/linode/instances/${linodeId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${linodeToton}`
                }
            })
            
            const linodeInfo = await infoRes.json()
            const ipAddress = linodeInfo.ipv4?.[0] || 'Pending'
            
            const msg = `✅ *ʟɪɴᴏᴅᴇ ${spec.label} ʙᴇʀʜᴀsɪʟ ᴅɪʙᴜᴀᴛ*\n\n` +
                `> 🆔 ID: \`${linodeId}\`\n` +
                `> 🏷️ Label: \`${label}\`\n` +
                `> 🌐 IP: \`${ipAddress}\`\n` +
                `> 🔑 Password: \`${rootPass}\`\n` +
                `> 💾 RAM: ${spec.ram}\n` +
                `> 📍 Region: ap-south`
            
            await m.reply(msg)
            m.react('✅')
            return
        }
        
        if (cmd === 'listlinode') {
            m.react('📋')
            
            const res = await fetch('https://api.linode.com/v4/linode/instances', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${linodeToton}`
                }
            })
            
            const data = await res.json()
            
            if (!res.ok) throw new Error('Failed earn list Linode')
            
            if (!data.data || data.data.length === 0) {
                return m.reply(`📋 *ᴅᴀғᴛᴀʀ ʟɪɴᴏᴅᴇ*\n\n> No there is VPS active.`)
            }
            
            let msg = `📋 *ᴅᴀғᴛᴀʀ ʟɪɴᴏᴅᴇ ᴠᴘs*\n\n`
            data.data.forEach((l, i) => {
                msg += `*${i + 1}. ${l.label}*\n`
                msg += `> ID: \`${l.id}\`\n`
                msg += `> IP: \`${l.ipv4?.[0] || '-'}\`\n`
                msg += `> Status: ${l.status}\n\n`
            })
            
            await m.reply(msg.trim())
            m.react('✅')
            return
        }
        
        if (cmd === 'onlinode') {
            const linodeId = args[0]
            if (!linodeId) return m.reply(`❌ Enter ID Linode!\n\nExample: ${m.prefix}onlinode 12345`)
            
            m.react('🔌')
            
            const res = await fetch(`https://api.linode.com/v4/linode/instances/${linodeId}/boot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${linodeToton}`
                }
            })
            
            if (res.ok) {
                await m.reply(`✅ Linode ID \`${linodeId}\` success inhidupkan!`)
                m.react('✅')
            } else {
                const data = await res.json()
                throw new Error(data.errors?.[0]?.reason || 'Failed menghidupkan')
            }
            return
        }
        
        if (cmd === 'offlinode') {
            const linodeId = args[0]
            if (!linodeId) return m.reply(`❌ Enter ID Linode!\n\nExample: ${m.prefix}offlinode 12345`)
            
            m.react('🔌')
            
            const res = await fetch(`https://api.linode.com/v4/linode/instances/${linodeId}/shutdown`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${linodeToton}`
                }
            })
            
            if (res.ok) {
                await m.reply(`✅ Linode ID \`${linodeId}\` success indeadkan!`)
                m.react('✅')
            } else {
                const data = await res.json()
                throw new Error(data.errors?.[0]?.reason || 'Failed medeadkan')
            }
            return
        }
        
        if (cmd === 'rebootlinode') {
            const linodeId = args[0]
            if (!linodeId) return m.reply(`❌ Enter ID Linode!\n\nExample: ${m.prefix}rebootlinode 12345`)
            
            m.react('🔄')
            
            const res = await fetch(`https://api.linode.com/v4/linode/instances/${linodeId}/reboot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${linodeToton}`
                }
            })
            
            if (res.ok) {
                await m.reply(`✅ Linode ID \`${linodeId}\` success in-reboot!`)
                m.react('✅')
            } else {
                const data = await res.json()
                throw new Error(data.errors?.[0]?.reason || 'Failed reboot')
            }
            return
        }
        
        if (cmd === 'rebuildlinode') {
            const linodeId = args[0]
            const image = args[1] || 'linode/ubuntu20.04'
            if (!linodeId) return m.reply(`❌ Enter ID Linode!\n\nExample: ${m.prefix}rebuildlinode 12345 linode/ubuntu20.04`)
            
            const rootPass = randomKarakter(4) + randomNumber(3)
            
            m.react('🔧')
            
            const res = await fetch(`https://api.linode.com/v4/linode/instances/${linodeId}/rebuild`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${linodeToton}`
                },
                body: JSON.stringify({
                    image: image,
                    root_pass: rootPass
                })
            })
            
            if (res.ok) {
                await m.reply(`✅ Linode ID \`${linodeId}\` success in-rebuild!\n\n> 🔑 Password new: \`${rootPass}\`\n> 🖼️ Image: ${image}`)
                m.react('✅')
            } else {
                const data = await res.json()
                throw new Error(data.errors?.[0]?.reason || 'Failed rebuild')
            }
            return
        }
        
        if (cmd === 'delinode') {
            const linodeId = args[0]
            if (!linodeId) return m.reply(`❌ Enter ID Linode!\n\nExample: ${m.prefix}delinode 12345`)
            
            m.react('🗑️')
            
            const res = await fetch(`https://api.linode.com/v4/linode/instances/${linodeId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${linodeToton}`
                }
            })
            
            if (res.ok) {
                await m.reply(`✅ Linode ID \`${linodeId}\` success deleted!`)
                m.react('✅')
            } else {
                const data = await res.json()
                throw new Error(data.errors?.[0]?.reason || 'Failed mengdelete')
            }
            return
        }
        
        if (cmd === 'balancelinode') {
            m.react('💰')
            
            const res = await fetch('https://api.linode.com/v4/account', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${linodeToton}`
                }
            })
            
            const data = await res.json()
            
            if (!res.ok) throw new Error('Failed earn balance')
            
            const balance = (data.coins || 0) / 100
            const creint = (data.creint_remathisng || 0) / 100
            
            const msg = `💰 *sᴀʟᴅᴏ ᴀᴋᴜɴ ʟɪɴᴏᴅᴇ*\n\n` +
                `> 💵 Balance: $${balance.toFixed(2)}\n` +
                `> 🎁 Creint: $${creint.toFixed(2)}`
            
            await m.reply(msg)
            m.react('✅')
            return
        }
        
        if (cmd === 'sisalinode') {
            m.react('📊')
            
            const res = await fetch('https://api.linode.com/v4/linode/instances', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${linodeToton}`
                }
            })
            
            const data = await res.json()
            
            if (!res.ok) throw new Error('Failed earn data')
            
            const total = data.data?.length || 0
            await m.reply(`📊 *ᴛᴏᴛᴀʟ ʟɪɴᴏᴅᴇ ᴀᴋᴛɪғ*\n\n> ${total} VPS`)
            m.react('✅')
            return
        }
        
        if (cmd === 'checkvpslinode') {
            const linodeId = args[0]
            if (!linodeId) return m.reply(`❌ Enter ID Linode!\n\nExample: ${m.prefix}checkvpslinode 12345`)
            
            m.react('🔍')
            
            const res = await fetch(`https://api.linode.com/v4/linode/instances/${linodeId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${linodeToton}`
                }
            })
            
            const l = await res.json()
            
            if (!res.ok) throw new Error('Failed earn detail')
            
            const msg = `🔍 *ᴅᴇᴛᴀɪʟ ʟɪɴᴏᴅᴇ*\n\n` +
                `> 🆔 ID: \`${l.id}\`\n` +
                `> 🏷️ Label: \`${l.label}\`\n` +
                `> 📊 Status: ${l.status}\n` +
                `> 📍 Region: ${l.region}\n` +
                `> 💾 Type: ${l.type}\n` +
                `> 🌐 IP: \`${l.ipv4?.join(', ') || '-'}\``
            
            await m.reply(msg)
            m.react('✅')
            return
        }
        
        await m.reply(
            `☁️ *ʟɪɴᴏᴅᴇ ᴄᴏᴍᴍᴀɴᴅs*\n\n` +
            `> .linode2gb <label> - Create VPS 2GB\n` +
            `> .linode4gb <label> - Create VPS 4GB\n` +
            `> .linode8gb <label> - Create VPS 8GB\n` +
            `> .linode16gb <label> - Create VPS 16GB\n` +
            `> .listlinode - VPS list\n` +
            `> .onlinode <id> - Hidupkan VPS\n` +
            `> .offlinode <id> - Matikan VPS\n` +
            `> .rebootlinode <id> - Restart VPS\n` +
            `> .rebuildlinode <id> <image> - Rebuild\n` +
            `> .delinode <id> - Delete VPS\n` +
            `> .balancelinode - Check balance\n` +
            `> .sisalinode - Total VPS\n` +
            `> .checkvpslinode <id> - Detail VPS`
        )
        
    } catch (err) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
