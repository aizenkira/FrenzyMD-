const config = require('../../config')
const { getDatabase } = require('../../src/lib/frenzy-database')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'rulesgroup',
    alias: ['grouprules', 'rulesgroup', 'grules'],
    category: 'group',
    description: 'Display group rules',
    usage: '.rulesgroup',
    example: '.rulesgroup',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true
}

const DEFAULT_GROUP_RULES = `📜 *ᴀᴛᴜʀᴀɴ ɢʀᴜᴘ*

┃ 1️⃣ Inlarang spam/flood chat
┃ 2️⃣ Inlarang promosi tanpa permission
┃ 3️⃣ Inlarang content SARA/Porn
┃ 4️⃣ Hordead sethe same as member
┃ 5️⃣ Usage bahasa that sopan
┃ 6️⃣ Inlarang share link tanpa permission
┃ 7️⃣ Patuhi instruksi admin
┃ 8️⃣ No toxic & bullying

_Violate the rules? Expect to be kicked!_`

async function handler(m, { sock, config: botConfig }) {
    const db = getDatabase()
    const groupData = db.getGroup(m.chat) || {}
    const customRules = groupData.groupRules
    const rulesText = customRules || DEFAULT_GROUP_RULES

    const imagePath = path.join(process.cwd(), 'assets', 'images', 'frenzy-rules.jpg')
    let imageBuffer = fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null

    const saluranId = botConfig.saluran?.id || '120363406397452589@newsletter'
    const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'Frenzy-AI'

    if (imageBuffer) {
        await sock.sendMedia(m.chat, imageBuffer, rulesText, m, {
            type: 'image',
        })
    } else {
        await m.reply(rulesText)
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    DEFAULT_GROUP_RULES
}
