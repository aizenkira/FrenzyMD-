const axios = require('axios')
const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'lahelu',
    alias: ['randommeme'],
    category: 'random',
    description: 'Random image lahelu',
    usage: '.lahelu',
    example: '.lahelu',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const api = 'https://api.cuki.biz.id/api/random/lahelu?apikey=cuki-x'
    await m.react('🕕')
    
    try {
        const res = (await axios.get(api)).data
        const random = res.data[Math.floor(Math.random() * res.data.length)]
        if(random.content.includes('.mp4')) {
            await sock.sendMedia(m.chat, random.content, random.title, m, {
                type: 'video'
            })
        } else {
            await sock.sendMedia(m.chat, random.content, random.title, m, {
                type: 'image'
            })
        }
        await m.react('✅')
    } catch (e) {
        await m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
