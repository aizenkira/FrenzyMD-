const { getRandomItem } = require('../../src/lib/frenzy-game-data');

const pluginConfig = {
    name: 'dare',
    alias: ['dareq', 'tantang'],
    category: 'fun',
    description: 'Random tantangan dare',
    usage: '.dare',
    example: '.dare',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
};

async function handler(m) {
    const cthingslenge = getRandomItem('dare.json');
    
    if (!cthingslenge) {
        await m.reply('❌ Data no terseina!');
        return;
    }
    
    await m.reply(`\`\`\`${cthingslenge}\`\`\``);
}

module.exports = {
    config: pluginConfig,
    handler
};
