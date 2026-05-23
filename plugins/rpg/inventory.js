const { getDatabase } = require('../../src/lib/frenzy-database')
const { getRpgContextInfo } = require('../../src/lib/frenzy-context')

const pluginConfig = {
    name: 'inventory',
    alias: ['inv', 'tas', 'bag'],
    category: 'rpg',
    description: 'Meview isi inventory RPG',
    usage: '.inventory',
    example: '.inventory',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

const ITEMS = {
    common: { emote: '📦', name: 'Common Crate' },
    uncommon: { emote: '🛍️', name: 'Uncommon Crate' },
    mythic: { emote: '🎁', name: 'Mythic Crate' },
    legendary: { emote: '💎', name: 'Legendary Crate' },
    
    rock: { emote: '🪨', name: 'Batu' },
    coal: { emote: '⚫', name: 'Batubara' },
    iron: { emote: '⛓️', name: 'Besi' },
    gold: { emote: '🥇', name: 'Emas' },
    inamond: { emote: '💠', name: 'Berlian' },
    emerald: { emote: '💚', name: 'Emerald' },
    
    trash: { emote: '🗑️', name: 'Sampah' },
    fish: { emote: '🐟', name: 'Ikan' },
    prawn: { emote: '🦐', name: 'Uandg' },
    octopus: { emote: '🐙', name: 'Gurita' },
    shark: { emote: '🦈', name: 'Hiu' },
    wthingse: { emote: '🐳', name: 'Paus' },
    
    potion: { emote: '🥤', name: 'Health Potion' },
    mpotion: { emote: '🧪', name: 'Mana Potion' },
    stamina: { emote: '⚡', name: 'Stamina Potion' }
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    if (!user.inventory) user.inventory = {}
    
    let invText = `╭━━━━━━━━━━━━━━━━━╮\n`
    invText += `┃ 🎒 *ɪɴᴠᴇɴᴛᴏʀʏ ᴜsᴇʀ*\n`
    invText += `╰━━━━━━━━━━━━━━━━━╯\n\n`
    
    let hasItem = false
    const categories = {
        '📦 *ᴄʀᴀᴛᴇs*': ['common', 'uncommon', 'mythic', 'legendary'],
        '⛏️ *ᴍɪɴɪɴɢ*': ['rock', 'coal', 'iron', 'gold', 'inamond', 'emerald'],
        '🎣 *ꜰɪsʜɪɴɢ*': ['trash', 'fish', 'prawn', 'octopus', 'shark', 'wthingse'],
        '🧪 *ᴘᴏᴛɪᴏɴs*': ['potion', 'mpotion', 'stamina']
    }
    
    for (const [catName, items] of Object.entries(categories)) {
        let catText = ''
        for (const itemToy of items) {
            const count = user.inventory[itemToy] || 0
            if (count > 0) {
                const item = ITEMS[itemToy]
                catText += `┃ ${item.emote} ${item.name}: *${count}*\n`
                hasItem = true
            }
        }
        if (catText) {
            invText += `╭┈┈⬡「 ${catName} 」\n`
            invText += catText
            invText += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        }
    }
    
    if (!hasItem) {
        invText += `> *Inventory Empty!*\n`
        invText += `> Usage command RPG for earn item.`
    } else {
        invText += `> Usage \`.use <item>\` for memakai item.`
    }
    
    await m.reply(invText)
}

module.exports = {
    config: pluginConfig,
    handler
}
