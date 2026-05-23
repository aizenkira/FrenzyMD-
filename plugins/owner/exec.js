const { getDatabase } = require('../../src/lib/frenzy-database')
const config = require('../../config')
const util = require('util')

const pluginConfig = {
    name: 'exec',
    alias: ['>', 'run', 'execute'],
    category: 'owner',
    description: 'Run code JS from message that in-reply (Owner Only)',
    usage: '.> (reply message berisi code)',
    example: '.> (reply)',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock, store }) {
    if (!config.isOwner(m.sender)) {
        return m.reply('❌ *Owner Only!*')
    }
    
    let code = null
    
    if (m.quoted) {
        code = m.quoted.text || m.quoted.body || m.quoted.caption
    }
    
    if (!code) {
        code = m.fullArgs?.trim() || m.text?.trim()
    }
    
    if (!code) {
        return m.reply(
            `⚙️ *ᴇxᴇᴄ*\n\n` +
            `> Reply message berisi code JavaScript!\n\n` +
            `*Or:*\n` +
            `> .> <code>\n\n` +
            `*Example:*\n` +
            `> Reply message: \`return m.chat\`\n` +
            `> Lalu type: .>`
        )
    }
    
    code = code.trim()
    
    if (code.startsWith('```') && code.endsWith('```')) {
        code = code.slice(3, -3)
        if (code.startsWith('javascript') || code.startsWith('js')) {
            code = code.replace(/^(javascript|js)\n?/, '')
        }
    }
    
    const db = getDatabase()
    
    let result
    let isError = false
    
    try {
        result = await eval(`(async () => { ${code} })()`)
    } catch (e) {
        isError = true
        result = e
    }
    
    let output
    if (typeof result === 'undefined') {
        output = 'undefined'
    } else if (result === null) {
        output = 'null'
    } else if (typeof result === 'object') {
        try {
            output = util.inspect(result, { depth: 2, maxArrayLength: 50 })
        } catch {
            output = String(result)
        }
    } else {
        output = String(result)
    }
    
    if (output.length > 3000) {
        output = output.slice(0, 3000) + '\n\n... (truncated)'
    }
    
    const status = isError ? '❌ Error' : '✅ Success'
    const type = isError ? result?.name || 'Error' : typeof result
    
    const codePreview = code.length > 100 ? code.slice(0, 100) + '...' : code
    
    await m.reply(
        `⚙️ *ᴇxᴇᴄ ʀᴇsᴜʟᴛ*\n\n` +
        `╭┈┈⬡「 📋 *ᴄᴏᴅᴇ* 」\n` +
        `┃ \`${codePreview}\`\n` +
        `├┈┈⬡「 📊 *ʀᴇsᴜʟᴛ* 」\n` +
        `┃ ${status}\n` +
        `┃ Type: ${type}\n` +
        `╰┈┈┈┈┈┈┈┈⬡\n\n` +
        `\`\`\`${output}\`\`\``
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
