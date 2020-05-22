import pool from './connect';
import { AccountData } from '../client/interfaces';

const getRandomDevice = async () => {
    try {
        const res = await pool.query(
            'select * from devices offset floor(random() * (select count(*) from devices)) limit 1'
        );
        return res.rows[0];
    } catch (err) {
        console.log(err);
    }
};

const insertAccount = async (account: AccountData) => {
    try {
        const res = await pool.query(
            'insert into accounts(blog_name, birthday, email, password, lang, sex) values($1, $2, $3, $4, $5, $6) returning id',
            [
                account.blogName,
                account.birthday,
                account.email,
                account.password,
                account.lang,
                account.sex === 'M' ? 0 : 1
            ]
        );

        return res.rows[0].id;
    } catch (err) {
        console.log(err);
    }
};

const insertBot = async (deviceId: number, accountId: number) => {
    try {
        return await pool.query(
            'insert into bots(account, device, state) values($1, $2, $3)',
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
        return await pool.query(
            'update accounts set deezer_user_id=$1 where email=$2',
            [
                userId,
                email
            ]
        );
    } catch (err) {
        console.log(err);
    }
}

const getUnusedBots = async (n: number) => {
    try {
        const res = await pool.query(
            'select id from bots where state!=\'active\' and state!=\'banned\' limit $1',
            [ n ]
        );

        return res.rows;
    } catch (err) {
        console.log(err);
    }
};

const getBotDataById = async (id: number) => {
    try {
        const res = await pool.query(
            'select * ' +
            'from bots ' +
            'join accounts on bots.account = accounts.id ' +
            'join devices on bots.device = devices.id ' +
            'where bots.id = $1',
            [ id ]
        );

        return res.rowCount === 0 ? null : res.rows[0];
    } catch (err) {
        console.log(err);
    }
};

const setBotFreeTrial = async (id: number, date: string) => {
    try {
        await pool.query(
            'update bots set free_trial_start=$1 where id=$2',
            [ date, id ]
        );
    } catch (err) {
        console.log(err);
    }
}

export const Store = {
    getRandomDevice,
    insertAccount,
    insertBot,
    setUserId,
    getUnusedBots,
    getBotDataById,
    setBotFreeTrial
}
