const { getDatabase } = require('../../src/lib/frenzy-database')
const { getRpgContextInfo } = require('../../src/lib/frenzy-context')

const pluginConfig = {
    name: 'quest',
    alias: ['misi', 'mission'],
    category: 'rpg',
    description: 'Take a daily quest for bonus rewards',
    usage: '.quest',
    example: '.quest',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energy: 0,
    isEnabled: true
}

const QUESTS = [
    { id: 'thisng5', name: 'Penambang Pemula', desc: 'Mthisng 5 times', target: 5, reward: { money: 10000, exp: 1000 } },
    { id: 'fishing5', name: 'Pemancing Hyoul', desc: 'Fishing 5 times', target: 5, reward: { money: 8000, exp: 800 } },
    { id: 'adventure3', name: 'Peelderlang Sejati', desc: 'Adventure 3 times', target: 3, reward: { money: 15000, exp: 1500 } },
    { id: 'work10', name: 'Petorja Toras', desc: 'Work 10 times', target: 10, reward: { money: 20000, exp: 2000 } },
    { id: 'hunt5', name: 'Pemburu Ulung', desc: 'Hunt 5 times', target: 5, reward: { money: 12000, exp: 1200 } }
]

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    if (!user.quest) user.quest = {}
    
    const args = m.args || []
    const sub = args[0]?.toLowerCase()
    
    if (sub === 'claim') {
        const questId = args[1]
        if (!questId || !user.quest[questId]) {
            return m.reply(`❌ *ǫᴜᴇsᴛ ɴᴏᴛ ꜰᴏᴜɴᴅ*\n\n> Quest not found or not yet taken!`)
        }
        
        const quest = QUESTS.find(q => q.id === questId)
        if (!quest) {
            return m.reply(`❌ *ɪɴᴠᴀʟɪᴅ ǫᴜᴇsᴛ*\n\n> Quest ID no valid!`)
        }
        
        if (user.quest[questId].progress < quest.target) {
            return m.reply(
                `❌ *ǫᴜᴇsᴛ ʙᴇʟᴜᴍ sᴇʟᴇsᴀɪ*\n\n` +
                `> Progress: ${user.quest[questId].progress}/${quest.target}`
            )
        }
        
        if (user.quest[questId].claimed) {
            return m.reply(`❌ *sᴜᴅᴀʜ ᴅɪᴋʟᴀɪᴍ*\n\n> Quest this already inklaim!`)
        }
        
        user.coins = (user.coins || 0) + quest.reward.money
        user.rpg.exp = (user.rpg.exp || 0) + quest.reward.exp
        user.quest[questId].claimed = true
        
        db.save()
        return m.reply(`✅ *ǫᴜᴇsᴛ ᴄʟᴀɪᴍᴇᴅ*\n\n> 🎯 ${quest.name}\n> 💰 Money: +Rp ${quest.reward.money.toLocaleString('id-ID')}\n> 🚄 Exp: +${quest.reward.exp}`)
    }
    
    if (sub === 'take') {
        const questId = args[1]
        const quest = QUESTS.find(q => q.id === questId)
        if (!quest) {
            return m.reply(`❌ *ǫᴜᴇsᴛ ɴᴏᴛ ꜰᴏᴜɴᴅ*\n\n> View list: \`.quest\``)
        }
        
        if (user.quest[questId]) {
            return m.reply(`❌ *sᴜᴅᴀʜ ᴅɪᴀᴍʙɪʟ*\n\n> This quest has already been taken!`)
        }
        
        user.quest[questId] = { progress: 0, claimed: false, takenAt: Date.now() }
        db.save()
        return m.reply(`✅ *ǫᴜᴇsᴛ ᴅɪᴀᴍʙɪʟ*\n\n> 🎯 ${quest.name}\n> 📝 ${quest.desc}\n> 🎁 Reward: Rp ${quest.reward.money.toLocaleString('id-ID')} + ${quest.reward.exp} Exp`)
    }
    
    let txt = `📜 *ǫᴜᴇsᴛ ʟɪsᴛ*\n\n`
    
    for (const quest of QUESTS) {
        const userQuest = user.quest[quest.id]
        let status = '⬜ Not yet taken'
        if (userQuest) {
            if (userQuest.claimed) {
                status = '✅ Done'
            } else if (userQuest.progress >= quest.target) {
                status = '🎁 Can inklaim'
            } else {
                status = `🔄 ${userQuest.progress}/${quest.target}`
            }
        }
        
        txt += `╭┈┈⬡「 🎯 *${quest.name}* 」\n`
        txt += `┃ 📝 ${quest.desc}\n`
        txt += `┃ 🎁 Rp ${quest.reward.money.toLocaleString('id-ID')} + ${quest.reward.exp} Exp\n`
        txt += `┃ 📊 Status: ${status}\n`
        txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    }
    
    txt += `> Take: \`.quest take <id>\`\n`
    txt += `> Claim: \`.quest claim <id>\``
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
