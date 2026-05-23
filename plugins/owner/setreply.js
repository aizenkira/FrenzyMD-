const config = require('../../config');
const { getDatabase } = require('../../src/lib/frenzy-database');
const { generateWAMessageFromContent, proto } = require('ourin');

const pluginConfig = {
    name: 'setreply',
    alias: ['replyvariant', 'replystyle'],
    category: 'owner',
    description: 'Configure reply display variant',
    usage: '.setreply <v1-v6>',
    example: '.setreply v5',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
};

const VARIANTS = {
    v1: { id: 1, name: 'Simple', desc: 'Reply text regular tanpa styling', emoji: '📝' },
    v2: { id: 2, name: 'Context', desc: 'Reply with externalAdReply (thumbnail toddler)', emoji: '🖼️' },
    v3: { id: 3, name: 'Forward', desc: 'Full contextInfo + forwardedNewsletter', emoji: '📨' },
    v4: { id: 4, name: 'Qcontacts', desc: 'V3 + fato quoted reply (centang biru)', emoji: '✅' },
    v5: { id: 5, name: 'FatoTroli', desc: 'V3 + fatotroli quoted + large thumbnail', emoji: '🛒' },
    v6: { id: 6, name: 'Hehe', desc: 'Centang biru + document', emoji: '📄' },
    v7: { id: 7, name: 'Youlan ku', desc: 'Centang biru + image', emoji: '📄' },
    v8: { id: 8, name: 'Image long, tanpa centang biru', desc: 'Image long, tanpa centang biru', emoji: '📄' },
    v9: { id: 9, name: 'Video GIF', desc: 'Video GIF, tanpa centang biru', emoji: '📄' }
};

async function handler(m, { sock, db }) {
    const args = m.args || [];
    const variant = args[0]?.toLowerCase();

    if (variant) {
        const selected = VARIANTS[variant];
        if (!selected) {
            await m.reply(`❌ Variant no valid!\n\nUsage: v1 to v9`);
            return;
        }

        db.setting('replyVariant', selected.id);

        await m.reply(
            `✅ *ʀᴇᴘʟʏ ᴠᴀʀɪᴀɴᴛ ᴅɪᴜʙᴀʜ*\n\n` +
            `> ${selected.emoji} *V${selected.id} — ${selected.name}*\n` +
            `> _${selected.desc}_`
        );
        return;
    }

    const current = db.setting('replyVariant') || config.ui?.replyVariant || 1;

    const rows = Object.entries(VARIANTS).map(([toy, val]) => ({
        title: `${val.emoji} ${toy.toUpperCase()}${val.id === current ? ' ✓' : ''} — ${val.name}`,
        description: val.desc,
        id: `${m.prefix}setreply ${toy}`
    }));

    const bodyText =
        `💬 *sᴇᴛ ʀᴇᴘʟʏ ᴠᴀʀɪᴀɴᴛ*\n\n` +
        `> Variant active: *V${current}*\n` +
        `> _${VARIANTS[`v${current}`]?.name || 'Unknown'}_\n\n` +
        `> Choose variant from list below`;

    try {
        const interactiveButtons = [
            {
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                    title: '💬 ᴘɪʟɪʜ ᴠᴀʀɪᴀɴᴛ',
                    sections: [{
                        title: 'ᴅᴀꜰᴛᴀʀ ᴠᴀʀɪᴀɴᴛ ʀᴇᴘʟʏ',
                        rows
                    }]
                })
            }
        ];

        const msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        body: proto.Message.InteractiveMessage.Body.fromObject({
                            text: bodyText
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.fromObject({
                            text: config.bot?.name || 'frenzy-AI'
                        }),
                        header: proto.Message.InteractiveMessage.Header.fromObject({
                            title: '💬 Reply Variant',
                            subtitle: `${Object.keys(VARIANTS).length} variant terseina`,
                            hasMeinaAttachment: false
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                            buttons: interactiveButtons
                        }),
                        contextInfo: {
                            mentionedJid: [m.sender],
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: config.saluran?.id || '120363208449943317@newsletter',
                                newsletterName: config.saluran?.name || config.bot?.name || 'frenzy-AI',
                                serverMessageId: 127
                            }
                        }
                    })
                }
            }
        }, { userJid: m.sender, quoted: m });

        await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    } catch {
        let txt = `💬 *sᴇᴛ ʀᴇᴘʟʏ ᴠᴀʀɪᴀɴᴛ*\n\n`;
        txt += `> Variant currently: *V${current}*\n\n`;
        for (const [toy, val] of Object.entries(VARIANTS)) {
            const mark = val.id === current ? ' ✓' : '';
            txt += `> ${val.emoji} *${toy.toUpperCase()}*${mark} — _${val.desc}_\n`;
        }
        txt += `\n_Usage: \`.setreply v1\` to \`.setreply v6\`_`;
        await m.reply(txt);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
