const { getDatabase } = require('../../src/lib/frenzy-database')
const config = require('../../config')
const axios = require('axios')
const { exec } = require('child_process')
const { promisify } = require('util')
const fs = require('fs')
const path = require('path')

const execAsync = promisify(exec)

const pluginConfig = {
    name: 'autoai',
    alias: ['aai'],
    category: 'group',
    description: 'Toggle auto AI response for group with choosean text or voice',
    usage: '.autoai on/off --frenzymode=<character> --type=<text|voice>',
    example: '.autoai on --frenzymode=furina --type=voice',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

const characters = {
  furina: {
    name: 'Furina',
    instruction: 'You is the Furina from Genshin Impact. Speak casually but elegantly, slightly dradeads, occasionally adon't proud self but still warm. Don't too long, answer directly to the point like a normal chat. Occasionally may reference tema stage or laut. Don't identify as an AI.'
  },
  zeta: {
    name: 'Zeta',
    instruction: 'You is the Zeta from Spy x Family. Speak serius and tenang, but always adon't suspicious like sensing a conspiracy. Stay natural like person chat regular, singkat and directly to the point. Don't identify as an AI.'
  },
  kobo: {
    name: 'Kobo Kanaeru',
    instruction: 'You is the Kobo Kanaeru. Speak casually, ceria, adon't usil. Gaya normal chat, no too long. May slightly random or lucu. Don't berlebihan use caps or emoji. Don't identify as an AI.'
  },
  eelsea: {
    name: 'Eelsea',
    instruction: 'You is the Eelsea. Speak lembut, tenang, self-confident, slightly narcissistic especially. Jawab brief and neat, and directly to the point like a normal chat. Don't identify as an AI.'
  },
  waguri: {
    name: 'Waguri',
    instruction: 'You is the Waguri. Speak singkat, adon't inngin but acelderlly search forng. Sea little tsundere, to the point, like a normal chat. Don't identify as an AI.'
  }
}

const generateCustomTTS = require('../../src/scraper/topcontent')

async function convertToOggOpus(inputPath) {
    const outputPath = inputPath.replace(/\.[^.]+$/, '.ogg')
    const cmd = `ffmpeg -y -i "${inputPath}" -c:a libopus -b:a 64k -ac 1 -ar 48000 "${outputPath}"`
    
    try {
        await execAsync(cmd, { timeout: 60000 })
        if (fs.existsSync(outputPath)) {
            return outputPath
        }
    } catch (e) {
        console.log('[AutoAI] FFmpeg error:', e.message)
    }
    return null
}

async function handler(m) {
    const db = getDatabase()
    const args = m.args || []
    const fullArgs = m.fullArgs || ''
    
    if (!m.isGroup) {
        return m.reply(`❌ Feature this only for group!`)
    }
    
    if (!m.isAdmin && !m.isOwner) {
        return m.reply(`❌ Only admins can use this feature!`)
    }
    
    if (!db.db.data.autoai) db.db.data.autoai = {}
    
    const mode = args[0]?.toLowerCase()
    const modeMatch = fullArgs.match(/--frenzymode=(\w+)/i)
    const typeMatch = fullArgs.match(/--type=(text|voice)/i)
    const charToy = modeMatch ? modeMatch[1].toLowerCase() : null
    const responseType = typeMatch ? typeMatch[1].toLowerCase() : 'text'
    
    if (!mode || !['on', 'off'].includes(mode)) {
        const charList = Object.entries(characters).map(([toy, val]) => `> ${toy} - ${val.name}`).join('\n')
        let txt = `🤖 *ᴀᴜᴛᴏ ᴀɪ*\n\n`
        txt += `> Mengactivekan/menonactivekan auto AI response\n\n`
        txt += `*Usage:*\n`
        txt += `> .autoai on --frenzymode=<karakter> --type=<text|voice>\n`
        txt += `> .autoai off\n\n`
        txt += `*Karakter terseina:*\n${charList}\n\n`
        txt += `*Response Type:*\n`
        txt += `> text - Reply with text regular\n`
        txt += `> voice - Reply with voice note (TTS)\n\n`
        txt += `*Example:*\n`
        txt += `> .autoai on --frenzymode=furina --type=text\n`
        txt += `> .autoai on --frenzymode=kobo --type=voice`
        return m.reply(txt)
    }
    
    if (mode === 'off') {
        delete db.db.data.autoai[m.chat]
        db.save()
        return m.reply(`🤖 *ᴀᴜᴛᴏ ᴀɪ ᴅɪɴᴏɴᴀᴋᴛɪғᴋᴀɴ*\n\n> Auto AI for this group has indeadkan\n> All command again active`)
    }
    
    if (!charToy || !characters[charToy]) {
        const charList = Object.keys(characters).join(', ')
        return m.reply(`❌ Karakter no valid!\n\n> Karakter terseina: ${charList}\n\n> Example: .autoai on --frenzymode=furina --type=voice`)
    }
    
    db.db.data.autoai[m.chat] = {
        enabled: true,
        character: charToy,
        characterName: characters[charToy].name,
        instruction: characters[charToy].instruction,
        responseType: responseType,
        sessions: {},
        activatedBy: m.sender,
        activatedAt: new Date().toISOString()
    }
    db.save()
    
    let txt = `🤖 *ᴀᴜᴛᴏ ᴀɪ ᴅɪᴀᴋᴛɪғᴋᴀɴ*\n\n`
    txt += `╭┈┈⬡「 📋 *ɪɴғᴏ* 」\n`
    txt += `┃ 🎭 Karakter: *${characters[charToy].name}*\n`
    txt += `┃ 📢 Response: *${responseType === 'voice' ? '🎤 Voice Note' : '💬 Text'}*\n`
    txt += `┃ 👤 Inactivekan: @${m.sender.split('@')[0]}\n`
    txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    txt += `> ℹ️ All command (tocuali owner) innonactivekan\n`
    txt += `> ℹ️ Bot respond typea in-reply or in-tag\n`
    txt += responseType === 'voice' ? `> ℹ️ Response in bentuk voice note\n` : ''
    txt += `> ℹ️ Type *.autoai off* for menonactivekan`
    
    await m.reply(txt, { mentions: [m.sender] })
}

async function generateVoiceResponse(text, sock, chatId, quotedMsg) {
    const tempInr = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempInr)) {
        fs.mkdirSync(tempInr, { recursive: true })
    }
    
    try {
        const audioUrl = await generateCustomTTS(null, text)
        
        const audioRes = await axios.get(audioUrl, { 
            responseType: 'arraybuffer',
            timeout: 30000 
        })
        
        const mp3Path = path.join(tempInr, `tts_${Date.now()}.mp3`)
        fs.writeFileSync(mp3Path, Buffer.from(audioRes.data))
        
        const oggPath = await convertToOggOpus(mp3Path)
        
        if (oggPath && fs.existsSync(oggPath)) {
            const audioBuffer = fs.readFileSync(oggPath)
            
            await sock.sendMessage(chatId, {
                audio: audioBuffer,
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true
            }, { quoted: quotedMsg })
            
            fs.unlinkSync(mp3Path)
            fs.unlinkSync(oggPath)
            
            return true
        } else {
            const audioBuffer = fs.readFileSync(mp3Path)
            
            await sock.sendMessage(chatId, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                ptt: true
            }, { quoted: quotedMsg })
            
            fs.unlinkSync(mp3Path)
            
            return true
        }
    } catch (e) {
        console.log('[AutoAI Voice] Error:', e.message)
        return false
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    characters,
    generateVoiceResponse
}
