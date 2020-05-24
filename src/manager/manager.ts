import { Store } from '../store/store';
import { Bot } from '../bot/bot';
import { AccountData, Album, DeviceData } from '../interfaces';
import { randVal } from '../utils';
import ProxyLists, { Proxy, Options } from 'proxy-lists';


/**
 * Inits bot session by id from postgres
 * @param id
 */
const initBotById = async (id: number): Promise<Bot> => {
    const data = await Store.getBotDataById(id);
    if (!data) throw new Error('Bot with id ' + id + ' not found');

    const account: AccountData = {
        blogName: data.blog_name,
        birthday: data.birthday,
        email: data.email,
        password: data.password,
        lang: data.label,
        sex: data.sex ? 'F' : 'M'
    };

    const device: DeviceData = {
        type: data.type,
        model: data.model,
        name: data.name,
        lang: data.lang,
    }

    return new Bot(account, device);
};

const getFreeTrial = async (id: number) => {
    const bot = await initBotById(id);

    await bot.signIn();
    const res = await bot.getFreeTrial();

    if (res.results === true) {
        const date = new Date().toISOString().replace('Z', '').replace('T', ' ');

        await Store.setBotFreeTrial(id, date);
        console.log('Free trial got for bot with id:', id);
    } else if (res.error.DATA_ERROR === 'Data Already Exists') {
        console.log('Free trial already got for bot with id:', id)
    } else {
        console.log('Couldn\'t get free trial for bot with id:', id);
    }
}

const album: Album = {
    songs: [
        {
            id: "750769012",
            duration: 1 //70
        },
        {
            id: "750769002",
            duration: 2 //72
        }
    ],
    context: {
        type: "album_page",
        id: "110518052"
    }
}


const getProxy = (options: Partial<Options>): Promise<Proxy[]> => {
    return new Promise((resolve, reject) => {
        ProxyLists.getProxies(options)
            .on('data', (proxies) => {
                resolve(proxies);
            })
            .on('error', (err) => {
                if (err.code !== 'DEPTH_ZERO_SELF_SIGNED_CERT') reject(err);
            })
    })
}
