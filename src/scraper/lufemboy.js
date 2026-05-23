function checkfemboy(name) {
    try {
        if (!name) throw new Error('Enter name first !');
        
        const percent = Math.floor(Math.random() * 101);
        let desc = '';
        let imgUrl = '';
        
        if (percent < 20) {
            desc = 'Cowok very! 😎';
            imgUrl = 'https://check-how-femboy.vercel.app/img/normal.gif';
        } else if (percent < 40) {
            desc = 'Ada aura lembutnya a little~ 🌸';
            imgUrl = 'https://check-how-femboy.vercel.app/img/inbwh40.gif';
        } else if (percent < 60) {
            desc = 'Pretty femboy 😘';
            imgUrl = 'https://check-how-femboy.vercel.app/img/inbwh60.gif';
        } else if (percent < 80) {
            desc = 'Femboy sejati 💅✨';
            imgUrl = 'https://check-how-femboy.vercel.app/img/inbwh80.gif';
        } else {
            desc = 'FEMBOY DEWA 🔥💖';
            imgUrl = 'https://check-how-femboy.vercel.app/img/femboyyyy.gif';
        }
        
        return {
            hasil: `${name}, you ${percent}% femboy!, ${desc}`,
            gif: imgUrl
        };
    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = checkfemboy
