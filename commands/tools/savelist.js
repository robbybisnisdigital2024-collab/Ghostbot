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
    // Normalisasi parameter (mendukung passing posisi maupun destructuring object)
    let sock = sockOrObj;
    let msg = mObj;
    let args = argsObj;

    if (sockOrObj && sockOrObj.sock) {
        sock = sockOrObj.sock;
        msg = sockOrObj.m || sockOrObj.msg;
        args = sockOrObj.args || [];
    }

    const from = msg?.key?.remoteJid || msg?.chat;
    const text = Array.isArray(args) ? args.join(' ') : (args || '');

    if (!text.includes('|')) {
        return sock.sendMessage(from, { 
            text: '⚠️ *Format salah!*\nGunakan format: `.savelist nama_key|isi pesan`' 
        }, { quoted: msg });
    }

    const [key, ...valueArr] = text.split('|');
    const keyName = key.trim().toLowerCase();
    const value = valueArr.join('|').trim();

    if (!keyName || !value) {
        return sock.sendMessage(from, { 
            text: '⚠️ Nama key dan isi pesan tidak boleh kosong.' 
        }, { quoted: msg });
    }

    const db = readDB();
    if (!db[from]) db[from] = {};

    db[from][keyName] = value;
    writeDB(db);

    await sock.sendMessage(from, { 
        text: `✅ Berhasil menyimpan list dengan key: *${keyName}*` 
    }, { quoted: msg });
};

export default {
    name: 'savelist',
    aliases: ['addlist'],
    category: 'tools',
    description: 'Menyimpan pesan/teks ke dalam list database',
    run: handler,
    exec: handler,
    execute: handler
};