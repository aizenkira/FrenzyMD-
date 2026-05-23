const pluginConfig = {
    name: 'readmore',
    alias: ['secompletenya', 'spoiler'],
    category: 'tools',
    description: 'Create text baca secompletenya (spoiler)',
    usage: '.readmore <text_awal>|<text_akhir>',
    example: '.readmore Hai|This is the message confidential',
    isGroup: false,
    isBotAdmin: false,
    isAdmin: false,
    cooldown: 5,
    energy: 1,
    isEnabled: true
};

async function handler(m, { sock }) {
    const text = m.text;
    
    if (!text) {
        return m.reply(`⚠️ Enter some text!\nExample: \`${m.prefix}${m.command} Hello|This is hidden text\``);
    }
    
    let [l, r] = text.split('|');
    if (!l) l = '';
    if (!r) r = '';
    
    const readmore = String.fromCharCode(8206).repeat(4001);
    
    m.reply(l + readmore + r);
}

module.exports = {
    config: pluginConfig,
    handler
};
