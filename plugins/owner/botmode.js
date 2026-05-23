const config = require('../../config')
const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'botmode',
    alias: ['setmode', 'mode'],
    category: 'owner',
    description: 'Configure bot mode (md/cpanel/store/pushcontacts/all)',
    usage: '.botmode <mode> [--autoorder]',
    example: '.botmode store --autoorder',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
}

const VALID_MODES = ['md', 'cpanel', 'store', 'pushcontacts', 'all']

const MODE_DESCRIPTIONS = {
    md: 'Mode default, all feature tocuali panel/store/pushcontacts',
    cpanel: 'Mode panel, main + group + sticker + owner + tools + panel',
    store: 'Mode store, main + group + sticker + owner + store',
    pushcontacts: 'Mode pushcontacts, main + group + sticker + owner + pushcontacts',
    all: 'Mode full, SEMUA feature from all mode can inaccess'
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const mode = (args[0] || '').toLowerCase()
    const flags = args.slice(1).map(f => f.toLowerCase())
    const isAutoorder = false
    
    const globalMode = db.setting('botMode') || 'md'
    const groupData = m.isGroup ? (db.getGroup(m.chat) || {}) : {}
    const groupMode = groupData.botMode || null
    
    if (!mode) {
        const autoorderStatus = groupData.storeConfig?.autoorder ? '✅ ON' : '❌ OFF'
        let txt = `╭┈┈⬡「 🤖 *ʙᴏᴛ ᴍᴏᴅᴇ* 」
┃ ㊗ ɢʟᴏʙᴀʟ: *${globalMode.toUpperCase()}*
${m.isGroup ? `┃ ㊗ ɢʀᴜᴘ: *${(groupMode || 'INHERIT').toUpperCase()}*\n` : ''}${m.isGroup && (groupMode === 'store' || (!groupMode && globalMode === 'store')) ? `┃ ㊗ ᴀᴜᴛᴏᴏʀᴅᴇʀ: *${autoorderStatus}*\n` : ''}╰┈┈⬡

╭┈┈⬡「 📋 *ᴀᴠᴀɪʟᴀʙʟᴇ ᴍᴏᴅᴇs* 」
`
        const currentMode = m.isGroup ? (groupMode || globalMode) : globalMode
        for (const [toy, desc] of Object.entries(MODE_DESCRIPTIONS)) {
            const isActive = toy === currentMode ? ' ✅' : ''
            txt += `┃ ㊗ *${toy.toUpperCase()}*${isActive}\n`
            txt += `┃   ${desc}\n`
        }
        txt += `╰┈┈⬡

*ꜰʟᴀɢ sᴛᴏʀᴇ:*
> \`${m.prefix}botmode store\` - Manual order
> \`${m.prefix}botmode store --autoorder\` - Auto payment

> \`${m.prefix}botmode md\` → Mode default
> \`${m.prefix}botmode all\` → All feature`
        
        await m.reply(txt)
        return
    }
    
    if (!VALID_MODES.includes(mode)) {
        return m.reply(
            `❌ *ᴍᴏᴅᴇ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ*\n\n` +
            `> Mode terseina: \`${VALID_MODES.join(', ')}\``
        )
    }
    
    console.log('[Botmode] Debug:', { args: m.args, mode, flags, isAutoorder })
    
    if (m.isGroup) {
        const newGroupData = {
            ...groupData,
            botMode: mode
        }
        
        if (mode === 'store') {
            newGroupData.storeConfig = {
                ...(groupData.storeConfig || {}),
                autoorder: isAutoorder,
                products: groupData.storeConfig?.products || []
            }
        }
        
        db.setGroup(m.chat, newGroupData)
    } else {
        db.setting('botMode', mode)
    }
    
    db.save()
    m.react('✅')
    
    let extraInfo = ''
    if (mode === 'store' && m.isGroup) {
        if (isAutoorder) {
            try {
                const pakasir = require('../../src/lib/frenzy-pakasir')
                if (!pakasir.isEnabled()) {
                    extraInfo = `\n\n⚠️ *Pakasir not yet inkonfigurasi!*\n> Set in config.js: pakasir.slug & pakasir.apiKey`
                } else {
                    extraInfo = `\n\n✅ *Autoorder active!*\n> Payment otodeads via Pakasir`
                }
            } catch {
                extraInfo = `\n\n⚠️ *Pakasir module not found*`
            }
        } else {
            extraInfo = `\n\n📋 *Manual mode*\n> Admin perlu confirm order manual`
        }
    }
    
    await m.reply(
        `✅ *ᴍᴏᴅᴇ ᴅɪᴜʙᴀʜ*\n\n` +
        `> Mode: *${mode.toUpperCase()}*\n` +
        `> ${MODE_DESCRIPTIONS[mode]}\n` +
        (mode === 'store' && m.isGroup ? `> Autoorder: *${isAutoorder ? 'ON' : 'OFF'}*` : '') +
        extraInfo +
        `\n\n` +
        (m.isGroup ? `> _Mode this group also inchange._` : `> _Mode global inchange._`)
    )
    
    console.log(`[BotMode] Changed to ${mode.toUpperCase()} by ${m.pushName} (${m.sender})`)
}

module.exports = {
    config: pluginConfig,
    handler,
    VALID_MODES,
    MODE_DESCRIPTIONS
}
