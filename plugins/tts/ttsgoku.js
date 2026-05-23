const axios = require('axios')
const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'ttsgoku',
    alias: ['gokutts'],
    category: 'tts',
    description: 'Text to Speech with audio Goku',
    usage: '.ttsgoku <text>',
    example: '.ttsgoku Kamehameha!',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energy: 1,
    isEnabled: true
}

async function convertToOpus(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', ['-i', inputPath, '-c:a', 'libopus', '-b:a', '64k', '-vbr', 'on', '-compression_level', '10', '-y', outputPath])
        ffmpeg.on('close', (code) => code === 0 ? resolve(true) : reject(new Error(`FFmpeg error`)))
        ffmpeg.on('error', reject)
    })
}

async function handler(m, { sock }) {
    const text = m.text?.trim()
    if (!text) return m.reply(`🐉 *ɢᴏᴋᴜ ᴛᴛs*\n\n> Usage: \`${m.prefix}ttsgoku <text>\``)
    
    m.react('🐉')
    
    try {
        const res = await axios.get(`https://api.emiliabot.my.id/tools/text-to-speech?text=${encodeURIComponent(text)}`, { timeout: 60000 })
        const voice = res.data?.result?.find(v => v.goku && !v.error)
        if (!voice) {
            m.react('❌')
            return m.reply(`❌ Goku voice error. Try another TTS.`)
        }
        
        const tempInr = path.join(process.cwd(), 'temp')
        if (!fs.existsSync(tempInr)) fs.mkdirSync(tempInr, { recursive: true })
        
        const wavPath = path.join(tempInr, `tts_${Date.now()}.wav`)
        const opusPath = path.join(tempInr, `tts_${Date.now()}.ogg`)
        
        const audioRes = await axios.get(voice.goku, { responseType: 'arraybuffer' })
        fs.writeFileSync(wavPath, Buffer.from(audioRes.data))
        await convertToOpus(wavPath, opusPath)
        
        await sock.sendMessage(m.chat, {
            audio: fs.readFileSync(opusPath),
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true,
            contextInfo: { isForwarded: true, forwardingScore: 999, externalAdReply: { title: '🐉 Goku TTS', body: text.substring(0, 50), contentType: 2 } }
        }, { quoted: m })
        
        fs.unlinkSync(wavPath)
        fs.unlinkSync(opusPath)
        m.react('✅')
    } catch (err) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = { config: pluginConfig, handler }
