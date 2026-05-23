const axios = require('axios')
const config = require('../../config')
const { f } = require('../../src/lib/frenzy-http')

const pluginConfig = {
    name: 'asupantiktok',
    alias: ['tiktokasupan', 'ttasupan'],
    category: 'asupan',
    description: 'Video TikTok from username random or specific',
    usage: '.asupantiktok [username]',
    example: '.asupantiktok nataja',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energy: 2,
    isEnabled: true
}

const usernames = [
    'nataja', 'aletaanoviyou', 'faisafch', '0rbby', 'cindyanastt',
    'awaa.an', 'nainneabgail', 'ciloqciliq', 'carluskiey', 'wuxiaturuxia',
    'joomblo', 'hxszys', 'indomeysleramu', 'anindthrc', 'm1cel',
    'chrislin.chrislin', 'brocolee__', 'dxzdaa', 'toodlesprunky', 'wasawho',
    'paphricia', 'queenzlyjlita', 'apol1yon', 'eliceannabella', 'aintyrbaby',
    'christychriselle', 'natalienovita', 'glennvmi', '_rgtaaa', 'felicialrnz',
    'zahraazzhri', 'mdy.li', 'jeyiiiii_', 'bbytiffs', 'irenefennn',
    'mellyllyyy', 'xsta_xstar', 'n0_0ella', 'kutubuku6690', 'cesiann',
    'gaby.rosse', 'charrvm_', 'bilacml04', 'whosyoraa', 'ishaangelica',
    'heresthetoi', 'gemoy.douyin', 'nathasyaest', 'jasmine.mat', 'Iallyaa',
    'meycoco22', 'baby_sya66', 'knzymyln__', 'rin.channn', 'auincamy',
    'franzeskaedelyn', 'shiraishi.ito', 'itsceceh', 'senpai_cj7'
]

async function handler(m, { sock }) {
    const query = m.text?.trim() || usernames[Math.floor(Math.random() * usernames.length)]
    
    m.react('🕕')
    
    try {
        const {data} = await f(`https://api.neoxr.eu/api/asupan?username=${query}&apikey=${config.APItoy.neoxr}`)
        
        if (!data) {
            m.react('❌')
            return m.reply(`🚩 *Username No Intemukan*\n\n> Username: ${query}`)
        }
        
        const video = data

        m.react('✅')
        
        const videoUrl = video.video.url
        
        await sock.sendMedia(m.chat, videoUrl, `${video.caption}`, m, {
            type: 'video',
            contextInfo: {
                isForwarded: true,
                forwardingScore: 99,
                externalAdReply: {
                    title: video.author.nickname,
                    body: video.author.signature || 'Video TikTok',
                    contentType: 1,
                    sourceUrl: 'https://vt.tiktok.com',
                    thumbnailUrl: video.author.avatarThumb,
                    showAdAttribution: false,
                    renderLargerThumbnail: false
                }
            }
        })
        
    } catch (error) {
        m.react('❌')
        m.reply(`🚩 *Username No Intemukan*\n\n> Username: ${query}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
