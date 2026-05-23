const { getDatabase } = require('../../src/lib/frenzy-database')
const config = require('../../config')

const pluginConfig = {
    name: 'suitpvp',
    alias: ['suit', 'rps', 'janton'],
    category: 'game',
    description: 'Main suit (rock paper scissors) with other players',
    usage: '.suit @tag',
    example: '.suit @628xxx',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true
}

if (!global.suitGames) global.suitGames = {}

const TIMEOUT = 90000
const WIN_REWARD = 1000

const EMOJI = {
    batu: '✊',
    gunting: '✌️',
    tortas: '✋'
}

async function handler(m, { sock }) {
    const db = getDatabase()
    
    const existingRoom = Object.values(global.suitGames).find(
        room => [room.p, room.p2].includes(m.sender)
    )
    
    if (existingRoom) {
        return m.reply(
            `❌ You are still in game suit!\n\n` +
            `> Donekan game you first.`
        )
    }
    
    let target = null
    if (m.quoted) {
        target = m.quoted.sender
    } else if (m.mentionedJid?.[0]) {
        target = m.mentionedJid[0]
    }
    
    if (!target) {
        return m.reply(
            `✊✌️✋ *sᴜɪᴛ ᴘᴠᴘ*\n\n` +
            `> Tag person to be you tantang!\n\n` +
            `*Example:*\n` +
            `> \`.suit @628xxx\``
        )
    }
    
    if (target === m.sender) {
        return m.reply('❌ Cannot menantang self yourself!')
    }
    
    const targetInGame = Object.values(global.suitGames).find(
        room => [room.p, room.p2].includes(target)
    )
    
    if (targetInGame) {
        return m.reply('❌ That person is currently playing rock-paper-scissors with someone else!')
    }
    
    const roomId = 'suit_' + Date.now()
    
    global.suitGames[roomId] = {
        id: roomId,
        chat: m.chat,
        p: m.sender,
        p2: target,
        status: 'waiting',
        choose: null,
        choose2: null,
        createdAt: Date.now(),
        timeout: setTimeout(() => {
            if (global.suitGames[roomId]) {
                sock.sendMessage(m.chat, {
                    text: `⏱️ *TIMEOUT!*\n\n@${target.split('@')[0]} no merespon!\nSuit cancelled.`,
                    mentions: [target]
                })
                delete global.suitGames[roomId]
            }
        }, TIMEOUT)
    }
    
    await m.react('✊')
    await m.reply(`You menantang @${target.split('@')[0]} for adu suit\n\n` +
            `╭┈┈⬡「 💬 *ʀᴇsᴘᴏɴ* 」\n` +
            `┃ ✅ Type *receive* / *gas* / *ok*\n` +
            `┃ ❌ Type *reject* / *gacan*\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `Time: 90 second`, {  mentions: [target]})
}

async function answerHandler(m, sock) {
    if (!m.body) return false
    
    const text = m.body.trim().toLowerCase()
    const db = getDatabase()
    
    let room = null
    let roomId = null
    
    for (const [id, r] of Object.entries(global.suitGames)) {
        if (r.chat === m.chat && [r.p, r.p2].includes(m.sender)) {
            room = r
            roomId = id
            break
        }
        if (!m.isGroup && [r.p, r.p2].includes(m.sender)) {
            room = r
            roomId = id
            break
        }
    }
    
    if (!room) return false
    
    if (room.status === 'waiting' && m.sender === room.p2 && m.chat === room.chat) {
        if (/^(acc(ept)?|receive|gas|oto?|ok|iya|yoi)$/i.test(text)) {
            clearTimeout(room.timeout)
            room.status = 'playing'
            
            await m.react('🎮')
            
            await m.reply(`✊✌️✋ *sᴜɪᴛ ᴅɪᴍᴜʟᴀɪ!*\n\n` +
                    `@${room.p.split('@')[0]} vs @${room.p2.split('@')[0]}\n\n` +
                    `> 📩 Check *Private Chat* for choose!\n` +
                    `> ⏱️ Timeout: 90 second`, {  mentions: [room.p, room.p2]})
            
            const pmMessage = `✊✌️✋ *sᴜɪᴛ - ᴘɪʟɪʜ ᴊᴀᴡᴀʙᴀɴ*\n\n` +
                `Type the correct:\n\n` +
                `┃ ✊ *batu*\n` +
                `┃ ✌️ *gunting*\n` +
                `┃ ✋ *tortas*\n\n` +
                `*TIP: Reply message this with chooseanmu!*\n` +
                `Example: *batu*`
            
            try {
                await sock.sendMessage(room.p, { text: pmMessage })
            } catch (e) {
                console.log('[Suit] Failed to PM player 1:', e.message)
            }
            
            try {
                await sock.sendMessage(room.p2, { text: pmMessage })
            } catch (e) {
                console.log('[Suit] Failed to PM player 2:', e.message)
            }
            
            room.timeout = setTimeout(async () => {
                if (global.suitGames[roomId]) {
                    if (!room.choose && !room.choose2) {
                        await sock.sendMessage(room.chat, { 
                            text: '⏱️ Todua pemain no choose, suit cancelled!' 
                        })
                    } else if (!room.choose || !room.choose2) {
                        const afk = !room.choose ? room.p : room.p2
                        const winner = !room.choose ? room.p2 : room.p
                        
                        db.updateCoins(winner, WIN_REWARD)
                        
                        await sock.sendMessage(room.chat, {
                            text: `⏱️ *TIMEOUT!*\n\n` +
                                `@${afk.split('@')[0]} no choose!\n` +
                                `@${winner.split('@')[0]} menang! +Rp ${WIN_REWARD.toLocaleString()}`,
                            mentions: [afk, winner]
                        })
                    }
                    delete global.suitGames[roomId]
                }
            }, TIMEOUT)
            
            return true
        }
        
        if (/^(reject|gawant|later|ga(k.)?can|no|no)$/i.test(text)) {
            clearTimeout(room.timeout)
            
            await sock.sendMessage(room.chat, {
                text: `❌ @${room.p2.split('@')[0]} rejected the challenge!\nSuit cancelled.`,
                mentions: [room.p2]
            })
            
            delete global.suitGames[roomId]
            return true
        }
    }
    
    if (room.status === 'playing' && !m.isGroup) {
        const choices = /^(batu|gunting|tortas)$/i
        
        if (!choices.test(text)) return false
        
        const choice = text.toLowerCase()
        
        if (m.sender === room.p && !room.choose) {
            room.choose = choice
            await m.reply(`✅ You choose *${choice}* ${EMOJI[choice]}\n\n> Waiting opponent...`)
            
            if (!room.choose2) {
                await sock.sendMessage(room.chat, {
                    text: `🕕 @${room.p.split('@')[0]} already choose!\n> Waiting @${room.p2.split('@')[0]}...`,
                    mentions: [room.p, room.p2]
                })
            }
        }
        
        if (m.sender === room.p2 && !room.choose2) {
            room.choose2 = choice
            await m.reply(`✅ You choose *${choice}* ${EMOJI[choice]}\n\n> Waiting opponent...`)
            
            if (!room.choose) {
                await sock.sendMessage(room.chat, {
                    text: `🕕 @${room.p2.split('@')[0]} already choose!\n> Waiting @${room.p.split('@')[0]}...`,
                    mentions: [room.p, room.p2]
                })
            }
        }
        
        if (room.choose && room.choose2) {
            clearTimeout(room.timeout)
            
            let winner = null
            let tie = false
            
            if (room.choose === room.choose2) {
                tie = true
            } else if (
                (room.choose === 'batu' && room.choose2 === 'gunting') ||
                (room.choose === 'gunting' && room.choose2 === 'tortas') ||
                (room.choose === 'tortas' && room.choose2 === 'batu')
            ) {
                winner = room.p
            } else {
                winner = room.p2
            }
            
            let resultTxt = `✊✌️✋ *ʜᴀsɪʟ sᴜɪᴛ*\n\n`
            resultTxt += `@${room.p.split('@')[0]} ${EMOJI[room.choose]} ${room.choose}\n`
            resultTxt += `@${room.p2.split('@')[0]} ${EMOJI[room.choose2]} ${room.choose2}\n\n`
            
            if (tie) {
                resultTxt += `🤝 *SERI!*`
            } else {
                db.updateCoins(winner, WIN_REWARD)
                
                resultTxt += `🏆 @${winner.split('@')[0]} menang!\n`
                resultTxt += `> +Rp ${WIN_REWARD.toLocaleString()}`
            }
            
            await sock.sendMessage(room.chat, {
                text: resultTxt,
                mentions: [room.p, room.p2]
            }, { quoted: m })
            
            delete global.suitGames[roomId]
        }
        
        return true
    }
    
    return false
}

module.exports = {
    config: pluginConfig,
    handler,
    answerHandler
}
