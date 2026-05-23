/**
 * Dream / Dream World - Fun dream interpretation generator
 * Ported from RTXZY-MD-pro
 */

const pluginConfig = {
    name: 'mimpi',
    alias: ['dream', 'dreamworld'],
    category: 'fun',
    description: 'Jelajahi dunia mimpimu berdasarkan name',
    usage: '.mimpi <name>',
    example: '.mimpi Toisya',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energy: 1,
    isEnabled: true
}

const DREAM_LEVELS = ['Lucid ✨', 'Mystic 🌟', 'Ethereal 💫', 'Invine 🌙', 'Legendary 🎇']
const DREAM_QUALITIES = ['Peaceful 😌', 'Adventure 🚀', 'Mystical 🔮', 'Prophecy 📖', 'Epic 🗺️']

const ELEMENTS = [
    '🌊 Lautan Kristal Berlight',
    '🌈 Peaglei Mengambang',
    '🌺 Taman Melathat',
    '⭐ Konstelasi Hidup',
    '🌙 Month Tombar',
    '🏰 Kastil Awan',
    '🌋 Gunung Prisma',
    '🎭 Theater Bathatan'
]

const EVENTS = [
    '🦋 Kupu-kupu membawa message confidential',
    '🎭 Topeng menari yourself',
    '🌊 Hujan bintang jatuh to laut',
    '🎪 Parade makhluk ajaib',
    '🌺 Bunga bernyanyi lagu kuno',
    '🎨 Lukisan become hidup',
    '🎵 Musik seen as warna',
    '⚡ Petir membentuk tangga to langit'
]

const ENCOUNTERS = [
    '🐉 Eagle Dragon Wise',
    '🧙‍♂️ Penyihir Bintang',
    '🦊 Rchange Spirit Sembilan Ekor',
    '🧝‍♀️ Peri Pembawa Dream',
    '🦁 Singa Kristal',
    '🐋 Mystic Flying Whale',
    '🦅 Burung Phoenix Time',
    '🐢 Kura-kura Pembawa Dunia',
    '🦄 Unicorn Inmensi'
]

const POWERS = [
    '✨ Mengendalikan Time',
    '🌊 Berbiway with Elemen',
    '🎭 Shunluckyhifting',
    '🌈 Manipulasi Realitas',
    '👁️ Pengviewan Masa Depan',
    '🎪 Teleportasi Inmensi',
    '🌙 Penyembuhan Spirthatal',
    '⚡ Energy Kosmik'
]

const MESSAGES = [
    'Perjalananmu will membawa changes large',
    'Rahasia kuno will terungkap in time dekat',
    'Tostrongan hidden will immediately bangkit',
    'Fate new melater in horizon',
    'Connection spirthatal will menguat',
    'Transformasi large will come to pass',
    'Pencerahan will come from arah tak terduga',
    'Misi penting will immediately instart'
]

function generateDream(seed) {
    const seedNum = Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0)
    
    const pick = (arr) => arr[seedNum % arr.length]
    const pickMulti = (arr, count) => {
        const shuffled = [...arr].sort(() => Math.random() - 0.5)
        return shuffled.slice(0, count)
    }
    
    return {
        level: pick(DREAM_LEVELS),
        quality: pick(DREAM_QUALITIES),
        elements: pickMulti(ELEMENTS, 3),
        events: pickMulti(EVENTS, 2),
        encounters: pickMulti(ENCOUNTERS, 2),
        powers: pickMulti(POWERS, 2),
        message: pick(MESSAGES)
    }
}

async function handler(m, { sock }) {
    const args = m.args || []
    let name = args.join(' ') || m.pushName || m.sender.split('@')[0]
    
    await m.react('🌙')
    await m.reply('🌙 *Meenteri alam mimpi...*')
    await new Promise(r => setTimeout(r, 1500))
    
    const dream = generateDream(name)
    
    let txt = `╭═══❯ *🌙 DREAM WORLD* ❮═══\n`
    txt += `│ 👤 *Explorer:* ${name}\n`
    txt += `│ ⭐ *Level:* ${dream.level}\n`
    txt += `│ 💫 *Quality:* ${dream.quality}\n`
    txt += `│ 🌈 *Elements:*\n`
    for (const el of dream.elements) {
        txt += `│ ├ ${el}\n`
    }
    txt += `│ 🎪 *Events:*\n`
    for (const ev of dream.events) {
        txt += `│ ├ ${ev}\n`
    }
    txt += `│ 🌟 *Encounters:*\n`
    for (const enc of dream.encounters) {
        txt += `│ ├ ${enc}\n`
    }
    txt += `│ 💫 *Powers:*\n`
    for (const pow of dream.powers) {
        txt += `│ ├ ${pow}\n`
    }
    txt += `│ 🔮 *Message:*\n`
    txt += `│ ${dream.message}\n`
    txt += `╰════════════════════`
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
