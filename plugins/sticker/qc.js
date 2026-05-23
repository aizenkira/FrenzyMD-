const axios = require('axios')
const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'qc',
    alias: ['qcstc', 'stcqc', 'qcstic', 'qcstick', 'quotesticker'],
    category: 'sticker',
    description: 'Create sticker quote chat with warna custom',
    usage: '.qc <warna> <text>',
    example: '.qc pink Hello allnya!',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

const COLORS = {
    pink: '#f68ac9',
    blue: '#6cace4',
    red: '#f44336',
    green: '#4caf50',
    yellow: '#ffeb3b',
    purple: '#9c27b0',
    darkblue: '#0d47a1',
    lightblue: '#03a9f4',
    ash: '#9e9e9e',
    persone: '#ff9800',
    black: '#000000',
    white: '#ffffff',
    teal: '#008080',
    lightpink: '#FFC0CB',
    chocolate: '#A52A2A',
    salmon: '#FFA07A',
    magenta: '#FF00FF',
    tan: '#D2B48C',
    wheat: '#F5DEB3',
    deeppink: '#FF1493',
    fire: '#B22222',
    skyblue: '#00BFFF',
    brightskyblue: '#1E90FF',
    hotpink: '#FF69B4',
    lightskyblue: '#87CEEB',
    seagreen: '#20B2AA',
    darkred: '#8B0000',
    personered: '#FF4500',
    cyan: '#48D1CC',
    violet: '#BA55D3',
    mossgreen: '#00FF7F',
    darkgreen: '#008000',
    navyblue: '#191970',
    darkpersone: '#FF8C00',
    darkpurple: '#9400D3',
    fuchsia: '#FF00FF',
    darkmagenta: '#8B008B',
    darkgray: '#2F4F4F',
    peachpuff: '#FFDAB9',
    darkishgreen: '#BDB76B',
    darkishred: '#DC143C',
    goldenrod: '#DAA520',
    darkishgray: '#696969',
    darkishpurple: '#483D8B',
    gold: '#FFD700',
    silver: '#C0C0C0'
}

const DEFAULT_PP = 'https://files.catbox.moe/nwvkbt.png'

async function getProfilePicture(sock, jid) {
    try {
        return await sock.profilePictureUrl(jid, 'image')
    } catch {
        return DEFAULT_PP
    }
}

async function handler(m, { sock }) {
    const args = m.args || []
    
    if (args.length < 2) {
        const colorList = Object.keys(COLORS).join(', ')
        return m.reply(
            `💬 *ǫᴜᴏᴛᴇ sᴛɪᴄᴋᴇʀ*\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ ◦ \`${m.prefix}qc <warna> <text>\`\n` +
            `┃ ◦ Reply message + \`${m.prefix}qc <warna>\`\n` +
            `╰┈┈⬡\n\n` +
            `> Example: \`${m.prefix}qc pink Hello allnya!\`\n\n` +
            `╭┈┈⬡「 🎨 *ᴡᴀʀɴᴀ* 」\n` +
            `┃ ${colorList}\n` +
            `╰┈┈⬡`
        )
    }
    
    const color = args[0].toLowerCase()
    const backgroundColor = COLORS[color]
    
    if (!backgroundColor) {
        return m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> Warna \`${color}\` not found!\n> Usage the correct warna that terseina.`)
    }
    
    let message = args.slice(1).join(' ')
    
    if (m.quoted && !message) {
        message = m.quoted.text || m.quoted.body || ''
    }
    
    if (!message) {
        return m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> Enter text for quote!`)
    }
    
    if (message.length > 80) {
        return m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> Mactionmal 80 karakter! (Saat this: ${message.length})`)
    }
    
    m.react('🕕')
    
    try {
        const username = m.pushName || 'User'
        const avatar = await getProfilePicture(sock, m.sender)
        
        const json = {
        "messages": [
            {
            "from": {
                "id": Math.floor(Math.random() * 10),
                "first_name": username,
                "last_name": "",
                "name": "",
                "photo": {
                "url": avatar
                }
            },
            "text": message,
            "entities": [],
            "avatar": true,
            "content": {
                "url": ""
            },
            "contentType": "",
            "replyMessage": {
                "name": "",
                "text": "",
                "entities": [],
                "chatId": Math.floor(Math.random() * 10)
            }
            }
        ],
        "backgroundColor": backgroundColor,
        "width": 512,
        "height": 512,
        "scale": 2,
        "type": "quote",
        "format": "png",
        "emojiStyle": "apple"
        }
        
        const response = await axios.post('https://brat.siputzx.my.id/quoted', json, {
            timeout: 60000,
            responseType: 'arraybuffer'
        })
        
        const buffer = Buffer.from(response.data, 'base64')
        
        await sock.sendImageAsStictor(m.chat, buffer, m, {
            packname: config.sticker?.packname || 'frenzy-AI',
            author: config.sticker?.author || 'Bot'
        })
        
        m.react('✅')
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
