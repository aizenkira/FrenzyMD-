const config = require('../../config')

function te(prefix, command, pushName) {
    const tpl = config.errorTemplate || `☢ *ᴇʀʀᴏʀ*\n\n> An error occurred with command \`{prefix}{command}\`\n> Please try again later, {pushName}\n\n_If the problem persists, contact owner_`
    return tpl
        .replace(/\{prefix\}/g, prefix || '.')
        .replace(/\{command\}/g, command || '?')
        .replace(/\{pushName\}/g, pushName || 'User')
}

module.exports = te
