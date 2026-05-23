const { getDatabase } = require("../../src/lib/frenzy-database");
const pakasir = require("../../src/lib/frenzy-pakasir");
const orderPoller = require("../../src/lib/frenzy-order-poller");
const QRCode = require("qrcode");
const timeHelper = require("../../src/lib/frenzy-time");
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
  name: "order",
  alias: ["buy", "message", "buy"],
  category: "store",
  description: "Create order product",
  usage: ".order <number_product> [amount]",
  example: ".order 1 2",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 10,
  energy: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const groupData = db.getGroup(m.chat) || {};

  if (groupData.botMode !== "store") {
    return m.reply(`❌ Feature this only terseina in mode *STORE*!`);
  }

  const products = groupData.storeConfig?.products || [];
  const isAutoorder = groupData.storeConfig?.autoorder || false;

  if (products.length === 0) {
    return m.reply(
      `❌ Not yet there is product!\n\n> Admin: \`${m.prefix}addproduct\``,
    );
  }

  const args = m.text?.trim().split(/\s+/) || [];
  const productIdx = parseInt(args[0]) - 1;
  const qty = parseInt(args[1]) || 1;

  if (isNaN(productIdx) || productIdx < 0 || productIdx >= products.length) {
    let txt = `⚠️ *ᴘɪʟɪʜ ᴘʀᴏᴅᴜᴋ*\n\n`;
    products.forEach((p, i) => {
      txt += `*${i + 1}.* ${p.name} - Rp ${p.price.toLocaleString("id-ID")}\n`;
    });
    txt += `\n> Example: \`${m.prefix}order 1\``;
    return m.reply(txt);
  }

  const product = products[productIdx];

  if (product.stock !== -1 && product.stock < qty) {
    return m.reply(`❌ Not enough stock!\n\n> Available: ${product.stock}`);
  }

  const total = product.price * qty;
  const orderId = pakasir.generateOrderId();

  let previewTxt = `📦 *ᴍᴇᴍʙᴜᴀᴛ ᴘᴇsᴀɴᴀɴ...*\n\n`;
  previewTxt += `> *Product:* ${product.name}\n`;
  previewTxt += `> *Price:* Rp ${product.price.toLocaleString("id-ID")}\n`;
  previewTxt += `> *Amount:* ${qty}\n`;
  previewTxt += `> *Total:* Rp ${total.toLocaleString("id-ID")}\n`;
  if (product.description) {
    previewTxt += `\n📝 *Description:*\n${product.description}\n`;
  }

  if (product.image) {
    await sock.sendMessage(
      m.chat,
      {
        image: { url: product.image },
        caption: previewTxt,
      },
      { quoted: m },
    );
  } else if (product.video) {
    await sock.sendMessage(
      m.chat,
      {
        video: { url: product.video },
        caption: previewTxt,
      },
      { quoted: m },
    );
  } else {
    await m.reply(previewTxt);
  }

  await m.reply(`🕕 *ᴍᴇɴɢɢᴇɴᴇʀᴀᴛᴇ ᴘᴇᴍʙᴀʏᴀʀᴀɴ...*`);

  try {
    const orderData = {
      groupId: m.chat,
      buyerJid: m.sender,
      buyerName: m.pushName || m.sender.split("@")[0],
      items: [
        {
          id: product.id,
          name: product.name,
          qty,
          price: product.price,
        },
      ],
      total,
      status: "pending",
      paymentMethod: null,
      paymentNumber: null,
      expiredAt: null,
      productDetail: product.detail || null,
      productImage: product.image || null,
      productDescription: product.description || null,
    };

    console.log("[Order] Debug:", {
      isAutoorder,
      pakasirEnabled: pakasir.isEnabled(),
      storeConfig: groupData.storeConfig,
    });

    if (isAutoorder && pakasir.isEnabled()) {
      const method = pakasir.getConfig().defaultMethod || "qris";
      console.log("[Order] Creating Pakasir transaction:", {
        method,
        total,
        orderId,
      });
      const payment = await pakasir.createTransaction(method, total, orderId);
      console.log(
        "[Order] Pakasir response:",
        JSON.stringify(payment, null, 2),
      );

      orderData.paymentMethod = payment.payment_method;
      orderData.paymentNumber = payment.payment_number;
      orderData.expiredAt = payment.expired_at;
      orderData.fee = payment.fee || 0;
      orderData.totalPayment = payment.total_payment || total;

      orderPoller.createOrder(orderId, orderData);

      if (product.stock !== -1) {
        products[productIdx].stock -= qty;
        db.setGroup(m.chat, groupData);
      }

      let invoiceText = `🛒 *ɪɴᴠᴏɪᴄᴇ ᴏʀᴅᴇʀ*\n\n`;
      invoiceText += `> Order ID: \`${orderId}\`\n`;
      invoiceText += `> Pembuy: @${m.sender.split("@")[0]}\n`;
      invoiceText += `━━━━━━━━━━━━━━━\n\n`;
      invoiceText += `📦 *ɪᴛᴇᴍ:*\n`;
      invoiceText += `> ${product.name} x${qty}\n`;
      invoiceText += `> Rp ${product.price.toLocaleString("id-ID")} × ${qty}\n\n`;
      invoiceText += `💰 *ᴛᴏᴛᴀʟ:* Rp ${total.toLocaleString("id-ID")}\n`;
      if (orderData.fee) {
        invoiceText += `💳 *ꜰᴇᴇ:* Rp ${orderData.fee.toLocaleString("id-ID")}\n`;
        invoiceText += `💵 *ʙᴀʏᴀʀ:* Rp ${orderData.totalPayment.toLocaleString("id-ID")}\n`;
      }
      invoiceText += `\n━━━━━━━━━━━━━━━\n`;
      invoiceText += `📱 *ᴍᴇᴛᴏᴅᴇ:* ${payment.payment_method?.toUpperCase() || "QRIS"}\n`;

      if (payment.payment_method === "qris" && payment.payment_number) {
        invoiceText += `\n> Scan QR below for pay\n`;
        invoiceText += `> ⏰ Expired: ${timeHelper.fromTimestamp(payment.expired_at, "DD MMMM YYYY HH:mm:ss")}`;

        try {
          const qrBuffer = await QRCode.toBuffer(payment.payment_number, {
            type: "png",
            width: 300,
            margin: 2,
          });

          await sock.sendMessage(
            m.chat,
            {
              image: qrBuffer,
              caption: invoiceText,
              mentions: [m.sender],
            },
            { quoted: m },
          );
        } catch (qrErr) {
          invoiceText += `\n\n📝 *ᴋᴏᴅᴇ ǫʀ:*\n\`\`\`${payment.payment_number.substring(0, 100)}...\`\`\``;
          await m.reply(invoiceText, { mentions: [m.sender] });
        }
      } else {
        invoiceText += `\n📝 *ɴᴏᴍᴏʀ ᴠᴀ:* \`${payment.payment_number}\`\n`;
        invoiceText += `> ⏰ Expired: ${timeHelper.fromTimestamp(payment.expired_at, "DD MMMM YYYY HH:mm:ss")}`;
        await m.reply(invoiceText, { mentions: [m.sender] });
      }

      m.react("🛒");
    } else {
      orderData.status = "waiting_confirm";
      orderPoller.createOrder(orderId, orderData);

      if (product.stock !== -1) {
        products[productIdx].stock -= qty;
        db.setGroup(m.chat, groupData);
      }

      const config = require("../../config");
      let paymentInfo = "";
      if (config.store?.qris) {
        paymentInfo = `> QRIS: ${config.store.qris}\n`;
      }
      if (config.store?.payment?.length) {
        config.store.payment.forEach((p) => {
          paymentInfo += `> ${p.name}: ${p.number} (${p.holder})\n`;
        });
      }

      let txt = `🛒 *ᴏʀᴅᴇʀ ᴅɪʙᴜᴀᴛ*\n\n`;
      txt += `> Order ID: \`${orderId}\`\n`;
      txt += `> Pembuy: @${m.sender.split("@")[0]}\n`;
      txt += `━━━━━━━━━━━━━━━\n\n`;
      txt += `📦 *ɪᴛᴇᴍ:*\n`;
      txt += `> ${product.name} x${qty}\n\n`;
      txt += `💰 *ᴛᴏᴛᴀʟ:* Rp ${total.toLocaleString("id-ID")}\n\n`;
      txt += `━━━━━━━━━━━━━━━\n`;
      txt += `💳 *ᴘᴇᴍʙᴀʏᴀʀᴀɴ:*\n`;
      txt += paymentInfo || "> Contact admin for info payment\n";
      txt += `\n> After pay, admin will confirdeadon with:\n`;
      txt += `> \`${m.prefix}confirmorder ${orderId}\``;

      await m.reply(txt, { mentions: [m.sender] });
      m.react("🛒");
    }
  } catch (err) {
    console.error("[Order] Error:", err);
    return m.reply(te(m.prefix, m.command, m.pushName))
  }
}

module.exports = {
  config: pluginConfig,
  handler,
};
