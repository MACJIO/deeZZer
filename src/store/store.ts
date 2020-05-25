import { AccountData } from '../interfaces';
import SQLite from './sqlite';
import {randVal} from "../utils";
import {log} from "util";

const db = new SQLite('deezer.db');


const getRandomDevice = async () => {
    try {
        const devices = await db.all('select * from devices', []);

        return devices[randVal(devices.length)];
    } catch (err) {
        console.log(err);
    }
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
        return await db.get(
            'select * ' +
            'from bots ' +
            'join accounts on bots.account = accounts.id ' +
            'join devices on bots.device = devices.id ' +
            'where bots.id = ?',
            [ id ]
        );
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
