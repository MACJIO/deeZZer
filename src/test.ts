import {createPrivateKey} from "crypto";
import {randHex} from "./utils";

const { Client } = require('./client');

//test user data
const userData = {
    email: 'test3@eoeeee.com',
    password: 'somepassword',
    birthday: '1234-12-12',
    blogName: 'asssss',
    sex: 'F',
    lang: 'us'
};

//test device data
const deviceData = {
    platform: 'Android',
    platformVersion: '8.1.0',
    deviceType: 'Mobile',
    deviceModel: 'Sony Xperia Z',
    lang: 'us',
    appVersion: '6.1.18.94',
    androidID: randHex(16),
    network: randHex(64),
    uniqID: randHex(32),
};

const client = new Client(userData, deviceData);

(async () => {
    await client.initSession();

    console.log('Session Id:', client.getSession);
    console.log('Decrypted token:', client.getDecToken);

    const regRes = await client.userCreate();
    console.log('Sign up response:', regRes);
    console.log('ARL:', client.getARL);

    const autoLog = await client.mobileUserAutoLog();
    console.log('Mobile user auto log:', autoLog);

    const trialRes = await client.trialEnable();
    console.log('Trial enable response:', trialRes);
})();




