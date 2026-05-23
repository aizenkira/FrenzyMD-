const config = require('../../config')
const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'setwelcometype',
    alias: ['welcometype', 'welcomevariant', 'welcomestyle'],
    category: 'owner',
    description: 'Configure welcome message display variant',
    usage: '.setwelcometype',
    example: '.setwelcometype',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
}

const VARIANTS = {
    1: { name: 'Canvas Image', desc: 'Image canvas with profile photo' },
    2: { name: 'Carousel Cards', desc: 'Kartu interactive with button' },
    3: { name: 'Text Only', desc: 'Message text at leastis tanpa image' },
    4: { name: 'Group', desc: 'ExternalAdReply group' },
    5: { name: 'Simple', desc: 'Message text simple + poto profile' }
}

async function handler(m, { sock, db }) {
    const args = m.args || []
    const variant = args[0]?.toLowerCase()
    const current = db.setting('welcomeType') || 1
    
    if (variant && /^v?[1-5]$/.test(variant)) {
        const id = parseInt(variant.replace('v', ''))
        db.setting('welcomeType', id)
        await db.save()
        
        await m.reply(
            `✅ Welcome type convert to *V${id}*\n` +
            `*${VARIANTS[id].name}*\n` +
            `_${VARIANTS[id].desc}_`
        )
        return
    }
    
    const buttons = []
    for (const [id, val] of Object.entries(VARIANTS)) {
        const mark = parseInt(id) === current ? ' ✓' : ''
        buttons.push({
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
                insplay_text: `V${id}${mark} - ${val.name}`,
                id: `${m.prefix}setwelcometype v${id}`
            })
        })
    }
    const fs = require('fs')
    await sock.sendButton(m.chat, fs.readFileSync('./assets/images/frenzy.jpg'), `🥗 *WELCOME TYPE*\n\Tipe currently is the version *${current}*\n_${VARIANTS[current].name}_\n\nPlease choose a welcome variant:`, m, { buttons })
}

module.exports = {
    config: pluginConfig,
    handler
}
