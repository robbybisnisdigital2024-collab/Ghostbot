import { Sticker, StickerTypes } from 'wa-sticker-formatter';

const handler = async (sockOrObj, mObj, argsObj) => {
    let sock = sockOrObj;
    let msg = mObj;
    let args = argsObj;

    if (sockOrObj && sockOrObj.sock) {
        sock = sockOrObj.sock;
        msg = sockOrObj.m || sockOrObj.msg;
        args = sockOrObj.args || [];
    }

    const from = msg?.key?.remoteJid || msg?.chat;
    const text = (Array.isArray(args) ? args.join(' ') : (args || '')).trim();

    if (!text) {
        return sock.sendMessage(from, { 
            text: '⚠️️ Harap masukkan teks!\nContoh: `.brat ghost bot`' 
        }, { quoted: msg });
    }

    const apiEndpoints = [
        `https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(text)}`,
        `https://aemt.me/brat?text=${encodeURIComponent(text)}`,
        `https://api.restapis.my.id/api/brat?text=${encodeURIComponent(text)}`
    ];

    let success = false;

    for (const url of apiEndpoints) {
        try {
            const res = await fetch(url);
            if (res.ok) {
                const buffer = Buffer.from(await res.arrayBuffer());

                // Membuat stiker WebP yang dilengkapi Metadata EXIF
                const sticker = new Sticker(buffer, {
                    pack: 'Ghost Bot',      // Nama Pack Stiker
                    author: 'Robby',        // Pembuat / Author
                    type: StickerTypes.FULL,
                    quality: 100
                });

                const stickerBuffer = await sticker.toBuffer();

                await sock.sendMessage(from, { 
                    sticker: stickerBuffer 
                }, { quoted: msg });

                success = true;
                break;
            }
        } catch (err) {
            continue;
        }
    }

    if (!success) {
        await sock.sendMessage(from, { 
            text: '❌ Semua server API Brat sedang offline/bermasalah. Silakan coba lagi nanti.' 
        }, { quoted: msg });
    }
};

export default {
    name: 'brat',
    aliases: ['bratgen', 'brats', 'bratsticker'],
    category: 'tools',
    description: 'Membuat stiker dengan gaya font/cover album Brat',
    run: handler,
    exec: handler,
    execute: handler
};