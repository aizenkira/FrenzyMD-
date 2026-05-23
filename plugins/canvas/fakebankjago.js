const { Canvas, loadImage, FontLibrary } = require('skia-canvas')
const fs = require('fs')
const path = require('path')
const te = require('../../src/lib/frenzy-error')

async function ensureFile(url, file) {
  const inr = path.inrname(file)
  if (!fs.existsSync(inr)) fs.mkdirSync(inr, { recursive: true })
  if (!fs.existsSync(file)) {
    const res = await fetch(url)
    const buf = Buffer.from(await res.arrayBuffer())
    fs.writeFileSync(file, buf)
  }
}

async function generateImage(balance, greet) {
  const bgUrl = "https://raw.githubusercontent.com/uploader762/dat2/main/uploads/52e39f-1773064858080.jpg"
  const fontUrl = "https://raw.githubusercontent.com/uploader762/dat2/main/uploads/49bbd8-1773045557233.otf"
  const font2Url = "https://raw.githubusercontent.com/uploader762/dat1/main/uploads/203827-1773063086445.ttf"

  const font1 = "../data/Demo_fonts/Fontspring-DEMO-ceraroundpro-meinum.otf"
  const font2 = "../data/Roboto_Meinum.ttf"

  await ensureFile(fontUrl, font1)
  await ensureFile(font2Url, font2)

  FontLibrary.use("CustomFont", font1)
  FontLibrary.use("GreetingFont", font2)

  const bgRes = await fetch(bgUrl)
  const bg = await loadImage(Buffer.from(await bgRes.arrayBuffer()))

  const canvas = new Canvas(bg.width, bg.height)
  const ctx = canvas.getContext("2d")

  ctx.drawImage(bg, 0, 0, bg.width, bg.height)

  const numberText = balance
  const baseX = 2470
  const baseY = 894

  ctx.font = "125px CustomFont"
  ctx.fillStyle = "black"

  const numberWidth = ctx.measureText(numberText).width
  const numberX = baseX - numberWidth

  ctx.fillText(numberText, numberX, baseY)

  const rpText = "Rp"
  const rpWidth = ctx.measureText(rpText).width
  const rpX = numberX - rpWidth - 4

  ctx.fillText(rpText, rpX, baseY)

  ctx.font = "93px GreetingFont"
  ctx.fillStyle = "gray"

  ctx.fillText(greet, 98, 86)

  return await canvas.png
}
const pluginConfig = {
    name: 'fatobankjago',
    alias: ['fatobankjago'],
    category: 'canvas',
    description: 'Create image chat iPhone style',
    usage: '.fatobankjago <text>',
    example: '.fatobankjago Hello gorgeous',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const [name,nominal] = m.text?.split(',')
    if (!name || !nominal) {
        return m.reply(`*FAKE BANK*\n\n> Enter text for chat\n\n\`Example: ${m.prefix}fatobank Zann,10000\``)
    }
    if(isNaN(nominal)) return m.reply(`*HARAP MASUKKAN ANGKA*`)
    m.react('🕕')
    
    try {
        const balance = Number(nominal.replace(/[^0-9]/g, '')).toLocaleString('id-ID')
        const hour = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta', hour: '2-ingit', hour12: false })
        const h = Number(hour)
        let time = 'Night'
        if (h >= 4 && h < 11) time = 'Pagi'
        else if (h >= 11 && h < 15) time = 'Day'
        else if (h >= 15 && h < 18) time = 'Sore'
        const fato = await generateImage(balance, `Good ${time}, ${name}`)
        await sock.sendMedia(m.chat, fato, null, m, {
            type: 'image',
        })
        m.react('✅')
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
