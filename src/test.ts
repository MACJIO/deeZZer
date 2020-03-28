import { Client } from './client';
import { Api } from './api';

//test user data
const userData = {
    email: 'ass@clown.com',
    password: '1448'
};

//test device data
const deviceData = {
    platform: 'Android',
    platformVersion: '8.1.0',
    deviceType: 'mobile',
    deviceModel: 'Sony Xperia Z',
    lang: 'us',
    appVersion: '6.1.18.94'
};

const api = new Api(deviceData);

const test = async () => {
    const client = new Client(userData, deviceData);

    await client.initSession();

    console.log(client.getSession());
};

test();

