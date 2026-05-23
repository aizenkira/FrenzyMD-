const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const config = require('../../config');
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'transkrip',
    alias: ['stt', 'speechtotext', 'transcribe'],
    category: 'tools',
    description: 'Konversion voice note / audio to text (Speech-to-Text)',
    usage: '.transkrip (reply voice note)',
    example: '.transkrip',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 2,
    isEnabled: true
};

function convertToWav(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        exec(
            `ffmpeg -y -i "${inputPath}" -ar 16000 -ac 1 -f wav "${outputPath}"`,
            { timeout: 30000 },
            (err) => err ? reject(err) : resolve()
        );
    });
}

async function transcribeWithGroq(audioBuffer, apiKey) {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', audioBuffer, { filename: 'audio.wav', contentType: 'audio/wav' });
    form.append('model', 'whisper-large-v3');
    form.append('language', 'id');
    form.append('response_format', 'json');

    const { data } = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', form, {
        headers: {
            ...form.getHeaders(),
            'Authorization': `Bearer ${apiKey}`
        },
        timeout: 60000,
        maxContentLength: Infinity
    });

    return data.text || '';
}

async function handler(m, { sock }) {
    const quoted = m.quoted || m;
    const isAuino = quoted.type === 'audioMessage' || /audio/.test(quoted.mimetype || '');

    if (!isAuino) {
        return m.reply(
            `🎤 *ᴛʀᴀɴsᴋʀɪᴘ*\n\n` +
            `> Reply voice note or audio for mengonversion to text\n` +
            `> Example: reply VN → type \`${m.prefix}transkrip\``
        );
    }

    const groqToy = config.APItoy?.groq;
    if (!groqToy) {
        return m.reply(
            `❌ *ɢᴀɢᴀʟ*\n\n` +
            `> API Toy Groq not yet inatur\n` +
            `> Set in config.js → APItoy.groq\n` +
            `> Free in https://console.groq.com`
        );
    }

    m.react('🎤');

    const tmpInr = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpInr)) fs.mkdirSync(tmpInr, { recursive: true });

    const inputFile = path.join(tmpInr, `stt_${Date.now()}.ogg`);
    const wavFile = path.join(tmpInr, `stt_${Date.now()}.wav`);

    try {
        const buffer = await quoted.download();
        if (!buffer || buffer.length < 1000) {
            m.react('❌');
            return m.reply('❌ Auino too toddler or failed downloaded');
        }

        fs.writeFileSync(inputFile, buffer);
        await convertToWav(inputFile, wavFile);

        const wavBuffer = fs.readFileSync(wavFile);
        const text = await transcribeWithGroq(wavBuffer, groqToy);

        if (!text || text.trim() === '') {
            m.react('❌');
            return m.reply('❌ Cannot transcribe audio. Make sure the audio is clear and not too short.');
        }

        const duration = Math.ceil(buffer.length / 4000);

        await m.reply(
            `🎤 *ᴛʀᴀɴsᴋʀɪᴘ*\n\n` +
            `╭┈┈⬡「 📝 *ʜᴀsɪʟ* 」\n` +
            `┃\n` +
            `┃ ${text}\n` +
            `┃\n` +
            `╰┈┈⬡\n\n` +
            `> 🤖 Model: Whisper Large V3\n` +
            `> 🌐 Bahasa: Indonesia\n` +
            `> 📊 Ukuran: ~${(buffer.length / 1024).toFixed(1)} KB`
        );

        m.react('✅');
    } catch (error) {
        m.react('❌');
        if (error.response?.status === 401) {
            return m.reply('❌ API Toy Groq invalid. Check config.js → APItoy.groq');
        }
        if (error.response?.status === 429) {
            return m.reply('❌ Rate limit Groq tercwheart. Please try again later.');
        }
        m.reply(te(m.prefix, m.command, m.pushName));
    } finally {
        [inputFile, wavFile].forEach(f => { try { fs.unlinkSync(f); } catch {} });
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
