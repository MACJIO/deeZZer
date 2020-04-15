import { config } from 'dotenv';
import crypto from 'crypto';
import { DeviceData } from './interfaces';
import md5 from 'md5';

//load .env file to process.env
config();

const padding = (data: Buffer): Buffer => {
    const res = Buffer.alloc((data.length + 15) & ~0xF, 0);
    data.copy(res);

    return res;
};

const generateLink = (MD5Origin: string, songId: string, mediaVersion: string, trackType: string, i: number = 1) => {
    let str6;
    let del = Buffer.alloc(1, 0xa4);
    if (trackType !== '3') {
        str6 = Buffer.alloc(0);
    } else {
        str6 = Buffer.concat([del, Buffer.from('1')]);
    }

    let str7 = Buffer.concat([
        Buffer.from(MD5Origin),
        del,
        Buffer.from(i.toString()),
        del,
        Buffer.from(songId),
        del,
        Buffer.from(mediaVersion),
        str6
    ]);

    let str8 = Buffer.concat([
        Buffer.from(md5(str7)),
        del,
        str7,
        del
    ]);

    // @ts-ignore
    const cipher = crypto
        .createCipheriv('aes-128-ecb', process.env.MUSIC_TOKEN_CIPHER_KEY, null)
        .setAutoPadding(false);

    let token: string = cipher.update(str8, undefined, 'hex');
    token += cipher.final('hex');

    return 'http://e-cdn-proxy-' + MD5Origin[0] + '.deezer.com/mobile/1/' + token;
};

const encryptPassword = (password: string, key: string): string => {
    const cipher = crypto
        .createCipheriv('aes-128-ecb', key, null)
        .setAutoPadding(false);

    //@ts-ignore
    let encryptedPassword: string = cipher.update(padding(Buffer.from(password)), 'hex', 'hex');
    encryptedPassword += cipher.final('hex');

    return encryptedPassword;
};

const decryptPassword = (password: string, key: string): string => {
    const decipher = crypto
        .createDecipheriv('aes-128-ecb', key, null)
        .setAutoPadding(false);

    // @ts-ignore
    let decryptedPassword: string = decipher.update(Buffer.from(password, 'hex'), undefined, 'hex');
    decryptedPassword += decipher.final('hex');

    return decryptedPassword;
};

const decryptToken = (token: string): string => {
    const decipher = crypto
        .createDecipheriv('aes-128-ecb', <string>process.env.TOKEN_DECIPHER_KEY, null)
        .setAutoPadding(false);

    // @ts-ignore
    let decryptedToken: string = decipher.update(Buffer.from(token, 'hex'), undefined, 'utf-8');
    decryptedToken += decipher.final('utf-8');

    return decryptedToken
};

const generateAuthToken = (token: string, key: string): string => {
    const cipher = crypto
        .createCipheriv('aes-128-ecb', key, null)
        .setAutoPadding(false);

    // @ts-ignore
    let authToken: string = cipher.update(token, 'utf-8', 'hex');
    authToken += cipher.final('hex');

    return authToken;
};

const generateUserAgent = (deviceData: DeviceData): string => {
    if (deviceData) {
        if (deviceData.platform === 'Android') {
            return 'Deezer/' + deviceData.appVersion +
                ' (Android; ' + deviceData.platformVersion + '; ' +
                deviceData.deviceType + '; ' +
                deviceData.lang + ') ' +
                deviceData.deviceModel;
        } else {
            throw new Error('Unimplemented for IOS.');
        }
    } else {
        throw new Error('Device data is not defined.');
    }
};

const generateMobileTracking = (deviceData: DeviceData) => {
    const mobileTracking = {
        oursecret: process.env.MOBILE_TRACKING_SECRET,
        androidID: deviceData.androidID,
        macAddress: '02:00:00:00:00:00',
        device_type: 'android',
        app_id: 'deezer.android.app'
    };

    return Buffer.from(JSON.stringify(mobileTracking)).toString('base64');
};

const randVal = (max: number): number => {
    return Math.floor(Math.random() * max);
};

const randHex = (length: number): string => {
    let alphabet = '123456789abcdef';
    let res = '';
    for (let i = 0; i < length; i++) {
        res += alphabet[randVal(alphabet.length)];
    }
    return res;
};

export {
    decryptToken,
    generateAuthToken,
    generateUserAgent,
    generateMobileTracking,
    randHex,
    encryptPassword,
    decryptPassword,
    padding,
    generateLink
}
