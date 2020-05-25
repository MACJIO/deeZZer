import { Store } from '../store/store';
import { Bot } from '../bot/bot';
import { AccountData, Album, DeviceData } from '../interfaces';
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

/**
 * Gets free trial for bot by id in postgres
 *
 * @param id
 */
const getFreeTrial = async (id: number) => {
    const bot = await initBotById(id);

    await bot.signIn();
    const res = await bot.getFreeTrial();

    if (res.results === true) {
        const date = Math.floor(Date.now() / 1000);

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

/**
 * Gets n bots from pool and starts to listen album for m times.
 *
 * @param botN     Number of bots.
 * @param listensN Number of listens per album
 * @param album
 */
const massiveAlbumListen = async (botN: number, listensN: number, album: Album) => {
    console.time('Get unused bot ids');
    const ids = await Store.getBotsPool(botN) || [];
    console.log("Used bots", ids);
    console.timeEnd('Get unused bot ids');

    console.time('Init bots pool');
    let botPromises = [];
    for (let i = 0; i < ids.length; i++)
        botPromises.push(initBotById(ids[i].id))
    const pool = await Promise.all(botPromises);
    console.timeEnd('Init bots pool');

    console.time('Init bot sessions');
    let botSessionsPromises = [];
    for (let i = 0; i < pool.length; i++)
        botSessionsPromises.push(pool[i].signIn());
    await Promise.all(botSessionsPromises);
    console.timeEnd('Init bot sessions');

    console.time('Massive listen loop');
    let listenLoopPromises = [];
    for (let i = 0; i < pool.length; i++)
        listenLoopPromises.push(pool[i].listenLoopAlbum(album, listensN));
    await Promise.all(listenLoopPromises);
    console.timeEnd('Massive listen loop');
};

(async () => {
    await getFreeTrial(3);
})();
