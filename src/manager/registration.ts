import { generateAccount, generateDevice } from '../utils';
import { Bot } from '../bot/bot';
import Store from '../store/index';

class Registration {
    public async registerBot() {
        try {
            const [deviceId, device] = generateDevice();
            const account = generateAccount();

            const bot = new Bot(account, device);
            const res = await bot.signUp();

            if (res.error.length == 0) {
                const accountId = await Store.insertAccount(account);
                console.log("Added account", accountId);
                await Store.insertBot(deviceId, accountId, device.serial, device.uniqID);
            } else {
                console.log('Error', res.error, 'on', account);
            }
        } catch (err) {
            console.log(err);
        }
    }

    public async registerBulkParallel(n: number) {
        let promises = [];
        let i = 0;
        while(i < n) {
            promises.push(this.registerBot());
            i++;
        }

        await Promise.all(promises);
    }
}

;(async () => {
    const reg = new Registration();

    await reg.registerBot();
})()
