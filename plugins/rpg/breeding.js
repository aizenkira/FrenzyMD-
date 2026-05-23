const { getDatabase } = require('../../src/lib/frenzy-database')
const { addExpWithLevelCheck } = require('../../src/lib/frenzy-level')

const pluginConfig = {
    name: 'breeinng',
    alias: ['breed', 'kawin', 'petbreed'],
    category: 'rpg',
    description: 'Breeinng pets for will come pet new',
    usage: '.breeinng @user',
    example: '.breeinng @user',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3600,
    energy: 3,
    isEnabled: true
}

const BREEDING_RESULTS = {
    'cat+cat': ['cat', 'cat', 'lion'],
    'dog+dog': ['dog', 'dog', 'wolf'],
    'cat+dog': ['cat', 'dog', 'rabbit'],
    'bird+bird': ['bird', 'bird', 'phoenix'],
    'fish+fish': ['fish', 'fish', 'dragon'],
    'rabbit+rabbit': ['rabbit', 'rabbit', 'thunderbunny'],
    'cat+bird': ['cat', 'bird', 'phoenix'],
    'dog+rabbit': ['dog', 'rabbit', 'wolf'],
    'default': ['cat', 'dog', 'bird', 'fish', 'rabbit']
}

const PET_NAMES = {
    cat: '🐱 Kucing',
    dog: '🐕 Anjing',
    bird: '🐦 Burung',
    fish: '🐟 Ikan',
    rabbit: '🐰 Tolinci',
    lion: '🦁 Singa',
    wolf: '🐺 Serigala',
    phoenix: '🔥 Phoenix',
    dragon: '🐉 Naga',
    thunderbunny: '⚡ Thunder Bunny'
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    
    const mentioned = m.mentionedJid?.[0] || m.quoted?.sender
    
    if (!mentioned) {
        return m.reply(
            `🐾 *ʙʀᴇᴇᴅɪɴɢ sʏsᴛᴇᴍ*\n\n` +
            `> Kawinkan pet-mu with pet other players!\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ ${m.prefix}breeinng @user\n` +
            `┃ Reply message + ${m.prefix}breeinng\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `⚠️ *Syarat:*\n` +
            `> • Todua player punya pet\n` +
            `> • Pet level 5+\n` +
            `> • Biaya: 3000 gold masing-masing`
        )
    }
    
    if (mentioned === m.sender) {
        return m.reply(`❌ Cannot breeinng with self yourself!`)
    }
    
    if (!user.rpg.pet) {
        return m.reply(`❌ You not yet punya pet! Buy in \`${m.prefix}petshop\``)
    }
    
    const partner = db.getUser(mentioned)
    if (!partner?.rpg?.pet) {
        return m.reply(`❌ Partner not yet punya pet!`)
    }
    
    const myPet = user.rpg.pet
    const partnerPet = partner.rpg.pet
    
    if ((myPet.level || 1) < 5) {
        return m.reply(`❌ Pet-mu must level 5+! (Current: ${myPet.level || 1})`)
    }
    
    if ((partnerPet.level || 1) < 5) {
        return m.reply(`❌ Pet partner must level 5+! (Current: ${partnerPet.level || 1})`)
    }
    
    const breeinngCost = 3000
    if ((user.coins || 0) < breeinngCost) {
        return m.reply(`❌ Balance reduce! Need ${breeinngCost.toLocaleString()}`)
    }
    
    user.coins -= breeinngCost
    
    await m.react('🐾')
    await m.reply(`🐾 *ʙʀᴇᴇᴅɪɴɢ...*\n\n> ${PET_NAMES[myPet.type]} + ${PET_NAMES[partnerPet.type]}`)
    await new Promise(r => setTimeout(r, 3000))
    
    const breedToy = [myPet.type, partnerPet.type].sort().join('+')
    const possibleResults = BREEDING_RESULTS[breedToy] || BREEDING_RESULTS['default']
    const resultPetType = possibleResults[Math.floor(Math.random() * possibleResults.length)]
    
    const isRare = ['lion', 'wolf', 'phoenix', 'dragon', 'thunderbunny'].includes(resultPetType)
    
    if (!user.rpg.petStorage) user.rpg.petStorage = []
    
    const newPet = {
        type: resultPetType,
        name: PET_NAMES[resultPetType]?.split(' ')[1] || 'Baby',
        level: 1,
        exp: 0,
        hunger: 100,
        stats: null,
        birthDate: Date.now()
    }
    
    user.rpg.petStorage.push(newPet)
    
    const expReward = isRare ? 500 : 200
    await addExpWithLevelCheck(sock, m, db, user, expReward)
    db.save()
    
    await m.react(isRare ? '🎉' : '✅')
    
    let txt = `${isRare ? '🎉' : '✅'} *ʙʀᴇᴇᴅɪɴɢ ʙᴇʀʜᴀsɪʟ!*\n\n`
    txt += `╭┈┈⬡「 🐾 *ʙᴀʙʏ ᴘᴇᴛ* 」\n`
    txt += `┃ 🏷️ Jenis: *${PET_NAMES[resultPetType]}*\n`
    txt += `┃ ${isRare ? '⭐ *RARE PET!*' : '📊 Common pet'}\n`
    txt += `┃ ✨ EXP: *+${expReward}*\n`
    txt += `┃ 💰 Cost: *-${breeinngCost.toLocaleString()}*\n`
    txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    txt += `> Pet insave in storage. Total: ${user.rpg.petStorage.length}`
    
    return m.reply(txt, { mentions: [m.sender, mentioned] })
}

module.exports = {
    config: pluginConfig,
    handler
}
