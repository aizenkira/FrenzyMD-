const axios = require('axios')
const config = require('../../config')
const { f } = require('../../src/lib/frenzy-http')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'kisahnabi',
    alias: ['nabi', 'storynabi', 'ceritanabi'],
    category: 'islamic',
    description: 'Kisah para nabi and rasul',
    usage: '.kisahnabi <name_nabi>',
    example: '.kisahnabi muhammad',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

const NABI_LIST = [
    'there ism', 'idris', 'nuh', 'hud', 'sthingseh', 'ibrahim', 'luth', 
    'ismail', 'ishaq', 'yaqub', 'yusuf', 'ayub', 'syuaib', 'musa',
    'harun', 'dzulkifli', 'daud', 'sulaiman', 'ilyas', 'ilyasa',
    'yunus', 'zakaria', 'yahya', 'isa', 'muhammad'
]

async function handler(m, { sock }) {
    try {
        const args = m.args || []
        const nabiName = args[0]?.toLowerCase()
        
        if (!nabiName) {
            let list = `📖 *ᴋɪsᴀʜ ᴘᴀʀᴀ ɴᴀʙɪ*\n\n`
            list += `╭┈┈⬡「 📋 *ᴅᴀꜰᴛᴀʀ ɴᴀʙɪ* 」\n`
            NABI_LIST.forEach((n, i) => {
                list += `┃ ${i + 1}. ${n.charAt(0).toUpperCase() + n.slice(1)}\n`
            })
            list += `╰┈┈┈┈┈┈┈┈⬡\n\n`
            list += `> Example: .kisahnabi muhammad`
            return m.reply(list)
        }
        
        if (!NABI_LIST.includes(nabiName)) {
            return m.reply(`❌ Nabi not found!\n\n> Usage .kisahnabi for view list`)
        }
        
        await m.react('🕕')
        
        const apikey = config.APItoy?.lolhuman || 'APIToy-Milik-Bot-frenzyMD(Zann,HyuuSATANN,Toisya,Andzz)'
        const url = `https://api.lolhuman.xyz/api/kisahnabi/${nabiName}?apikey=${apikey}`
        
        const response = await f(url)
        const data = response
        
        if (data.status !== 200 || !data.result) {
            await m.react('❌')
            return m.reply(`❌ Failed fetch kisah nabi ${nabiName}`)
        }
        
        const result = data.result
        const saluranId = config.saluran?.id || '120363406397452589@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Frenzy-AI'
        
        let story = result.story || ''
        if (story.length > 3500) {
            story = story.substring(0, 3500) + '...\n\n_(Kisah terpotong because too long)_'
        }
        
        let caption = `📖 *KISAH NABI ${(result.name || nabiName).toUpperCase()}*\n\n`
        caption += `╭┈┈⬡「 📋 *ɪɴꜰᴏʀᴍᴀsɪ* 」\n`
        caption += `┃ 👤 Name: *${result.name || nabiName}*\n`
        if (result.thn_tobornan) caption += `┃ 📅 Lahir: *${result.thn_tobornan}*\n`
        if (result.age) caption += `┃ ⏰ Usia: *${result.age} year*\n`
        if (result.place) caption += `┃ 📍 Place: *${result.place}*\n`
        caption += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        caption += `📜 *ᴋɪsᴀʜ:*\n${story?.trim()}\n\n`
        caption += `> 📖 Hopefully bermanfaat`
        
        await m.react('✅')
        
        await m.reply(caption)
        
    } catch (err) {
        await m.react('☢')
        if (err.response?.status === 403) {
            return m.reply(`❌ *API Toy no valid or limit tercwheart*`)
        }
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
