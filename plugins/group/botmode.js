const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'botmode',
    alias: ['setmode', 'mode'],
    category: 'group',
    description: 'Atur mode bot for this group',
    usage: '.botmode <md/cpanel/pushcontacts/store/otp>',
    example: '.botmode store',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

const MODES = {
    md: {
        name: 'Multi-Device',
        desc: 'Mode default with all feature though',
        allowedCategories: null,
        excludeCategories: ['cpanel', 'pushcontacts', 'store']
    },
    cpanel: {
        name: 'CPanel Pterodactyl',
        desc: 'Mode only for panel server',
        allowedCategories: ['main', 'group', 'sticker', 'owner', 'tools', 'panel'],
        excludeCategories: null
    },
    pushcontacts: {
        name: 'Push Contact',
        desc: 'Mode only for push contacts to member',
        allowedCategories: ['owner', 'main', 'group', 'sticker', 'pushcontacts'],
        excludeCategories: null
    },
    store: {
        name: 'Store/Toko',
        desc: 'Mode only for online store',
        allowedCategories: ['main', 'group', 'sticker', 'owner', 'store'],
        excludeCategories: null
    },
    otp: {
        name: 'OTP Service',
        desc: 'Mode layanan OTP otodeads',
        allowedCategories: ['main', 'group', 'sticker', 'owner'],
        excludeCategories: null
    }
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const mode = (args[0] || '').toLowerCase()
    const flags = args.slice(1).map(f => f.toLowerCase())
    
    const groupData = db.getGroup(m.chat) || {}
    const currentMode = groupData.botMode || 'md'
    
    if (!mode) {
        let modeList = ''
        for (const [toy, val] of Object.entries(MODES)) {
            const isCurrent = toy === currentMode ? ' ⬅️' : ''
            modeList += `┃ \`${m.prefix}botmode ${toy}\`${isCurrent}\n`
            modeList += `┃ └ ${val.desc}\n`
        }
        
        const autoorderStatus = groupData.storeConfig?.autoorder ? '✅ ON' : '❌ OFF'
        
        return m.reply(
            `🔧 *ʙᴏᴛ ᴍᴏᴅᴇ*\n\n` +
            `> Mode currently: *${currentMode.toUpperCase()}* (${MODES[currentMode]?.name || 'Unknown'})\n` +
            (currentMode === 'store' ? `> Autoorder: *${autoorderStatus}*\n` : '') +
            `\n╭─「 📋 *ᴘɪʟɪʜᴀɴ* 」\n` +
            `${modeList}` +
            `╰───────────────\n\n` +
            `*ꜰʟᴀɢ sᴛᴏʀᴇ:*\n` +
            `> \`${m.prefix}botmode store\` - Manual order\n` +
            `> \`${m.prefix}botmode store --autoorder\` - Auto payment\n\n` +
            `> _Pengrules per-group_`
        )
    }
    
    if (!Object.keys(MODES).includes(mode)) {
        return m.reply(`❌ Mode not valid. Valid choices are: \`md\`, \`cpanel\`, \`pushcontacts\`, \`store\`, \`otp\``)
    }
    
    const isAutoorder = false
    
    console.log('[Botmode] Debug:', { args: m.args, mode, flags, isAutoorder })
    
    const newGroupData = {
        ...groupData,
        botMode: mode
    }
    
    if (mode === 'store') {
        let pakasirEnabled = false
        try {
            const pakasir = require('../../src/lib/frenzy-pakasir')
            pakasirEnabled = pakasir.isEnabled()
        } catch (e) {}
        
        if (isAutoorder && !pakasirEnabled) {
            return m.reply(
                `⚠️ *ᴀᴜᴛᴏᴏʀᴅᴇʀ ᴛɪᴅᴀᴋ ʙɪsᴀ ᴅɪᴀᴋᴛɪꜰᴋᴀɴ*\n\n` +
                `> Pakasir not yet inkonfigurasi!\n\n` +
                `*ᴄᴀʀᴀ sᴇᴛᴜᴘ:*\n` +
                `1. Buka \`config.js\`\n` +
                `2. Set \`pakasir.slug\` and \`pakasir.apiKey\`\n` +
                `3. Restart bot\n\n` +
                `> Or usage mode manual:\n` +
                `\`${m.prefix}botmode store\``
            )
        }
        
        newGroupData.storeConfig = {
            ...(groupData.storeConfig || {}),
            autoorder: isAutoorder,
            products: groupData.storeConfig?.products || []
        }
    }
    
    db.setGroup(m.chat, newGroupData)
    db.save()
    
    m.react('✅')
    
    let extraInfo = ''
    if (mode === 'store') {
        const products = newGroupData.storeConfig?.products || []
        if (isAutoorder) {
            extraInfo = `\n\n✅ *Autoorder active!*\n` +
                `> Payment otodeads via Pakasir\n` +
                `> Product: \`${products.length}\` item`
        } else {
            extraInfo = `\n\n📋 *Manual mode*\n` +
                `> Admin perlu confirm order manual\n` +
                `> Product: \`${products.length}\` item\n\n` +
                `*ᴘᴀɴᴅᴜᴀɴ:*\n` +
                `> \`${m.prefix}addprod <code> <price> <name>\`\n` +
                `> \`${m.prefix}listprod\` - View product`
        }
    }
    
    return m.reply(
        `✅ *ᴍᴏᴅᴇ ᴅɪᴜʙᴀʜ*\n\n` +
        `> Mode: *${mode.toUpperCase()}* (${MODES[mode].name})\n` +
        `> Group: *${m.chat.split('@')[0]}*\n` +
        (mode === 'store' ? `> Autoorder: *${isAutoorder ? 'ON' : 'OFF'}*` : '') +
        extraInfo +
        `\n\n> Type \`${m.prefix}menu\` for view menu.`
    )
}

function getGroupMode(chatJid, db) {
    if (!chatJid?.endsWith('@g.us')) return 'md'
    const groupData = db.getGroup(chatJid) || {}
    return groupData.botMode || 'md'
}

function getModeCategories(mode) {
    const modeConfig = MODES[mode] || MODES.md
    return {
        allowed: modeConfig.allowedCategories,
        excluded: modeConfig.excludeCategories
    }
}

function filterCategoriesByMode(categories, mode) {
    const modeConfig = MODES[mode] || MODES.md
    
    if (modeConfig.allowedCategories) {
        return categories.filter(cat => modeConfig.allowedCategories.includes(cat.toLowerCase()))
    }
    
    if (modeConfig.excludeCategories) {
        return categories.filter(cat => !modeConfig.excludeCategories.includes(cat.toLowerCase()))
    }
    
    return categories
}

module.exports = {
    config: pluginConfig,
    handler,
    getGroupMode,
    getModeCategories,
    filterCategoriesByMode,
    MODES
}
