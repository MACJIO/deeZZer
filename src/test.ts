import { randHex } from './utils';
import { MediaData } from './interfaces';

const { Client } = require('./client');

//test user data
const userData = {
    email: 'test4@eoe.com',
    password: 'somepassword',
    birthday: '1234-12-12',
    blogName: 'asssss',
    sex: 'F',
    lang: 'us'
};

//TODO: add needed props to DevData interface
//test device data
const deviceData = {
    deviceOS: 'Android',
    deviceOSVersion: '8.1.0',
    deviceType: 'Mobile',
    deviceModel: 'Sony Xperia Z',
    lang: 'us',
    appVersion: '6.1.18.94',
    androidID: randHex(16),
    network: randHex(64),
    uniqID: randHex(32),
    serial: randHex(64)
};

const client = new Client(userData, deviceData);

const signUpAndGetFreeTrial = async () => {
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
};

const signIn = async () => {
    await client.initSession();

    console.log('Session Id:', client.getSession);
    console.log('Decrypted token:', client.getDecToken);

    const loginRes = await client.mobileUserAuth();
    console.log('Sign in response:', loginRes);

    return client;
};

const listenSongWithOutLoad = async () => {
    const client = await signIn();

    const currSong: MediaData = {
        id: '847637202',
        type: 'song',
        format: 'MP3_128'
    };

    const nextSong: MediaData = {
        id: '881753802',
        type: 'song',
        format: 'MP3_128'
    };

    const pageCtx: MediaData = {
        id: '292185',
        type: 'artist_top'
    };

    const res = await client.logListen(nextSong, currSong, pageCtx, 30, Math.floor(Date.now() / 1000));
    console.log('Log.listen res:', res);
};

signIn();
