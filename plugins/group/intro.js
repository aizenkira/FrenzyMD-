const { getDatabase } = require('../../src/lib/frenzy-database')
const config = require('../../config')

const pluginConfig = {
    name: 'intro',
    alias: ['pertonalan', 'forevertcome'],
    category: 'group',
    description: 'Tampilkan message intro group',
    usage: '.intro',
    example: '.intro',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true
}

const DEFAULT_INTRO = `hello kak @user 🖐

Tonalan first yukk
- Name : 
- Umur : 
- Asal : 
- Hobi : 
- Status : 

Hopefully betah yahh, in group @group

> For Owner:
ganti intro bawaan with .setintro <text>`

function parsePlaceholders(text, m, groupMeta) {
    const moment = require('moment-timezone')
    const now = moment().tz('Asia/Jakarta')
    const dateStr = now.format('D MMMM YYYY')
    const timeStr = now.format('HH:mm')
    
    return text
        .replace(/@user/gi, `@${m.sender.split('@')[0]}`)
        .replace(/@group/gi, groupMeta?.subject || 'Group')
        .replace(/@count/gi, groupMeta?.participants?.length || '0')
        .replace(/@date/gi, dateStr)
        .replace(/@time/gi, timeStr)
        .replace(/@desc/gi, groupMeta?.desc || 'No there is description')
        .replace(/@botname/gi, config.bot?.name || 'Frenzy-AI')
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const groupData = db.getGroup(m.chat) || db.setGroup(m.chat)
    const groupMeta = m.groupMetadata
    
    const introText = groupData.intro || DEFAULT_INTRO
    const parsed = parsePlaceholders(introText, m, groupMeta)
    
    await m.reply(parsed, { mentions: [m.sender] })
}

module.exports = {
    config: pluginConfig,
    handler,
    parsePlaceholders,
    DEFAULT_INTRO
}
