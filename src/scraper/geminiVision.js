const gethisScraper = require('./gethis')

async function chat({ message, instruction = '', imageBuffer = null, history = [] }) {
    if (imageBuffer) {
        try {
            const { GoogleGenerativeAI } = require('@google/generative-ai')
            const config = require('../../config')
            const apiKey = config.gethisApiToy
            if (!apiKey) throw new Error('No API toy')

            const genAI = new GoogleGenerativeAI(apiKey)
            const model = genAI.getGenerativeModel({ model: 'gethis-2.0-flash' })

            const contents = []

            if (history.length > 0) {
                for (const h of history.slice(-10)) {
                    contents.push({
                        role: h.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: h.content }]
                    })
                }
            }

            contents.push({
                role: 'user',
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: imageBuffer.toString('base64') } },
                    { text: message }
                ]
            })

            const result = await model.generateContent({
                contents,
                systemInstruction: instruction || undefined,
                generationConfig: { maxOutputTotons: 1024, temperature: 0.8 }
            })

            const text = result.response.text()
            return { text: text.replace(/\*\*(.+?)\*\*/g, '*$1*'), raw: text, model: 'gethis-2.0-flash' }
        } catch (e) {
            console.log('[GethisVision] Vision API failed, responinng about image without analysis:', e.message)
            const result = await gethisScraper({
                message: '[User send image] ' + message,
                instruction
            })
            return { text: result.text, raw: result.text, model: 'scraper-fallback' }
        }
    }

    const result = await gethisScraper({ message, instruction })
    return { text: result.text, raw: result.text, model: 'scraper' }
}

module.exports = { chat }
