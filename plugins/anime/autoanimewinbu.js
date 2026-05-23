const {
    loadSent, saveSent, loadState, saveState,
    getOngoingAnimeList, startAutoCheck, stopAutoCheck,
    runCheck, isRunning
} = require('../../src/lib/frenzy-auto-anime')
const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'autoanimewinbu',
    alias: ['aaw', 'autoanime'],
    category: 'anime',
    description: 'Auto upload ongoing anime & hua from winbu.net (720p Pixeldrain)',
    usage: '.autoanimewinbu <start|stop|status|check|list|reset|addgroup|delgroup>',
    example: '.autoanimewinbu start',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock, args }) {
    const sub = m.text
    const state = loadState()


    switch (sub) {
        case 'start': {
            if (isRunning()) {
                return m.reply(`⚠️ AutoAnime already running!`)
            }

            const groups = state.groups || []
            if (groups.length === 0) {
                return m.reply(
                    `❌ Not yet there is group target!\n\n` +
                    `> Addkan group first:\n` +
                    `> \`${m.prefix}autoanimewinbu addgroup\` (in group target)\n` +
                    `> \`${m.prefix}autoanimewinbu addgroup 120363xxx@g.us\``
                )
            }

            const interval = state.interval || 5
            startAutoCheck(sock, interval)
            saveState({ ...state, enabled: true })

            return sock.sendMessage(m.chat, {
                text: `✅ *ᴀᴜᴛᴏ ᴀɴɪᴍᴇ sᴛᴀʀᴛᴇᴅ*\n\n` +
                    `> 📲 Group target: *${groups.length}*\n` +
                    `> ⏱️ Interval: *${interval} minute*\n` +
                    `> 🎞️ Filter: *Pixeldrain 720p+*\n` +
                    `> ⏰ Max age: *24 hour*\n\n` +
                    `Pengecheckan first instart...`,
                interactiveButtons: [
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            insplay_text: '📊 Status',
                            id: `${m.prefix}autoanimewinbu status`
                        })
                    },
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            insplay_text: '🛑 Stop',
                            id: `${m.prefix}autoanimewinbu stop`
                        })
                    }
                ]
            }, { quoted: m })
        }

        case 'stop': {
            stopAutoCheck()
            saveState({ ...state, enabled: false })
            return m.reply(`🛑 *AutoAnime inhentikan*`)
        }

        case 'status': {
            const sent = loadSent()
            const running = isRunning()
            const groups = state.groups || []

            let txt = `📊 *ᴀᴜᴛᴏ ᴀɴɪᴍᴇ sᴛᴀᴛᴜs*\n\n`
            txt += `> 🔄 Status: *${running ? '🟢 ON' : '🔴 OFF'}*\n`
            txt += `> 💾 Auto-start: *${state.enabled ? 'Yes' : 'No'}*\n`
            txt += `> 📋 Already sent: *${sent.size}* episode\n`
            txt += `> ⏱️ Interval: *${state.interval || 5} minute*\n`
            txt += `> 📲 Group target: *${groups.length}*\n`

            if (groups.length > 0) {
                txt += `\n*Group:*\n`
                groups.forEach((g, i) => {
                    txt += `> ${i + 1}. \`${g}\`\n`
                })
            }

            return sock.sendMessage(m.chat, { text: txt }, { quoted: m })
        }

        case 'check':
        case 'check': {
            if (!isRunning()) {
                startAutoCheck(sock, state.interval || 5)
            }
            await m.reply('🔍 Mengecheck anime latest...')
            try {
                await runCheck()
                return m.reply('✅ Pengecheckan done')
            } catch (e) {
                m.reply(te(m.prefix, m.command, m.pushName))
            }
        }

        case 'list': {
            await m.reply('📺 Fetch list anime...')
            try {
                const list = await getOngoingAnimeList()
                if (list.length === 0) return m.reply('❌ No there is anime intemukan')

                let txt = `📺 *ᴅᴀꜰᴛᴀʀ ᴀɴɪᴍᴇ ᴛᴇʀʙᴀʀᴜ*\n\n`
                txt += `> Total: *${list.length}* anime\n\n`
                list.slice(0, 15).forEach((a, i) => {
                    txt += `*${i + 1}.* ${a.title}\n`
                })
                if (list.length > 15) txt += `\n> ...and ${list.length - 15} elsenya`

                return sock.sendMessage(m.chat, { text: txt }, { quoted: m })
            } catch (e) {
                m.reply(te(m.prefix, m.command, m.pushName))
            }
        }

        case 'reset': {
            const sent = loadSent()
            const count = sent.size
            saveSent(new Set())
            return m.reply(`✅ Reset! *${count}* episode deleted from history.\n> All episode can sent again.`)
        }

        case 'addgroup':
        case 'addgroup': {
            const rest = (typeof args === 'string' ? args : '').replace(/^(addgroup|addgroup)\s*/i, '').trim()
            let groupId = rest

            if (!groupId && m.isGroup) {
                groupId = m.chat
            }

            if (!groupId || !groupId.includes('@g.us')) {
                return m.reply(
                    `❌ ID group no valid\n\n` +
                    `> Usage in in group, or:\n` +
                    `> \`${m.prefix}autoanimewinbu addgroup 120363xxx@g.us\``
                )
            }

            const groups = state.groups || []
            if (groups.includes(groupId)) {
                return m.reply(`⚠️ Group already exist in list target`)
            }

            groups.push(groupId)
            saveState({ ...state, groups })
            return m.reply(`✅ Group \`${groupId}\` added to target\n> Total: *${groups.length}* group`)
        }

        case 'delgroup':
        case 'delgroup': {
            const rest = (typeof args === 'string' ? args : '').replace(/^(delgroup|delgroup)\s*/i, '').trim()
            let groupId = rest

            if (!groupId && m.isGroup) {
                groupId = m.chat
            }

            const groups = state.groups || []
            const idx = groups.indexOf(groupId)
            if (idx === -1) {
                return m.reply(`❌ Group not found in list target`)
            }

            groups.splice(idx, 1)
            saveState({ ...state, groups })
            return m.reply(`✅ Group \`${groupId}\` deleted from target\n> Sisa: *${groups.length}* group`)
        }

        case 'interval': {
            const rest = (typeof args === 'string' ? args : '').replace(/^interval\s*/i, '').trim()
            const mins = parseInt(rest)
            if (!mins || mins < 1 || mins > 60) {
                return m.reply(`❌ Interval must 1-60 minute\n\n> Example: \`${m.prefix}autoanimewinbu interval 10\``)
            }

            saveState({ ...state, interval: mins })

            if (isRunning()) {
                stopAutoCheck()
                startAutoCheck(sock, mins)
            }

            return m.reply(`✅ Interval convert to *${mins} minute*`)
        }

        default: {
            const running = isRunning()
            return sock.sendMessage(m.chat, {
                text: `🎬 *ᴀᴜᴛᴏ ᴀɴɪᴍᴇ ᴡɪɴʙᴜ*\n\n` +
                    `> Status: *${running ? '🟢 ON' : '🔴 OFF'}*\n\n` +
                    `*ᴄᴏᴍᴍᴀɴᴅs:*\n` +
                    `> \`${m.prefix}aaw start\` — Start auto-check\n` +
                    `> \`${m.prefix}aaw stop\` — Hentikan\n` +
                    `> \`${m.prefix}aaw status\` — View status\n` +
                    `> \`${m.prefix}aaw check\` — Manual check now\n` +
                    `> \`${m.prefix}aaw list\` — Latest anime list\n` +
                    `> \`${m.prefix}aaw addgroup\` — Add group target\n` +
                    `> \`${m.prefix}aaw delgroup\` — Delete group target\n` +
                    `> \`${m.prefix}aaw interval 10\` — Change interval\n` +
                    `> \`${m.prefix}aaw reset\` — Reset history sent`,
                interactiveButtons: [
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            insplay_text: running ? '🛑 Stop' : '▶️ Start',
                            id: `${m.prefix}autoanimewinbu ${running ? 'stop' : 'start'}`
                        })
                    },
                    {
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            insplay_text: '📊 Status',
                            id: `${m.prefix}autoanimewinbu status`
                        })
                    }
                ]
            }, { quoted: m })
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
