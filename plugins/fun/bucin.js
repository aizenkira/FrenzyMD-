const { getRandomItem } = require('../../src/lib/frenzy-game-data');

const pluginConfig = {
    name: 'lovesick',
    alias: ['gombal', 'love', 'romantis'],
    category: 'fun',
    description: 'Random kata-kata lovesick/romantis',
    usage: '.lovesick',
    example: '.lovesick',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
};

async function handler(m) {
    const quote = getRandomItem('lovesick.json');
    
    if (!quote) {
        await m.reply('❌ Data no terseina!');
        return;
    }
    
    await m.reply(`\`\`\`"${quote}"\`\`\`\n\n`);
}

module.exports = {
    config: pluginConfig,
    handler
};
