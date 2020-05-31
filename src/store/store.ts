import { AccountData, Song } from '../interfaces';
import SQLite from './sqlite';
import { randVal } from '../utils';
import devices from '../../devices.json';

export class Store extends SQLite {
    constructor(path: string) {
        super(path);
        this.initScheme();
    }

    /**
     * Initializes store scheme.
     */
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
                'account integer, ' +
                'device integer, ' +
                'state text, ' +
                'free_trial_start integer, ' +
                'device_serial text, ' +
                'uniq_id text, ' +
                'FOREIGN KEY(account) REFERENCES accounts(id))',
                []
            );

            await this.run(
                'CREATE TABLE IF NOT EXISTS songs(' +
                'id integer, ' +
                'duration integer, ' +
                'format text, ' +
                'name text)',
                []
            );
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * Gets random device from devices.json.
     */
    public async getRandomDevice() {
        return devices[randVal(devices.length)];
    }

    /**
     * Adds song to store.
     *
     * @param {Song} song
     */
    public async insertSong(song: Song) {
        try {
            await this.run(
                'insert into songs(id, format, duration, name) values(?, ?, ?, ?)',
                [
                    song.id,
                    song.format,
                    song.duration || null,
                    song.name || null,
                ]
            );
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * Gets song from songs table by id.
     *
     * @param {number} id Deezer song id.
     */
    public async getSongById(id: number) {
        try {
            return await this.get('select * from songs where id = ?', [ id ]);
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * Adds account to store.
     *
     * @param {AccountData} account
     */
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
    }

    /**
     * Adds bot to store.
     *
     * @param {number} deviceId     Device id from devices.json.
     * @param {number} accountId    Account id from accounts table.
     * @param {string} deviceSerial Hex string with length 64.
     * @param {string} uniqID       Hex string with length 32.
     */
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
    }

    /**
     * Sets deezer user id to existing account by email.
     *
     * @param {string} email
     * @param {string} userId Deezer user id.
     */
    public async setUserId(email: string, userId: string) {
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

    /**
     * Gets n bots from bots store.
     *
     * @param {number} n Number of bots to get.
     */
    public async getBotsPool(n: number) {
        try {
            return await this.all(
                'select id from bots where (free_trial_start is not null) and state = \'offline\' limit ?',
                [ n ]
            );
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * Gets all bot data from store including device and account.
     *
     * @param {number} id Id in bots table.
     */
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
    }

    /**
     * Updates bot free trial by id.
     *
     * @param {number} id   Id in bots table.
     * @param {number} date UNIX timestamp in milliseconds&
     */
    public async setBotFreeTrial(id: number, date: number) {
        try {
            await this.run(
                'update bots set free_trial_start=? where id=?',
                [ date, id ]
            );
        } catch (err) {
            console.log(err);
        }
    }
}
