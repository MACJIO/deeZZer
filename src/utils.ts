import { config } from 'dotenv';
import crypto from 'crypto';
import { DeviceData } from './interfaces';

//load .env file to process.env
config();

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
    randHex
}
