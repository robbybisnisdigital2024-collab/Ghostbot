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

const writeDB = (data) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
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

    if (!keyName) {
        return sock.sendMessage(from, { 
            text: '⚠️ Harap masukkan nama key yang ingin dihapus.\nContoh: `.dellist aturan`' 
        }, { quoted: msg });
    }

    const db = readDB();

    if (!db[from] || !db[from][keyName]) {
        return sock.sendMessage(from, { 
            text: `❌ Key *${keyName}* tidak ditemukan dalam daftar list.` 
        }, { quoted: msg });
    }

    delete db[from][keyName];
    writeDB(db);

    await sock.sendMessage(from, { 
        text: `🗑️ Berhasil menghapus list: *${keyName}*` 
    }, { quoted: msg });
};

export default {
    name: 'dellist',
    aliases: ['removelist'],
    category: 'tools',
    description: 'Menghapus key tertentu dari list',
    run: handler,
    exec: handler,
    execute: handler
};