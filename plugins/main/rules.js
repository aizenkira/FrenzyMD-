const config = require('../../config')
const { getDatabase } = require('../../src/lib/frenzy-database')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'rules',
    alias: ['rulesbot', 'botrules'],
    category: 'main',
    description: 'Display bot rules',
    usage: '.rules',
    example: '.rules',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true
}

const DEFAULT_BOT_RULES = `📜 *ᴀᴛᴜʀᴀɴ ʙᴏᴛ*

┃ 1️⃣ Don't spam command
┃ 2️⃣ Usage feature with bijak
┃ 3️⃣ Inlarang menyalahusage bot
┃ 4️⃣ Hordead sethe same as users
┃ 5️⃣ Report bug to owner
┃ 6️⃣ Don't request feature aneh
┃ 7️⃣ Bot not 24/7, there is maintenance

_Peviolatean will mendon'tibatkan banned!_`

async function handler(m, { sock, config: botConfig }) {
    const db = getDatabase()
    const customRules = db.setting('botRules')
    const rulesText = customRules || DEFAULT_BOT_RULES

    const imagePath = path.join(process.cwd(), 'assets', 'images', 'frenzy-rules.jpg')
    let imageBuffer = fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null

    const saluranId = botConfig.saluran?.id || '120363208449943317@newsletter'
    const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'Frenzy-AI'

    if (imageBuffer) {
        await sock.sendMessage(m.chat, {
            image: imageBuffer,
            caption: rulesText,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                }
            }
        }, { quoted: m })
    } else {
        await m.reply(rulesText)
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    DEFAULT_BOT_RULES
}
