const { getRandomItem } = require('../../src/lib/frenzy-game-data');

const pluginConfig = {
    name: 'truth',
    alias: ['truthq'],
    category: 'fun',
    description: 'Random question truth',
    usage: '.truth',
    example: '.truth',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
};

async function handler(m) {
    const question = getRandomItem('truth.json');
    if (!question) {
        await m.reply('❌ Data no terseina!');
        return;
    }
    await m.reply(`\`\`\`${question}\`\`\``);
}

module.exports = {
    config: pluginConfig,
    handler
};
