import Store from '../store/index';
import {Bot} from '../bot/bot';
import {AccountData, DeviceData, Playlist} from '../interfaces';
import {randHex} from '../utils';
import {Client} from "../client/client";

class BotsPool {
    /**
     * Inits bot session by id from postgres
     *
     * @param id
     */
    public async initBotById(id: number): Promise<Bot> {
        const data = await Store.getBotDataById(id);
        if (!data) throw new Error('Bot with id ' + id + ' not found');

        const account: AccountData = {
            blogName: data.blog_name,
            birthday: data.birthday,
            email:    data.email,
            password: data.password,
            lang:     data.label,
            sex:      data.sex ? 'F' : 'M'
        };

        const device: DeviceData = {
            type:            data.type,
            model:           data.model,
            name:            data.name,
            lang:            data.lang,
            serial:          data.device_serial,
            uniqID:          data.uniq_id,
            manufacturer:    data.manufacturer,
            cpuMaxFrequency: data.cpu_max_frequency,
            cpuCount:        data.cpu_count,
            ram:             data.ram,
            screenHeight:    data.screen_height,
            screenWidth:     data.screen_width
        }

        return new Bot(account, device);
    };

    /**
     * Gets free trial for bot by id in postgres
     *
     * @param id
     */
    public async getFreeTrial(id: number) {
        const bot = await this.initBotById(id);

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
}

class PlaylistListener {
    // private listenCountDelta: number = 0;
    private listenerId: string = randHex(16);
    private botsPool: BotsPool = new BotsPool();

    constructor(private readonly playlist: Playlist) {
    }

    get id() {
        return this.listenerId;
    }

    /**
     * Gets n bots from pool and starts to listen album for m times.
     *
     * @param botN     Number of bots.
     * @param listensN Number of listens per album
     */
    public async massiveListen(botN: number, listensN: number) {
        console.time('Get unused bot ids');
        const ids = await Store.getBotsPool(botN) || [];
        console.log("Used bots", ids);
        console.timeEnd('Get unused bot ids');

        console.time('Init bots pool');
        let botPromises = [];
        for (let i = 0; i < ids.length; i++)
            botPromises.push(this.botsPool.initBotById(ids[i].id))
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
            listenLoopPromises.push(pool[i].listenLoopPlaylist(this.playlist, listensN));
        await Promise.all(listenLoopPromises);
        console.timeEnd('Massive listen loop');
    }
}

(async () => {
    const album: Playlist = {
        songs: [
            {
                id: "750769012",
                duration: 29 //70
            },
            {
                id: "750769002",
                duration: 1 //72
            }
        ],
        context: {
            type: "album_page",
            id: "110518052"
        }
    };

    const data = await Store.getBotDataById(2);

    const account: AccountData = {
        blogName: data.blog_name,
        birthday: data.birthday,
        email:    data.email,
        password: data.password,
        lang:     data.lang,
        sex:      data.sex ? 'F' : 'M'
    };

    const device: DeviceData = {
        type:            data.type,
        model:           data.model,
        name:            data.name,
        lang:            data.lang,
        serial:          data.device_serial,
        uniqID:          data.uniq_id,
        manufacturer:    data.manufacturer,
        cpuMaxFrequency: data.cpu_max_frequency,
        cpuCount:        data.cpu_count,
        ram:             data.ram,
        screenHeight:    data.screen_height,
        screenWidth:     data.screen_width
    }

    const client = new Client(account, device);

    console.log("Log in");
    await client.initSession();
    await client.mobileUserAuth();

    // let session = client.getSession;
    console.log("Session");
    await client.initSession();
    console.log("Log out");
    await client.mobileUserAuth();
    console.log("Log in");
    await client.initSession();
})();
