import { Bot } from '../bot/bot';
import { generateAccount, randHex } from '../utils';
import { Store } from '../store/store'
import { DeviceData } from '../interfaces';


export class Registrator {
    public async bulkRegistration(n: number) {
        console.time('bulkreg');
        if (n <= 100) {
            let regAccountsCnt = 0;
            for (let i = 0; i < n; i++) {
                const [deviceId, device] = await this.generateDevice();
                const account = generateAccount();

                const bot = new Bot(account, device);
                const res = await bot.signUp();

                if (res.error.length == 0) {
                    const accountId = await Store.insertAccount(account);
                    console.log(accountId);
                    await Store.insertBot(deviceId, accountId);
                    regAccountsCnt++;
                } else {
                    console.log('Error', res.error, 'on', account);
                }
            }
            console.log('Registered', regAccountsCnt, 'of', n);
            console.timeEnd('bulkreg');
        }
    }

    public async generateDevice(): Promise<[number, DeviceData]> {
        const device = await Store.getRandomDevice();
        return [
            device.id,
            {
                type: device.type,
                model: device.model,
                name: device.name,
                lang: 'us',
                uniqID: randHex(32),
                serial: randHex(64)
            }
        ];
    }
}

;(async () => {
    const reg = new Registrator();
    await reg.bulkRegistration(3);
})();
