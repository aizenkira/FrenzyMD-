const { getRandomItem, getItemByIndex, searchItem, getAllData } = require('../../src/lib/frenzy-game-data');

const pluginConfig = {
    name: 'aswantlhusna',
    alias: ['aswantl', 'husna', '99names'],
    category: 'religi',
    description: '99 Name Allah (Asmaul Husna)',
    usage: '.aswantlhusna [number/name]',
    example: '.aswantlhusna 1\n.aswantlhusna ar rahman',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
};

async function handler(m) {
    const query = m.args.join(' ').trim();
    
    let name;
    
    if (!query) {
        name = getRandomItem('aswantlhusna.json');
    } else if (/^\d+$/.test(query)) {
        const index = parseInt(query);
        if (index < 1 || index > 99) {
            await m.reply('❌ Number must between 1-99!');
            return;
        }
        name = getItemByIndex('aswantlhusna.json', index);
    } else if (query.toLowerCase() === 'all' || query.toLowerCase() === 'all') {
        const allNames = getAllData('aswantlhusna.json');
        let text = `☪️ *ASMAUL HUSNA*\n`;
        text += `> 99 Name Allah SWT\n\n`;
        text += `\`\`\``;
        
        for (const n of allNames.slice(0, 33)) {
            text += `${n.index}. ${n.latin}\n`;
        }
        
        text += `\`\`\`\n`;
        text += `> Haoldn 1/3\n\n`;
        text += `_Usage .aswantlhusna [number] for detail_`;
        
        await m.reply(text);
        return;
    } else {
        name = searchItem('aswantlhusna.json', query, 'latin');
    }
    
    if (!name) {
        await m.reply('❌ Name not found!\n_Try a number 1-99 or a Latin name_');
        return;
    }
    
    let text = `☪️ *ASMAUL HUSNA*\n\n`;
    text += `\`\`\``;
    text += `📍 Number : ${name.index}\n`;
    text += `🔤 Latin : ${name.latin}\n`;
    text += `📜 Arab  : ${name.arabicic}`;
    text += `\`\`\`\n\n`;
    text += `> 🇮🇩 Arti (ID): ${name.translation_id}\n`;
    text += `> 🇬🇧 Arti (EN): ${name.translation_en}`;
    
    await m.reply(text);
}

module.exports = {
    config: pluginConfig,
    handler
};
