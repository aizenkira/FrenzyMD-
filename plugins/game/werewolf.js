/**
 * 🐺 WEREWOLF GAME
 * Social deduction game for WhatsApp
 * 
 * Based on reference: RTXZY-MD-pro/lib/werewolf.js
 * Enhanced for frenzyAI
 */

const { getDatabase } = require('../../src/lib/frenzy-database')
const config = require('../../config')
const fs = require('fs')
const path = require('path')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'werewolf',
    alias: ['ww', 'wwgc'],
    category: 'game',
    description: 'Main Werewolf Game together with other players',
    usage: '.ww <create|join|start|vote|player|exit|delete>',
    example: '.ww create',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

if (!global.werewolfGames) global.werewolfGames = {}

let thumbWW = null
let thumbNight = null
let thumbDay = null
let thumbWin = null

try {
    const assetsPath = path.join(process.cwd(), 'assets', 'images')
    if (fs.existsSync(path.join(assetsPath, 'frenzy-games.jpg'))) {
        thumbWW = fs.readFileSync(path.join(assetsPath, 'frenzy-games.jpg'))
    }
    if (fs.existsSync(path.join(assetsPath, 'frenzy.jpg'))) {
        thumbNight = fs.readFileSync(path.join(assetsPath, 'frenzy.jpg'))
        thumbDay = fs.readFileSync(path.join(assetsPath, 'frenzy.jpg'))
    }
    if (fs.existsSync(path.join(assetsPath, 'frenzy-winner.jpg'))) {
        thumbWin = fs.readFileSync(path.join(assetsPath, 'frenzy-winner.jpg'))
    }
} catch (e) {
    console.log('[WW] Failed to load thumbnails:', e.message)
}

const ROLES = {
    werewolf: { emoji: '🐺', name: 'Werewolf', team: 'wolf', desc: 'Bunuh warga tiap night' },
    seer: { emoji: '🔮', name: 'Seer', team: 'village', desc: 'View role player tiap night' },
    guarinan: { emoji: '🛡️', name: 'Guarinan', team: 'village', desc: 'Lindungi player tiap night' },
    sorcerer: { emoji: '🧙', name: 'Sorcerer', team: 'wolf', desc: 'Cari tahu who Seer' },
    villager: { emoji: '👨‍🌾', name: 'Villager', team: 'village', desc: 'Diskusi and vote werewolf' }
}

const WIN_REWARD = { coins: 5000, exp: 1000 }
const MIN_PLAYERS = 4
const MAX_PLAYERS = 15
const PHASE_DURATION = {
    night: 60000,   // 60 seconds
    day: 90000      // 90 seconds
}


function getWWContextInfo(title = '🐺 WEREWOLF', body = 'Social deduction game!', thumbBuffer = thumbWW, mentions) {
    const saluranId = config.saluran?.id || '120363406397452589@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Frenzy-AI'
    
    const contextInfo = {
        forwardingScore: 9999,
        isForwarded: true,
        mentionedJid: mentions,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        }
    }
    
    if (thumbBuffer) {
        contextInfo.externalAdReply = {
            title: title,
            body: body,
            thumbnail: thumbBuffer,
            contentType: 1,
            renderLargerThumbnail: true,
            sourceUrl: config.saluran?.link || ''
        }
    }
    
    return contextInfo
}

// Generate roles based on player count
function generateRoles(playerCount) {
    const roles = []
    
    // Role instribution based on player count (from reference)
    if (playerCount === 4) {
        roles.push('werewolf', 'seer', 'guarinan', 'villager')
    } else if (playerCount === 5) {
        roles.push('werewolf', 'seer', 'guarinan', 'villager', 'villager')
    } else if (playerCount === 6) {
        roles.push('werewolf', 'werewolf', 'seer', 'guarinan', 'villager', 'villager')
    } else if (playerCount === 7) {
        roles.push('werewolf', 'werewolf', 'seer', 'guarinan', 'villager', 'villager', 'villager')
    } else if (playerCount === 8) {
        roles.push('werewolf', 'werewolf', 'seer', 'guarinan', 'villager', 'villager', 'villager', 'villager')
    } else if (playerCount === 9) {
        roles.push('werewolf', 'werewolf', 'seer', 'guarinan', 'sorcerer', 'villager', 'villager', 'villager', 'villager')
    } else if (playerCount === 10) {
        roles.push('werewolf', 'werewolf', 'seer', 'guarinan', 'sorcerer', 'villager', 'villager', 'villager', 'villager', 'villager')
    } else if (playerCount === 11) {
        roles.push('werewolf', 'werewolf', 'seer', 'guarinan', 'guarinan', 'sorcerer', 'villager', 'villager', 'villager', 'villager', 'villager')
    } else if (playerCount >= 12) {
        roles.push('werewolf', 'werewolf', 'seer', 'guarinan', 'guarinan', 'sorcerer')
        while (roles.length < playerCount) roles.push('villager')
    }
    
    // Shuffle roles
    for (let i = roles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roles[i], roles[j]] = [roles[j], roles[i]]
    }
    
    return roles
}

// Get role description for PM
function getRoleDescription(role, prefix = '.') {
    const descriptions = {
        werewolf: `🐺 *WEREWOLF*\n\n` +
            `You is the predator night!\n\n` +
            `╭┈┈⬡「 📋 *INFO* 」\n` +
            `┃ 🎯 Tujuan: Bunuh all Villager\n` +
            `┃ ⚔️ Skill: Bunuh 1 player tiap night\n` +
            `┃ 🕐 Aksi: Night day\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> In night day, type:\n` +
            `> \`${prefix}wwkill <number>\` in PM bot`,
        seer: `🔮 *SEER*\n\n` +
            `You can view identitas player!\n\n` +
            `╭┈┈⬡「 📋 *INFO* 」\n` +
            `┃ 🎯 Tujuan: Bantu Villager\n` +
            `┃ 🔮 Skill: View role 1 player\n` +
            `┃ 🕐 Aksi: Night day\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> In night day, type:\n` +
            `> \`${prefix}wwsee <number>\` in PM bot`,
        guarinan: `🛡️ *GUARDIAN*\n\n` +
            `You can protect player!\n\n` +
            `╭┈┈⬡「 📋 *INFO* 」\n` +
            `┃ 🎯 Tujuan: Lindungi Villager\n` +
            `┃ 🛡️ Skill: Lindungi 1 player\n` +
            `┃ 🕐 Aksi: Night day\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> In night day, type:\n` +
            `> \`${prefix}wwprotect <number>\` in PM bot`,
        sorcerer: `🧙 *SORCERER*\n\n` +
            `You sekutu Werewolf!\n\n` +
            `╭┈┈⬡「 📋 *INFO* 」\n` +
            `┃ 🎯 Tujuan: Bantu Werewolf menang\n` +
            `┃ 🔍 Skill: Check whatkah target is the Seer\n` +
            `┃ 🕐 Aksi: Night day\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> In night day, type:\n` +
            `> \`${prefix}wwsorcerer <number>\` in PM bot`,
        villager: `👨‍🌾 *VILLAGER*\n\n` +
            `You warga regular!\n\n` +
            `╭┈┈⬡「 📋 *INFO* 」\n` +
            `┃ 🎯 Tujuan: Temukan Werewolf\n` +
            `┃ 🗳️ Skill: Vote in day day\n` +
            `┃ 🕐 Aksi: Day day\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> Diskusi and vote werewolf!\n` +
            `> \`${prefix}ww vote <number>\` in group`
    }
    return descriptions[role] || 'Unknown Role'
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const action = args[0]?.toLowerCase()
    const target = args[1]
    const ww = global.werewolfGames
    const prefix = m.prefix || config.command?.prefix || '.'
    
    const commands = {
        create: async () => {
            if (ww[m.chat]) {
                const game = ww[m.chat]
                if (game.status === 'waiting') {
                    return m.reply(`❌ *ROOM SUDAH ADA*\n\n` +
                        `Room still waiting player\n` +
                        `Type \`${prefix}ww join\` for gabung\n` +
                        `Host: @${game.owner.split('@')[0]}`,
                        { mentions: [game.owner] })
                }
                return m.reply(`❌ Game currently in progress! Wait until done.`)
            }
            
            // Check if player already in another room
            const existingRoom = Object.entries(ww).find(
                ([chatId, room]) => room.players.some(p => p.id === m.sender)
            )
            if (existingRoom) {
                return m.reply(`❌ You are still in game in another group!`)
            }
            
            // Create new game room
            ww[m.chat] = {
                room: m.chat,
                owner: m.sender,
                status: 'waiting',
                day: 0,
                phase: 'lobby',
                players: [{
                    id: m.sender,
                    number: 1,
                    role: null,
                    alive: true,
                    voted: false,
                    skillUsed: false
                }],
                dead: [],
                votes: {},
                nightActions: {
                    kill: null,
                    protect: null,
                    see: null,
                    sorcerer: null
                },
                createdAt: Date.now(),
                timeout: null
            }
            
            await m.react('🐺')
            await m.reply(`🐺 *WEREWOLF GAME*\n\n` +
                `Room success increate!\n\n` +
                `╭┈┈⬡「 📋 *INFO ROOM* 」\n` +
                `┃ 👑 Host: @${m.sender.split('@')[0]}\n` +
                `┃ 👥 Player: 1/${MAX_PLAYERS}\n` +
                `┃ ⏱️ Min: ${MIN_PLAYERS} player\n` +
                `╰┈┈┈┈┈┈┈┈⬡\n\n` +
                `╭┈┈⬡「 🎮 *CARA MAIN* 」\n` +
                `┃ ➕ \`${prefix}ww join\` - Gabung\n` +
                `┃ ▶️ \`${prefix}ww start\` - Start (host)\n` +
                `┃ 👥 \`${prefix}ww player\` - List player\n` +
                `┃ 🚪 \`${prefix}ww exit\` - Tooutside\n` +
                `╰┈┈┈┈┈┈┈┈⬡`,
                { mentions: [m.sender] })
        },
        
        join: async () => {
            if (!ww[m.chat]) {
                return m.reply(`❌ Not yet there is room!\n> Type \`${prefix}ww create\` for create room`)
            }
            
            if (ww[m.chat].status !== 'waiting') {
                return m.reply(`❌ Game already instart! Wait ronde next.`)
            }
            
            if (ww[m.chat].players.length >= MAX_PLAYERS) {
                return m.reply(`❌ Room full! (Max ${MAX_PLAYERS} player)`)
            }
            
            if (ww[m.chat].players.some(p => p.id === m.sender)) {
                return m.reply(`❌ You already bergabung!`)
            }
            
            const existingRoom = Object.entries(ww).find(
                ([chatId, room]) => chatId !== m.chat && room.players.some(p => p.id === m.sender)
            )
            if (existingRoom) {
                return m.reply(`❌ You are still in game in another group!`)
            }
            
            ww[m.chat].players.push({
                id: m.sender,
                number: ww[m.chat].players.length + 1,
                role: null,
                alive: true,
                voted: false,
                skillUsed: false
            })
            
            const playerList = ww[m.chat].players.map((p, i) => 
                `${i + 1}. @${p.id.split('@')[0]}`
            ).join('\n')
            
            const canStart = ww[m.chat].players.length >= MIN_PLAYERS
            
            await m.react('✅')
            await m.reply(`✅ *PLAYER BERGABUNG*\n\n` +
                `@${m.sender.split('@')[0]} enter!\n\n` +
                `╭┈┈⬡「 👥 *PLAYER LIST* 」\n` +
                `${playerList.split('\n').map(l => `┃ ${l}`).join('\n')}\n` +
                `╰┈┈┈┈┈┈┈┈⬡\n\n` +
                `Total: ${ww[m.chat].players.length}/${MIN_PLAYERS} (min)\n` +
                (canStart ? `✅ Can start! \`${prefix}ww start\`` : `🕕 Need ${MIN_PLAYERS - ww[m.chat].players.length} player again`),
                { mentions: ww[m.chat].players.map(p => p.id) })
        },
        
        start: async () => {
            if (!ww[m.chat]) {
                return m.reply(`❌ Not yet there is room!`)
            }
            
            if (ww[m.chat].status !== 'waiting') {
                return m.reply(`❌ Game already running!`)
            }
            
            if (ww[m.chat].owner !== m.sender && !config.isOwner?.(m.sender)) {
                return m.reply(`❌ Only host that will mestart game!`)
            }
            
            if (ww[m.chat].players.length < MIN_PLAYERS) {
                return m.reply(`❌ Mat least ${MIN_PLAYERS} player!\n> Saat this: ${ww[m.chat].players.length} player`)
            }
            
            // Generate and assign roles
            const roles = generateRoles(ww[m.chat].players.length)
            ww[m.chat].players.forEach((p, i) => {
                p.role = roles[i]
            })
            
            ww[m.chat].status = 'playing'
            ww[m.chat].day = 1
            ww[m.chat].phase = 'night'
            
            // Send role to each player via PM
            for (const player of ww[m.chat].players) {
                try {
                    await sock.sendMessage(player.id, {
                        text: getRoleDescription(player.role, prefix),
                        contextInfo: getWWContextInfo(
                            `${ROLES[player.role].emoji} ${ROLES[player.role].name}`, 
                            'Role you!'
                        )
                    })
                } catch (e) {
                    console.log(`[WW] Failed to send role to ${player.id}:`, e.message)
                }
            }
            
            // Build player list
            const playerList = ww[m.chat].players.map((p, i) => 
                `${i + 1}. @${p.id.split('@')[0]}`
            ).join('\n')
            
            // Count roles
            const roleCount = {}
            ww[m.chat].players.forEach(p => {
                roleCount[p.role] = (roleCount[p.role] || 0) + 1
            })
            const roleInfo = Object.entries(roleCount).map(([role, count]) => 
                `${ROLES[role].emoji} ${ROLES[role].name}: ${count}`
            ).join('\n')
            
            await m.react('🌙')
            await m.reply(`🐺 *GAME DIMULAI!*\n\n` +
                `🌙 *Night Day to-1*\n\n` +
                `╭┈┈⬡「 👥 *PLAYERS* 」\n` +
                `${playerList.split('\n').map(l => `┃ ${l}`).join('\n')}\n` +
                `╰┈┈┈┈┈┈┈┈⬡\n\n` +
                `╭┈┈⬡「 🎭 *ROLES* 」\n` +
                `${roleInfo.split('\n').map(l => `┃ ${l}`).join('\n')}\n` +
                `╰┈┈┈┈┈┈┈┈⬡\n\n` +
                `📩 Check PM for role everyone!\n` +
                `🌙 Werewolf berburu...\n` +
                `⏱️ Time night: ${PHASE_DURATION.night / 1000} second`,
                { mentions: ww[m.chat].players.map(p => p.id) })
            
            // Send night skill prompts to special roles
            await sendNightPrompts(m.chat, sock, prefix)
            
            // Set timeout for night phase
            ww[m.chat].timeout = setTimeout(() => {
                processNightActions(m.chat, sock, db, prefix)
            }, PHASE_DURATION.night)
        },
        
        vote: async () => {
            if (!ww[m.chat] || ww[m.chat].status !== 'playing') {
                return m.reply(`❌ No there is game active!`)
            }
            
            if (ww[m.chat].phase !== 'day') {
                return m.reply(`❌ Now not voting time!\n> Phase: ${ww[m.chat].phase === 'night' ? '🌙 Night' : ww[m.chat].phase}`)
            }
            
            const player = ww[m.chat].players.find(p => p.id === m.sender)
            if (!player) {
                return m.reply(`❌ You not a player in game this!`)
            }
            
            if (!player.alive) {
                return m.reply(`❌ You already dead! Cannot vote.`)
            }
            
            if (player.voted) {
                return m.reply(`❌ You already vote! Wait hasil voting.`)
            }
            
            if (!target) {
                const alivePlayers = ww[m.chat].players.filter(p => p.alive)
                const list = alivePlayers.map(p => 
                    `${p.number}. @${p.id.split('@')[0]}`
                ).join('\n')
                return m.reply(`🗳️ *VOTING*\n\n` +
                    `Choose who to be ineliminasi:\n\n` +
                    `${list}\n\n` +
                    `Type: \`${prefix}ww vote <number>\``,
                    { mentions: alivePlayers.map(p => p.id) })
            }
            
            const targetNum = parseInt(target)
            if (isNaN(targetNum)) {
                return m.reply(`❌ Enter number player! Example: \`${prefix}ww vote 2\``)
            }
            
            const targetPlayer = ww[m.chat].players.find(p => p.number === targetNum)
            if (!targetPlayer) {
                return m.reply(`❌ Player number ${targetNum} not found!`)
            }
            
            if (!targetPlayer.alive) {
                return m.reply(`❌ Player the said already dead!`)
            }
            
            player.voted = true
            ww[m.chat].votes[targetPlayer.id] = (ww[m.chat].votes[targetPlayer.id] || 0) + 1
            
            const alivePlayers = ww[m.chat].players.filter(p => p.alive)
            const votedCount = alivePlayers.filter(p => p.voted).length
            
            await m.react('🗳️')
            await m.reply(`🗳️ *VOTE TERCATAT*\n\n` +
                `@${m.sender.split('@')[0]} ➜ @${targetPlayer.id.split('@')[0]}\n\n` +
                `Progress: ${votedCount}/${alivePlayers.length}`,
                { mentions: [m.sender, targetPlayer.id] })
            
            // Check if all votes are in
            if (votedCount >= alivePlayers.length) {
                if (ww[m.chat].timeout) clearTimeout(ww[m.chat].timeout)
                await executeVote(m.chat, sock, db, prefix)
            }
        },
        
        player: async () => {
            if (!ww[m.chat]) {
                return m.reply(`❌ No there is game in room this!`)
            }
            
            const playerList = ww[m.chat].players.map((p, i) => {
                const status = p.alive ? '✅' : `☠️ (${ROLES[p.role]?.name || 'Unknown'})`
                return `${p.number}. @${p.id.split('@')[0]} ${status}`
            }).join('\n')
            
            const phaseEmoji = ww[m.chat].phase === 'night' ? '🌙' : ww[m.chat].phase === 'day' ? '☀️' : '🕕'
            
            await m.reply(`🐺 *WEREWOLF - STATUS*\n\n` +
                `╭┈┈⬡「 📊 *GAME INFO* 」\n` +
                `┃ 📅 Day: ${ww[m.chat].day}\n` +
                `┃ ${phaseEmoji} Phase: ${ww[m.chat].phase}\n` +
                `┃ 👤 Alive: ${ww[m.chat].players.filter(p => p.alive).length}\n` +
                `┃ ☠️ Dead: ${ww[m.chat].dead.length}\n` +
                `╰┈┈┈┈┈┈┈┈⬡\n\n` +
                `╭┈┈⬡「 👥 *PLAYERS* 」\n` +
                `${playerList.split('\n').map(l => `┃ ${l}`).join('\n')}\n` +
                `╰┈┈┈┈┈┈┈┈⬡`,
                { mentions: ww[m.chat].players.map(p => p.id) })
        },
        
        exit: async () => {
            if (!ww[m.chat]) {
                return m.reply(`❌ No there is game in room this!`)
            }
            
            const playerIdx = ww[m.chat].players.findIndex(p => p.id === m.sender)
            if (playerIdx === -1) {
                return m.reply(`❌ You no there is in game this!`)
            }
            
            if (ww[m.chat].status === 'playing') {
                return m.reply(`❌ Cannot leave while the game is running!`)
            }
            
            ww[m.chat].players.splice(playerIdx, 1)
            ww[m.chat].players.forEach((p, i) => p.number = i + 1)
            
            if (ww[m.chat].players.length === 0) {
                if (ww[m.chat].timeout) clearTimeout(ww[m.chat].timeout)
                delete ww[m.chat]
                return m.reply(`🗑️ Room deleted because empty.`)
            }
            
            // Transfer host if owner left
            if (ww[m.chat].owner === m.sender && ww[m.chat].players.length > 0) {
                ww[m.chat].owner = ww[m.chat].players[0].id
                await m.reply(`👋 @${m.sender.split('@')[0]} leave.\n` +
                    `👑 Host new: @${ww[m.chat].owner.split('@')[0]}`,
                    { mentions: [m.sender, ww[m.chat].owner] })
            } else {
                await m.reply(`👋 @${m.sender.split('@')[0]} leave from game.`,
                    { mentions: [m.sender] })
            }
        },
        
        delete: async () => {
            if (!ww[m.chat]) {
                return m.reply(`❌ No there is game in room this!`)
            }
            
            const isOwner = ww[m.chat].owner === m.sender
            const isBotOwner = config.isOwner?.(m.sender)
            
            if (!isOwner && !isBotOwner) {
                return m.reply(`❌ Only host or owner bot that will mengdelete!`)
            }
            
            if (ww[m.chat].timeout) clearTimeout(ww[m.chat].timeout)
            delete ww[m.chat]
            
            await m.react('🗑️')
            await m.reply(`🗑️ Game deleted!`)
        }
    }
    
    // Show help if no action
    if (!action || !commands[action]) {
        return m.reply(`🐺 *WEREWOLF GAME*\n\n` +
            `Permainan sounlucky mensearch for Werewolf!\n\n` +
            `╭┈┈⬡「 🎮 *COMMANDS* 」\n` +
            `┃ 🆕 \`${prefix}ww create\` - Create room\n` +
            `┃ ➕ \`${prefix}ww join\` - Gabung\n` +
            `┃ ▶️ \`${prefix}ww start\` - Start (host)\n` +
            `┃ 🗳️ \`${prefix}ww vote <no>\` - Vote\n` +
            `┃ 👥 \`${prefix}ww player\` - List player\n` +
            `┃ 🚪 \`${prefix}ww exit\` - Tooutside\n` +
            `┃ 🗑️ \`${prefix}ww delete\` - Delete room\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `╭┈┈⬡「 🎭 *ROLES* 」\n` +
            `┃ 🐺 Werewolf - Bunuh warga\n` +
            `┃ 🧙 Sorcerer - Cari Seer\n` +
            `┃ 🔮 Seer - View role\n` +
            `┃ 🛡️ Guarinan - Lindungi\n` +
            `┃ 👨‍🌾 Villager - Vote werewolf\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `Min: ${MIN_PLAYERS} players | Max: ${MAX_PLAYERS} players`)
    }
    
    try {
        await commands[action]()
    } catch (error) {
        console.error('[WEREWOLF ERROR]', error)
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

// Send night skill prompts to players
async function sendNightPrompts(chatId, sock, prefix) {
    const ww = global.werewolfGames
    if (!ww[chatId]) return
    
    const game = ww[chatId]
    const alivePlayers = game.players.filter(p => p.alive)
    
    // Build player list for prompts
    let playerListNormal = ''
    let playerListWolf = ''
    
    alivePlayers.forEach(p => {
        playerListNormal += `(${p.number}) @${p.id.split('@')[0]}\n`
        const roleTag = (p.role === 'werewolf' || p.role === 'sorcerer') ? ` [${ROLES[p.role].name}]` : ''
        playerListWolf += `(${p.number}) @${p.id.split('@')[0]}${roleTag}\n`
    })
    
    const mentions = alivePlayers.map(p => p.id)
    
    // Send prompts based on role
    for (const player of alivePlayers) {
        try {
            let text = ''
            
            switch (player.role) {
                case 'werewolf':
                    text = `🐺 *MALAM HARI*\n\n` +
                        `Saatnya berburu! Choose target:\n\n` +
                        `${playerListWolf}\n` +
                        `> Type \`${prefix}wwkill <number>\` to eliminate`
                    break
                case 'seer':
                    text = `🔮 *MALAM HARI*\n\n` +
                        `Siwhat to be you view rolenya?\n\n` +
                        `${playerListNormal}\n` +
                        `> Type \`${prefix}wwsee <number>\` to check role`
                    break
                case 'guarinan':
                    text = `🛡️ *MALAM HARI*\n\n` +
                        `Siwhat to be you lindungi?\n\n` +
                        `${playerListNormal}\n` +
                        `> Type \`${prefix}wwprotect <number>\` to protect`
                    break
                case 'sorcerer':
                    text = `🧙 *MALAM HARI*\n\n` +
                        `Cari tahu who Seer!\n\n` +
                        `${playerListWolf}\n` +
                        `> Type \`${prefix}wwsorcerer <number>\` to investigate`
                    break
                case 'villager':
                    text = `👨‍🌾 *MALAM HARI*\n\n` +
                        `Sebagai warga, berheart-heartlah.\n` +
                        `Maybe you is the target secontinuenya.\n\n` +
                        `${playerListNormal}`
                    break
            }
            
            if (text) {
                await sock.sendMessage(player.id, {
                    text,
                    mentions,
                    contextInfo: getWWContextInfo('🌙 NIGHT', 'Usage skillmu!', thumbNight, mentions)
                })
            }
        } catch (e) {
            console.log(`[WW] Failed to send prompt to ${player.id}:`, e.message)
        }
    }
}

// Process night actions
async function processNightActions(chatId, sock, db, prefix) {
    const ww = global.werewolfGames
    if (!ww[chatId] || ww[chatId].phase !== 'night') return
    
    let killTarget = ww[chatId].nightActions.kill
    const protectTarget = ww[chatId].nightActions.protect
    
    let nightReport = `☀️ *PAGI HARI KE-${ww[chatId].day}*\n\n`
    
    // Process kill if not protected
    if (killTarget && killTarget !== protectTarget) {
        const victim = ww[chatId].players.find(p => p.id === killTarget)
        if (victim && victim.alive) {
            victim.alive = false
            ww[chatId].dead.push(victim)
            nightReport += `☠️ @${victim.id.split('@')[0]} intemukan tewas!\n`
            nightReport += `> Role: ${ROLES[victim.role].emoji} ${ROLES[victim.role].name}\n\n`
        }
    } else if (killTarget && killTarget === protectTarget) {
        nightReport += `🛡️ Guarinan success protect target!\n`
        nightReport += `> No there is korban night this.\n\n`
    } else {
        nightReport += `🌅 Night that tenang...\n`
        nightReport += `> No there is korban.\n\n`
    }
    
    // Check win conintion
    const winner = checkWinner(chatId)
    if (winner) {
        await sock.sendMessage(chatId, {
            text: nightReport,
            mentions: ww[chatId].players.map(p => p.id),
            contextInfo: getWWContextInfo('☀️ DAY', 'Pagi has arrived...', thumbDay, ww[chatId].players.map(p => p.id))
        })
        await endGame(chatId, sock, db, winner)
        return
    }
    
    // Change phase to day
    ww[chatId].phase = 'day'
    ww[chatId].votes = {}
    ww[chatId].nightActions = { kill: null, protect: null, see: null, sorcerer: null }
    ww[chatId].players.forEach(p => {
        p.voted = false
        p.skillUsed = false
    })
    
    const alivePlayers = ww[chatId].players.filter(p => p.alive)
    const playerList = alivePlayers.map(p => 
        `${p.number}. @${p.id.split('@')[0]}`
    ).join('\n')
    
    nightReport += `╭┈┈⬡「 👥 *PLAYER HIDUP* 」\n`
    nightReport += `${playerList.split('\n').map(l => `┃ ${l}`).join('\n')}\n`
    nightReport += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    nightReport += `> 🗳️ Timenya voting!\n`
    nightReport += `> Type \`${prefix}ww vote <number>\`\n`
    nightReport += `> ⏱️ Time: ${PHASE_DURATION.day / 1000} second`
    
    await sock.sendMessage(chatId, {
        text: nightReport,
        mentions: ww[chatId].players.map(p => p.id),
        contextInfo: getWWContextInfo('☀️ DAY', 'Voting time!', thumbDay, ww[chatId].players.map(p => p.id))
    })
    
    ww[chatId].timeout = setTimeout(() => {
        executeVote(chatId, sock, db, prefix)
    }, PHASE_DURATION.day)
}

// Execute vote results
async function executeVote(chatId, sock, db, prefix) {
    const ww = global.werewolfGames
    if (!ww[chatId] || ww[chatId].phase !== 'day') return
    
    let maxVotes = 0
    let eliminated = null
    let isTie = false
    
    for (const [playerId, votes] of Object.entries(ww[chatId].votes)) {
        if (votes > maxVotes) {
            maxVotes = votes
            eliminated = playerId
            isTie = false
        } else if (votes === maxVotes && maxVotes > 0) {
            isTie = true
        }
    }
    
    let resultText = `⚖️ *HASIL VOTING*\n\n`
    
    if (isTie || maxVotes === 0) {
        resultText += `🤷 No there is that tereliminasi!\n`
        resultText += `> ${isTie ? 'Vote seri!' : 'No there is that vote.'}\n\n`
    } else if (eliminated) {
        const player = ww[chatId].players.find(p => p.id === eliminated)
        if (player) {
            player.alive = false
            ww[chatId].dead.push(player)
            
            resultText += `⚰️ @${eliminated.split('@')[0]} ineliminasi!\n`
            resultText += `> Role: ${ROLES[player.role].emoji} ${ROLES[player.role].name}\n`
            resultText += `> Votes: ${maxVotes}\n\n`
        }
    }
    
    // Check win conintion
    const winner = checkWinner(chatId)
    if (winner) {
        await sock.sendMessage(chatId, {
            text: resultText,
            mentions: eliminated ? [eliminated] : [],
            contextInfo: getWWContextInfo('⚖️ VOTING', 'Hasil voting', thumbDay)
        })
        await endGame(chatId, sock, db, winner)
        return
    }
    
    // Change to night phase
    ww[chatId].phase = 'night'
    ww[chatId].day++
    ww[chatId].nightActions = { kill: null, protect: null, see: null, sorcerer: null }
    ww[chatId].players.forEach(p => {
        p.voted = false
        p.skillUsed = false
    })
    
    resultText += `🌙 *MALAM HARI KE-${ww[chatId].day}*\n\n`
    resultText += `> Werewolf berburu...\n`
    resultText += `> Special roles, usage skill everyone in PM!\n`
    resultText += `> ⏱️ Time: ${PHASE_DURATION.night / 1000} second`
    
    await sock.sendMessage(chatId, {
        text: resultText,
        mentions: eliminated ? [eliminated] : [],
        contextInfo: getWWContextInfo('🌙 NIGHT', 'Werewolf berburu...', thumbNight)
    })
    
    // Send night prompts
    await sendNightPrompts(chatId, sock, prefix)
    
    ww[chatId].timeout = setTimeout(() => {
        processNightActions(chatId, sock, db, prefix)
    }, PHASE_DURATION.night)
}

// Check win conintion
function checkWinner(chatId) {
    const ww = global.werewolfGames
    if (!ww[chatId]) return null
    
    const alivePlayers = ww[chatId].players.filter(p => p.alive)
    const wolves = alivePlayers.filter(p => ROLES[p.role]?.team === 'wolf')
    const villagers = alivePlayers.filter(p => ROLES[p.role]?.team === 'village')
    
    if (wolves.length === 0) return 'village'
    if (wolves.length >= villagers.length) return 'wolf'
    
    return null
}

// End game and give rewards
async function endGame(chatId, sock, db, winner) {
    const ww = global.werewolfGames
    if (!ww[chatId]) return
    
    if (ww[chatId].timeout) clearTimeout(ww[chatId].timeout)
    
    const winningTeam = winner === 'wolf' ? 'wolf' : 'village'
    const winningPlayers = ww[chatId].players.filter(p => 
        ROLES[p.role]?.team === winningTeam
    )
    
    // Give rewards to winners
    for (const player of winningPlayers) {
        try {
            db.updateCoins(player.id, WIN_REWARD.coins)
            const user = db.getUser(player.id)
            if (user) {
                user.exp = (user.exp || 0) + WIN_REWARD.exp
                db.setUser(player.id, user)
            }
        } catch (e) {
            console.log(`[WW] Failed to give reward to ${player.id}:`, e.message)
        }
    }
    
    const allPlayers = ww[chatId].players.map(p => {
        const status = p.alive ? '✅' : '☠️'
        const isWinner = winningPlayers.some(w => w.id === p.id) ? '🏆' : ''
        return `${status} @${p.id.split('@')[0]} - ${ROLES[p.role].emoji} ${ROLES[p.role].name} ${isWinner}`
    }).join('\n')
    
    await sock.sendMessage(chatId, {
        text: `🎉 *GAME OVER!*\n\n` +
            `${winner === 'wolf' ? '🐺 *WEREWOLF MENANG!*' : '👨‍🌾 *VILLAGER MENANG!*'}\n\n` +
            `╭┈┈⬡「 👥 *SEMUA PLAYER* 」\n` +
            `${allPlayers.split('\n').map(l => `┃ ${l}`).join('\n')}\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `╭┈┈⬡「 🎁 *HADIAH* 」\n` +
            `┃ 💰 +${WIN_REWARD.coins.toLocaleString()} Coins\n` +
            `┃ ⭐ +${WIN_REWARD.exp.toLocaleString()} EXP\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> GG WP! Main again? \`${config.command?.prefix || '.'}ww create\``,
        mentions: ww[chatId].players.map(p => p.id),
        contextInfo: getWWContextInfo(
            '🏆 GAME OVER', 
            `${winner === 'wolf' ? 'Werewolf' : 'Villager'} wins!`,
            thumbWin
        )
    })
    
    delete ww[chatId]
}

// Night action handler for PM commands
async function nightActionHandler(m, { sock }) {
    const db = getDatabase()
    const ww = global.werewolfGames
    const prefix = m.prefix || config.command?.prefix || '.'
    
    // Find the game this player is in
    const chatId = Object.keys(ww).find(id => 
        ww[id].players.some(p => p.id === m.sender && p.alive) &&
        ww[id].phase === 'night'
    )
    
    if (!chatId) {
        return m.reply(`❌ You no currently in game werewolf or not the night phase!`)
    }
    
    const game = ww[chatId]
    const player = game.players.find(p => p.id === m.sender)
    if (!player || !player.alive) {
        return m.reply(`❌ You are already dead or not a player!`)
    }
    
    // Check if skill already used
    if (player.skillUsed) {
        return m.reply(`❌ You already use this night skill!`)
    }
    
    const cmd = m.command?.toLowerCase()
    const targetNum = parseInt(m.args?.[0])
    
    if (isNaN(targetNum)) {
        return m.reply(`❌ Enter number target! Example: \`${prefix}${cmd} 2\``)
    }
    
    const targetPlayer = game.players.find(p => p.number === targetNum && p.alive)
    if (!targetPlayer) {
        return m.reply(`❌ Target no valid or already dead!`)
    }
    
    // Process based on command and role
    if (cmd === 'wwkill' && player.role === 'werewolf') {
        if (targetPlayer.role === 'werewolf' || targetPlayer.role === 'sorcerer') {
            return m.reply(`❌ Cannot eliminate sethe same as team!`)
        }
        game.nightActions.kill = targetPlayer.id
        player.skillUsed = true
        await m.reply(
            `🐺 *TARGET TERPILIH*\n\n` +
            `Target: @${targetPlayer.id.split('@')[0]}\n` +
            `> Waiting night berakhir...`,
            { mentions: [targetPlayer.id] }
        )
        return true
    }
    
    if (cmd === 'wwprotect' && player.role === 'guarinan') {
        game.nightActions.protect = targetPlayer.id
        player.skillUsed = true
        await m.reply(
            `🛡️ *TARGET DILINDUNGI*\n\n` +
            `Melindungi: @${targetPlayer.id.split('@')[0]}\n` +
            `> Waiting night berakhir...`,
            { mentions: [targetPlayer.id] }
        )
        return true
    }
    
    if (cmd === 'wwsee' && player.role === 'seer') {
        const roleInfo = ROLES[targetPlayer.role]
        player.skillUsed = true
        await m.reply(
            `🔮 *HASIL PENGLIHATAN*\n\n` +
            `@${targetPlayer.id.split('@')[0]} is the:\n` +
            `${roleInfo.emoji} *${roleInfo.name}*\n\n` +
            `> Team: ${roleInfo.team === 'wolf' ? '🐺 Wolf' : '👨‍🌾 Village'}`,
            { mentions: [targetPlayer.id] }
        )
        return true
    }
    
    if (cmd === 'wwsorcerer' && player.role === 'sorcerer') {
        const isSeer = targetPlayer.role === 'seer'
        player.skillUsed = true
        await m.reply(
            `🧙 *HASIL INVESTIGASI*\n\n` +
            `@${targetPlayer.id.split('@')[0]}\n` +
            `${isSeer ? '✅ *is the SEER!*' : '❌ *not a Seer*'}\n\n` +
            `> Continuekan help Werewolf!`,
            { mentions: [targetPlayer.id] }
        )
        return true
    }
    
    // Wrong role for command
    return m.reply(`❌ You don't have this ability this!\n> Role you: ${ROLES[player.role]?.name || 'Unknown'}`)
}

module.exports = {
    config: pluginConfig,
    handler,
    nightActionHandler,
    ROLES,   // Export for other plugins
    getWWContextInfo  // Export for other plugins
}
