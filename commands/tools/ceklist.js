import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/list.json');

const readDB = () => {
    if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '{}');
    return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
};

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
    const keyName = (Array.isArray(args) ? args.join(' ') : (args || '')).trim().toLowerCase();
    const db = readDB();

    const groupList = db[from] || {};
    const keys = Object.keys(groupList);

    if (!keyName) {
        if (keys.length === 0) {
            return sock.sendMessage(from, { 
                text: '📜 Belum ada list tersimpan di percakapan/grup ini.' 
            }, { quoted: msg });
        }

        let responseText = '📋 *DAFTAR LIST TERSIMPAN*\n\n';
        keys.forEach((k, index) => {
            responseText += `${index + 1}. ${k}\n`;
        });
        responseText += '\n_Ketik `.ceklist <nama_key>` untuk melihat isi pesan._';

        return sock.sendMessage(from, { text: responseText }, { quoted: msg });
    }

    if (!groupList[keyName]) {
        return sock.sendMessage(from, { 
            text: `❌ Key *${keyName}* tidak ditemukan. Ketik \`.ceklist\` untuk melihat semua key.` 
        }, { quoted: msg });
    }

    await sock.sendMessage(from, { 
        text: groupList[keyName] 
    }, { quoted: msg });
};

export default {
    name: 'ceklist',
    aliases: ['list', 'getlist'],
    category: 'tools',
    description: 'Melihat seluruh daftar list tersimpan atau menampilkan isi dari key tertentu',
    run: handler,
    exec: handler,
    execute: handler
};