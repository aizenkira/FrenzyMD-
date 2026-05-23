const { getDatabase } = require('../../src/lib/frenzy-database')
const config = require('../../config')

const pluginConfig = {
    name: 'list',
    alias: ['register', 'reg'],
    category: 'user',
    description: 'Register as a bot user to earn rewards',
    usage: '.list <name>',
    example: '.list aizen',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true,
    skipRegistration: true
}

if (!global.registrationSessions) global.registrationSessions = {}

const SESSION_TIMEOUT = 300000

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (user?.isRegistered) {
        return m.reply(
            `✅ You already registered!\n\n` +
            `╭┈┈⬡「 📋 *ᴅᴀᴛᴀ* 」\n` +
            `┃ 📛 Name: *${user.regName || '-'}*\n` +
            `┃ 🎂 Umur: *${user.regAge || '-'}*\n` +
            `┃ 👤 Gender: *${user.regGender || '-'}*\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> For unregister: \`${m.prefix}unreg\``
        )
    }
    
    const name = m.text?.trim()
    
    if (!name) {
        return m.reply(
            `📝 *ᴅᴀꜰᴛᴀʀ ᴜsᴇʀ*\n\n` +
            `> Enter name you!\n\n` +
            `*Example:*\n` +
            `\`${m.prefix}list aizen\`\n\n` +
            `*Rewards:*\n` +
            `> 💰 +${(config.registration?.rewards?.coins || 30000).toLocaleString('id-ID')} Coins\n` +
            `> ⚡ +${config.registration?.rewards?.energy || 300} Energy\n` +
            `> ⭐ +${(config.registration?.rewards?.exp || 300000).toLocaleString('id-ID')} EXP`
        )
    }
    
    if (name.length < 2 || name.length > 30) {
        return m.reply(`❌ Name must be 2-30 characters!`)
    }
    
    global.registrationSessions[m.sender] = {
        step: 'age',
        name: name,
        age: null,
        gender: null,
        chatJid: m.chat,
        startedAt: Date.now(),
        timeout: setTimeout(() => {
            if (global.registrationSessions[m.sender]) {
                delete global.registrationSessions[m.sender]
            }
        }, SESSION_TIMEOUT)
    }
    
    const saluranId = config.saluran?.id || '120363406397452589@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Frenzy-AI'
    
    await sock.sendMessage(m.chat, {
        text: `📝 *ᴘᴇɴᴅᴀꜰᴛᴀʀᴀɴ - sᴛᴇᴘ 1/2*\n\n` +
            `Hello *${name}*! 👋\n\n` +
            `> How old are you?\n\n` +
            `*Reply this message with your age*\n` +
            `Example: \`17\``,
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
    
    m.react('📝')
}

async function registrationAnswerHandler(m, sock) {
    if (!m.body) return false
    if (m.isCommand) return false
    
    const session = global.registrationSessions[m.sender]
    if (!session) return false
    
    const text = m.body.trim()
    const db = getDatabase()
    
    const saluranId = config.saluran?.id || '120363406397452589@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Frenzy-AI'
    
    if (session.step === 'age') {
        const age = parseInt(text)
        
        if (isNaN(age) || age < 5 || age > 100) {
            await m.reply(`❌ Age not valid! Enter from 5-100.\n\n> Example: \`17\``)
            return true
        }
        
        session.age = age
        session.step = 'gender'
        
        await sock.sendMessage(m.chat, {
            text: `📝 *ᴘᴇɴᴅᴀꜰᴛᴀʀᴀɴ - sᴛᴇᴘ 2/2*\n\n` +
                `> Choose gender you:\n\n` +
                `┃ 👨 *Laki-laki* / *Cowok* / *L*\n` +
                `┃ 👩 *Perempuan* / *Cewek* / *P*\n\n` +
                `*Reply message this with chooseanmu*`,
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
        
        return true
    }
    
    if (session.step === 'gender') {
        let gender = null
        const lowText = text.toLowerCase()
        
        if (/^(laki[-\s]?laki|cowok?|cowo|l|male|pria)$/i.test(lowText)) {
            gender = 'Laki-laki'
        } else if (/^(perempuan|cewek?|cewe|p|female|wanita)$/i.test(lowText)) {
            gender = 'Perempuan'
        }
        
        if (!gender) {
            await m.reply(
                `❌ Gender not valid!\n\n` +
                `> Type: *Laki-laki* / *Cowok* / *L*\n` +
                `> Or: *Perempuan* / *Cewek* / *P*`
            )
            return true
        }
        
        session.gender = gender
        
        clearTimeout(session.timeout)
        
        const rewards = config.registration?.rewards || { coins: 30000, energy: 300, exp: 300000 }
        
        db.setUser(m.sender, {
            isRegistered: true,
            regName: session.name,
            regAge: session.age,
            regGender: gender
        })
        
        db.updateCoins(m.sender, rewards.coins)
        db.updateEnergy(m.sender, rewards.energy)
        db.updateExp(m.sender, rewards.exp)
        
        await db.save()
        
        delete global.registrationSessions[m.sender]
        
        await sock.sendMessage(m.chat, {
            text: `✅ *ᴘᴇɴᴅᴀꜰᴛᴀʀᴀɴ ʙᴇʀʜᴀsɪʟ!*\n\n` +
                `Welcome, *${session.name}*! 🎉\n\n` +
                `╭┈┈⬡「 📋 *ᴅᴀᴛᴀ* 」\n` +
                `┃ 📛 Name: *${session.name}*\n` +
                `┃ 🎂 Age: *${session.age} year*\n` +
                `┃ 👤 Gender: *${gender}*\n` +
                `╰┈┈┈┈┈┈┈┈⬡\n\n` +
                `╭┈┈⬡「 🎁 *ʀᴇᴡᴀʀᴅs* 」\n` +
                `┃ 💰 +${rewards.coins.toLocaleString('id-ID')} Coins\n` +
                `┃ ⚡ +${rewards.energy} Energy\n` +
                `┃ ⭐ +${rewards.exp.toLocaleString('id-ID')} EXP\n` +
                `╰┈┈┈┈┈┈┈┈⬡\n\n` +
                `> Good to use bot! 🚀`,
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
        
        await m.react('🎉')
        
        return true
    }
    
    return false
}

module.exports = {
    config: pluginConfig,
    handler,
    registrationAnswerHandler
}
