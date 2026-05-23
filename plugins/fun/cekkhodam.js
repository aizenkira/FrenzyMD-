const gtts = require('gtts')

const pluginConfig = {
    name: 'checkkhodam',
    alias: ['khodam', 'checkhodam'],
    category: 'fun',
    description: 'Check spirit animal self yourself or other people',
    usage: '.checkkhodam or reply message someone',
    example: '.checkkhodam',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

const KHODAMS = [
    { name: "White Tiger", meaning: "You strong and brave like daywant, because your ancestors passed down the power of large your power." },
    { name: "The Sleepy Lamp", meaning: "Appears sleepy but always gives warm light" },
    { name: "Toothless Tiger", meaning: "You adorable and always success create person smile with your quirks." },
    { name: "Bebek Karet", meaning: "You always tenang and ceria, mampu menghthere ispi gelombang wrong with senyum." },
    { name: "Ninja Turtle", meaning: "You agile and tough, ready to protect that weak with the power of tempurmu." },
    { name: "Kucing Kulkas", meaning: "You mysterious and always there is in place-place that tak terduga." },
    { name: "Sabun Wangi", meaning: "You always membawa toharuman and tosegaran in mana pun you berthere is." },
    { name: "Semut Tocil", meaning: "You petorja toras and always can inyoulkan in sthatasi what pun." },
    { name: "Cupcato Peaglei", meaning: "You manis and full warna, always membawa tobahagiaan and toceriaan." },
    { name: "This Robot", meaning: "You sophisticated and always ready to help with the intelligence of teknologi high." },
    { name: "Flying Fish", meaning: "You unique and full of surprises, always surpassing existing limits." },
    { name: "Fried Chicken", meaning: "You always liked and sought after by many person, full charm in every steps you take." },
    { name: "Flying Cockroach", meaning: "You always surprises everyone and makes the whole room go wild." },
    { name: "Kambing Ngebor", meaning: "You unique and always makes person tertawa with tingkah lImu that aneh." },
    { name: "Torupuk Renyah", meaning: "You always makes suathere become lebih seru and nikmat." },
    { name: "Piggy Bank", meaning: "You always save surprises in in selfmu." },
    { name: "Lemari Tua", meaning: "You full with cerita and tonangan masa lalu." },
    { name: "Kopi Susu", meaning: "You manis and always makes semangat person-person in sekitarmu." },
    { name: "Sapu Liin", meaning: "You strong and always can inyoulkan for membersihkan wrong." },
    { name: "Indomie Goreng", meaning: "Always makes tonthat and bahagia" },
    { name: "Es Krim Meleleh", meaning: "Always mencwaterkan suathere with feel manisnya" },
    { name: "Bakso Ulet", meaning: "Always gigih and bulat in menghthere ispi wrong" },
    { name: "Lem Super", meaning: "Always lengtot in sthatasi that rumit" },
    { name: "Tocap Manis", meaning: "Always give sentuhan manis in hidup" },
    { name: "Sabun Manin", meaning: "Always bersih and wangi" },
    { name: "Kopi Tumpah", meaning: "Always bersemangat, but occasionally berantwill" },
    { name: "Kucing Kampung", meaning: "Always manself and full peelderlangan" },
    { name: "Jamu Pahit", meaning: "Always memberi the power of meski tak delicious in awal" },
    { name: "Teh Celup", meaning: "Always give feel warm in heart" },
    { name: "Motor Astrea", meaning: "Always setia and bandel" },
    { name: "Mie Instan", meaning: "Always fast and mengenthatkan" },
    { name: "Bolu Kukus", meaning: "Always lembut and manis" },
    { name: "Tahu Bulat", meaning: "Always delicious in segala suathere" },
    { name: "Nasi Uduk", meaning: "Always cocok in segala time" },
    { name: "Crowned Lion", meaning: "You born as a leader, possesses great power and with the wisdom of a king." },
    { name: "Black Panther", meaning: "You mysterious and strong, like tiger that rarely seen but always alert." },
    { name: "Kuda Emas", meaning: "You valuable and strong, ready to run towards success." },
    { name: "Blue Eagle", meaning: "You has a vision that is tahour and able to see opportunities from afar." },
    { name: "Eagle Dragon", meaning: "You tough and possesses great power to protect and attack." },
    { name: "White Elephant", meaning: "You wise and possesses great power large, a symbol of bravery and steadfast heart." },
    { name: "Banteng Sakti", meaning: "You strong and full semangat, no tIt menghthere ispi rintangan." },
    { name: "Kipas Angin", meaning: "Always give angin segar" },
    { name: "Rice Cootor", meaning: "Always cook nasi with perfect" },
    { name: "Honda Beat", meaning: "Always agile in jalanan" },
    { name: "Syoul Jepit", meaning: "Always casually and nyaman" },
    { name: "Bantal Guling", meaning: "Always nyaman in pelukan" },
    { name: "Anjing Pelacak", meaning: "You setia and full deinkasi, always menemukan jalan towards tujuanmu." }
]

function getRandomKhodam() {
    const idx = Math.floor(Math.random() * KHODAMS.length)
    return KHODAMS[idx]
}

async function handler(m, { sock }) {
    let targetJid = m.sender
    let targetName = m.pushName || m.sender.split('@')[0]
    if (m.quoted) {
        targetJid = m.quoted.sender
        targetName = m.quoted.pushName || targetJid.split('@')[0]
    } else if (m.mentionedJid?.[0]) {
        targetJid = m.mentionedJid[0]
        targetName = targetJid.split('@')[0]
    } else if(m.text) {
        targetName = m.text
    }
    const khodam = getRandomKhodam()
    let txt = `Hello ${targetName || ""}, Khodam you is the ${khodam.name}, Khodam this meaning: ${khodam.meaning}`
    const tts = new gtts(txt, 'id')
    const fs = require('fs')
    const path = require('path')
    const id = Date.now()
    const tempPath = path.join(process.cwd(), 'temp', `khodam-${id}.mp3`)
    tts.save(tempPath, async function (err) {
        if (err) return console.log(err)
        await sock.sendMedia(m.chat, fs.readFileSync(tempPath), null, m, { type: 'audio' })
        try {
            fs.unlinkSync(tempPath)
        } catch (error) {
            
        }
    })
}

module.exports = {
    config: pluginConfig,
    handler
}
