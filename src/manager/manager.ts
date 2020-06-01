import Store from '../store/index';
import { Bot } from '../bot/bot';
import { AccountData, Playlist, DeviceData } from '../interfaces';
import { generateAccount, randHex } from "../utils";

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
            serial: data.device_serial,
            uniqID: data.uniq_id
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

    public async bulkRegistration(n: number) {
        console.time('bulkreg');
        if (n <= 1000) {
            let regAccountsCnt = 0;
            for (let i = 0; i < n; i++) {
                const [deviceId, device] = await this.generateDevice();
                const account = generateAccount();

                const bot = new Bot(account, device);
                const res = await bot.signUp();

                if (res.error.length == 0) {
                    const accountId = await Store.insertAccount(account);
                    console.log(accountId);
                    await Store.insertBot(deviceId, accountId, device.serial, device.uniqID);
                    regAccountsCnt++;
                } else {
                    console.log('Error', res.error, 'on', account);
                }
            }
            console.log('Registered', regAccountsCnt, 'of', n);
            console.timeEnd('bulkreg');
        }
    }

    /**
     * Generates random device.
     */
    public async generateDevice(): Promise<[number, DeviceData]> {
        const device = await Store.getRandomDevice();
        return [
            device.id,
            {
                type: device.type,
                model: device.model,
                name: device.name,
                screenWidth: device.screen_width || undefined,
                screenHeight: device.screen_height || undefined,
                cpuCount: device.cpu_count || undefined,
                cpuMaxFrequency: device.cpu_max_frequency || undefined,
                ram: device.ram || undefined,
                lang: 'us',
                uniqID: randHex(32),
                serial: randHex(64)
            }
        ];
    }

}

class PlaylistListener {
    // private listenCountDelta: number = 0;
    private listenerId: string = randHex(16);
    private botsPool: BotsPool = new BotsPool();

    constructor(private readonly playlist: Playlist) {}

    /**
     * Gets n bots from pool and starts to listen album for m times.
     *
     * @param botN     Number of bots.
     * @param listensN Number of listens per album
     * @param album
     */
    public async massiveListen(botN: number, listensN: number, album: Playlist) {
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
            listenLoopPromises.push(pool[i].listenLoopPlaylist(album, listensN));
        await Promise.all(listenLoopPromises);
        console.timeEnd('Massive listen loop');
    };

    get id() {
        return this.listenerId;
    }
}
