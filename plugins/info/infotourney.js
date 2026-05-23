const axios = require('axios')
const cheerio = require('cheerio')
const moment = require('moment-timezone')
const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'inphotourney',
    alias: ['tourney', 'turnamen', 'mltourney'],
    category: 'info',
    description: 'Info turnamen Mobile Legends latest',
    usage: '.inphotourney',
    example: '.inphotourney',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

async function getInfoTourney() {
    const url = 'https://inphotourney.com/tournament/mobile-legends'
    const { data } = await axios.get(url)
    const $ = cheerio.load(data)
    const tournaments = []

    $('.items-row .item').each((_, element) => {
        const item = $(element)

        const title = item.find('h2[itemprop="name"] a').text().trim()
        const link = item.find('h2[itemprop="name"] a').attr('href')
        const image = item.find('p img').attr('src')
        let datePublished = item.find('time[itemprop="datePublished"]').attr('datetime')

        if (datePublished) {
            datePublished = moment(datePublished).tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm')
        }

        const descriptionHtml = item.find('p[style="text-align: center;"]').html() || ""
        const [rawDescription, rawInfo] = descriptionHtml.split('<br>').map(text => text.trim())

        const description = rawDescription ? rawDescription.replace(/&nbsp;/g, ' ') : ""
        const info = rawInfo ? rawInfo.replace(/&nbsp;/g, ' ') : ""

        tournaments.push({
            title,
            imageUrl: new URL(image, url).href,
            datePublished,
            description,
            info,
            url: new URL(link, url).href
        })
    })

    return tournaments.slice(0, 5)
}

async function handler(m, { sock }) {
    await m.react('🕕')
    
    try {
        const tournaments = await getInfoTourney()
        
        if (!tournaments || tournaments.length === 0) {
            await m.react('❌')
            return m.reply('❌ No there is turnamen that intemukan')
        }
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Frenzy-AI'
        
        let text = `🏆 *ɪɴꜰᴏ ᴛᴜʀɴᴀᴍᴇɴ ᴍᴏʙɪʟᴇ ʟᴇɢᴇɴᴅs*\n\n`
        text += `> 5 Turnamen Ternew\n\n`
        
        for (let i = 0; i < tournaments.length; i++) {
            const t = tournaments[i]
            text += `${i + 1}. *${t.title}*\n`
            text += `📅 ${t.datePublished || 'N/A'}\n`
            if (t.description) text += `📝 ${t.description}\n`
            if (t.info) text += `⚠️ ${t.info}\n`
            text += `🔗 ${t.url}\n\n`
        }
        
        const firstImage = tournaments[0]?.imageUrl
        
        if (firstImage) {
            await sock.sendMedia(m.chat, firstImage, text, m, {
                type: 'image'
            })
        } else {
            await m.reply(text)
        }
        
        await m.react('✅')
        
    } catch (error) {
        await m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
