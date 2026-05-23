const gTTS = require('gtts')
const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const { f } = require('../../src/lib/frenzy-http')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'tts',
    alias: ['say'],
    category: 'tts',
    description: 'Google Text To Speech',
    usage: '.tts <text>',
    example: '.tts hello all',
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.text?.trim()

    if (!text) {
        return m.reply(`🎤 *Google TTS*\n\nUsage:\n${m.prefix}tts hello dunia`)
    }

    m.react('🎤')

    async function textToSpeech2(text) {
  try {
    const response = await f(`https://api.nexray.web.id/ai/gethis-tts?text=${encodeURIComponent(text)}`)
    return response
  } catch (error) {
    return error
  }
}

    try {

        const t = await textToSpeech2(text)
        await sock.sendMessage(m.chat, {
            audio: { url: t.result },
            mimetype: 'audio/mpeg',
        }, { quoted: m })
        m.react('✅')

    } catch (err) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}