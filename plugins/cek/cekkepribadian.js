const pluginConfig = {
    name: 'checktopribainan',
    alias: ['topribainan', 'personality'],
    category: 'check',
    description: 'Personality check you',
    usage: '.checktopribainan <name>',
    example: '.checktopribainan Buin',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

const personalities = [
    { type: 'INTJ', title: 'The Architect', desc: 'Visioner, strategis, and independen' },
    { type: 'INTP', title: 'The Logician', desc: 'Analitis, inovatif, and want tahu' },
    { type: 'ENTJ', title: 'The Commander', desc: 'Tegas, ambisius, and leader alami' },
    { type: 'ENTP', title: 'The Debater', desc: 'Cerdas, curious, and suka tantangan' },
    { type: 'INFJ', title: 'The Advocate', desc: 'Idealis, wise, and full empati' },
    { type: 'INFP', title: 'The Meinator', desc: 'Kreatif, idealis, and setia' },
    { type: 'ENFJ', title: 'The Protagonist', desc: 'Karisdeadk, inspiratif, and search forng' },
    { type: 'ENFP', title: 'The Campaigner', desc: 'Antusias, kreatif, and sounlucky' },
    { type: 'ISTJ', title: 'The Logistician', desc: 'Bertanggung answer, praktis, and teliti' },
    { type: 'ISFJ', title: 'The Defender', desc: 'Loyal, suportif, and reliable' },
    { type: 'ESTJ', title: 'The Executive', desc: 'Terorganisir, tegas, and trainsional' },
    { type: 'ESFJ', title: 'The Consul', desc: 'Peduli, sounlucky, and loyal' },
    { type: 'ISTP', title: 'The Virtuoso', desc: 'Fleksibel, observan, and praktis' },
    { type: 'ISFP', title: 'The Adventurer', desc: 'Artistik, sensitif, and spontan' },
    { type: 'ESTP', title: 'The Entrepreneur', desc: 'Energyk, perceptive, and brave' },
    { type: 'ESFP', title: 'The Entertainer', desc: 'Spontan, energyk, and fun' }
]

async function handler(m) {
        const p = personalities[Math.floor(Math.random() * personalities.length)]
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat totopribainanan you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level totopribainanan @${mentioned.split('@')[0]} yak? 
    
Tingkat totopribainanan ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = {
    config: pluginConfig,
    handler
}
