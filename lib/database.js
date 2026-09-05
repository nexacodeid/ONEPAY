import fs from 'fs';
import path from 'path';

const DB_PATH = './database/db.json';
if (!fs.existsSync('./database')) {
    fs.mkdirSync('./database');
}

export const loadDB = () => {
    if (!fs.existsSync(DB_PATH)) {
        return {};
    }
    try {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        return data ? JSON.parse(data) : {};
    } catch (e) {
        return {};
    }
};

export const saveDB = (db) => {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    } catch (e) {
        console.error('Gagal save database:', e);
    }
};

export const initDatabase = () => {
    const data = loadDB();
    global.db = new Proxy(data, {
        set(target, property, value) {
            target[property] = value;
            saveDB(target);
            return true;
        }
    });
};
