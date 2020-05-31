import { AccountData } from '../interfaces';
import SQLite from './sqlite';
import { randVal } from '../utils';
import devices from '../../devices.json';

export class Store extends SQLite {
    constructor(path: string) {
        super(path);
        this.initScheme();
    }

    private async initScheme() {
        try {
            await this.run(
                'CREATE TABLE IF NOT EXISTS accounts(' +
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

            await this.run(
                'CREATE TABLE IF NOT EXISTS bots(' +
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

    public async getRandomDevice() {
        return devices[randVal(devices.length)];
    }

    public async insertAccount(account: AccountData) {
        try {
            await this.run(
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

            return (await this.get('select id from accounts where email=?', [ account.email ])).id;
        } catch (err) {
            console.log(err);
        }
    };

    public async insertBot(deviceId: number, accountId: number, deviceSerial: string, uniqID: string) {
        try {
            await this.run(
                'insert into bots(account, device, state, device_serial, uniq_id) values(?, ?, ?, ?, ?)',
                [
                    accountId,
                    deviceId,
                    'offline',
                    deviceSerial,
                    uniqID
                ]
            );
        } catch (err) {
            console.log(err);
        }
    };

    public async setUserId(email: string, userId: string | undefined) {
        try {
            await this.run(
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

    public async getBotsPool(n: number) {
        try {
            return await this.all(
                'select id from bots where (free_trial_start is not null) and state = \'offline\' limit ?',
                [ n ]
            );
        } catch (err) {
            console.log(err);
        }
    };

    public async getBotDataById(id: number) {
        try {
            const data = await this.get(
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

    public async setBotFreeTrial(id: number, date: number) {
        try {
            await this.run(
                'update bots set free_trial_start=? where id=?',
                [ date, id ]
            );
        } catch (err) {
            console.log(err);
        }
    };
}
