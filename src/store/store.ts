import { AccountData } from '../interfaces';
import SQLite from './sqlite';
import { randVal } from '../utils';
import devices from '../../devices.json';

const db = new SQLite('deezer.db');

const initStore = async () => {
    try {
        await db.run(
            'CREATE TABLE accounts(' +
            'id integer PRIMARY KEY AUTOINCREMENT, ' +
            'deezer_user_id integer, ' +
            'blog_name text, ' +
            'birthday text, ' +
            'email text UNIQUE, ' +
            'password text, ' +
            'lang text, ' +
            'sex integer)',
            []
        );

        await db.run(
            'CREATE TABLE bots(' +
            'id integer PRIMARY KEY AUTOINCREMENT, ' +
            'account INTEGER, ' +
            'device INTEGER, ' +
            'state TEXT, ' +
            'free_trial_start INTEGER, ' +
            'device_serial TEXT, ' +
            'uniq_id TEXT, ' +
            'FOREIGN KEY(account) REFERENCES accounts(id))',
            []
        );
    } catch (err) {
        console.log(err);
    }
}

const getRandomDevice = async () => {
    return devices[randVal(devices.length)];
};

const insertAccount = async (account: AccountData) => {
    try {
        await db.run(
            'insert into accounts(blog_name, birthday, email, password, lang, sex) values(?, ?, ?, ?, ?, ?)',
            [
                account.blogName,
                account.birthday,
                account.email,
                account.password,
                account.lang,
                account.sex === 'M' ? 0 : 1
            ]
        );

        return (await db.get('select id from accounts where email=?', [ account.email ])).id;
    } catch (err) {
        console.log(err);
    }
};

const insertBot = async (deviceId: number, accountId: number) => {
    try {
        await db.run(
            'insert into bots(account, device, state) values(?, ?, ?)',
            [
                accountId,
                deviceId,
                'offline'
            ]
        );
    } catch (err) {
        console.log(err);
    }
};

const setUserId = async (email: string, userId: string | undefined) => {
    try {
        await db.run(
            'update accounts set deezer_user_id=? where email=?',
            [
                userId,
                email
            ]
        );
    } catch (err) {
        console.log(err);
    }
}

const getBotsPool = async (n: number) => {
    try {
        return await db.all(
            'select id from bots where (free_trial_start is not null) and state = \'offline\' limit ?',
            [ n ]
        );
    } catch (err) {
        console.log(err);
    }
};

const getBotDataById = async (id: number) => {
    try {
        const data = await db.get(
            'select * ' +
            'from bots ' +
            'join accounts on bots.account = accounts.id ' +
            'where bots.id = ?',
            [ id ]
        );

        return {
            ...data,
            ...devices[data.device - 1]
        };
    } catch (err) {
        console.log(err);
    }
};

const setBotFreeTrial = async (id: number, date: number) => {
    try {
        await db.run(
            'update bots set free_trial_start=? where id=?',
            [ date, id ]
        );
    } catch (err) {
        console.log(err);
    }
};

export const Store = {
    getRandomDevice,
    insertAccount,
    insertBot,
    setUserId,
    getBotsPool,
    getBotDataById,
    setBotFreeTrial
}
