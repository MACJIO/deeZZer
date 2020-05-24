import crypto from 'crypto';
import { AccountData, DeviceData } from './interfaces';

// @ts-ignore
import randomLorem from 'random-lorem';

import config from '../config.json';

const padding = (data: Buffer): Buffer => {
    const res = Buffer.alloc((data.length + 15) & ~0xF, 0);
    data.copy(res);

    return res;
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
        .createDecipheriv('aes-128-ecb', <string>config.APP.TOKEN_DECIPHER_KEY, null)
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
        if (deviceData.OS?.name === 'Android') {
            return 'Deezer/' + deviceData.appVersion +
                ' (Android; ' + deviceData.OS?.version + '; ' +
                deviceData.type + '; ' +
                deviceData.lang + ') ' +
                deviceData.name;
        } else {
            throw new Error('Unimplemented for IOS.');
        }
    } else {
        throw new Error('Device data is not defined.');
    }
};

const generateMobileTracking = (deviceData: DeviceData) => {
    const mobileTracking = {
        oursecret: config.APP.MOBILE_TRACKING_SECRET,
        androidID: deviceData.OS?.androidId,
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

const generateNetwork = (mcc: string = '000', mnc: string = '000'): string => {
    const data = mcc + '+++' + mnc + '+++' + Math.floor(Date.now() / 1000);

    const cipher = crypto
        .createCipheriv('aes-128-ecb', config.APP.NETWORK_CIPHER_KEY, null)
        .setAutoPadding(false);

    let network: string = cipher.update(padding(Buffer.from(data)), undefined, 'hex');
    network += cipher.final('hex');

    return network;
};

const emailDomains = {
    /* Default domains included */
    default: ['aol.com', 'att.net', 'comcast.net', 'facebook.com', 'gmail.com', 'gmx.com', 'googlemail.com',
    'google.com', 'hotmail.com', 'hotmail.co.uk', 'mac.com', 'me.com', 'mail.com', 'msn.com',
    'live.com', 'sbcglobal.net', 'verizon.net', 'yahoo.com', 'yahoo.co.uk'],

    /* United States ISP domains */
    US: ['bellsouth.net', 'charter.net', 'cox.net', 'earthlink.net', 'juno.com'],

    /* British ISP domains */
    GB: ['btinternet.com', 'virginmedia.com', 'blueyonder.co.uk', 'freeserve.co.uk', 'live.co.uk',
    'ntlworld.com', 'o2.co.uk', 'orange.net', 'sky.com', 'talktalk.co.uk', 'tiscali.co.uk',
    'virgin.net', 'wanadoo.co.uk', 'bt.com'],

    /* French ISP domains */
    FR: ['hotmail.fr', 'live.fr', 'laposte.net', 'yahoo.fr', 'wanadoo.fr', 'orange.fr', 'gmx.fr', 'sfr.fr', 'neuf.fr', 'free.fr'],

    /* German ISP domains */
    DE: ['gmx.de', 'hotmail.de', 'live.de', 'online.de', 't-online.de' /* T-Mobile */, 'web.de', 'yahoo.de'],

    /* Italian ISP domains */
    IT: ['libero.it', 'virgilio.it', 'hotmail.it', 'aol.it', 'tiscali.it', 'alice.it', 'live.it', 'yahoo.it', 'email.it', 'tin.it', 'poste.it', 'teletu.it'],

    /* Russian ISP domains */
    RU: ['mail.ru', 'rambler.ru', 'yandex.ru', 'ya.ru', 'list.ru'],

    /* Belgian ISP domains */
    BE: ['hotmail.be', 'live.be', 'skynet.be', 'voo.be', 'tvcablenet.be', 'telenet.be'],

    /* Argentinian ISP domains */
    AR: ['hotmail.com.ar', 'live.com.ar', 'yahoo.com.ar', 'fibertel.com.ar', 'speedy.com.ar', 'arnet.com.ar'],

    /* Domains used in Mexico */
    MX: ['yahoo.com.mx', 'live.com.mx', 'hotmail.es', 'hotmail.com.mx', 'prodigy.net.mx'],

    /* Domains used in Canada */
    CA: ['yahoo.ca', 'hotmail.ca', 'bell.net', 'shaw.ca', 'sympatico.ca', 'rogers.com'],

    /* Domains used in Brazil */
    BR: ['yahoo.com.br', 'hotmail.com.br', 'outlook.com.br', 'uol.com.br', 'bol.com.br', 'terra.com.br', 'ig.com.br', 'itelefonica.com.br', 'r7.com', 'zipmail.com.br', 'globo.com', 'globomail.com', 'oi.com.br']
};

const generateEmail = (country: string = 'default') => {
    !emailDomains.hasOwnProperty(country) ? country = 'default' : null;

    // @ts-ignore
    let domains = emailDomains[country];

    return randomLorem({ min: 3, max: 10 }) + '@' + domains[randVal(domains.length)];
};

const generateBirthday = () => {
    let year = 2020 - randVal(50) - 17;
    return year + '-01-01';
};

const generateAccount = (country?: string): AccountData => {
    return {
        blogName: <string>randomLorem({ min: 4, max: 10 }),
        email: generateEmail(country),
        password: randomLorem({ min: 8, max: 12 }),
        birthday: generateBirthday(),
        lang: country?.toLocaleLowerCase() || 'us',
        sex: new Date().toString().indexOf('54') !== -1 ? 'F' : 'M'
    }
};

const delay = async (seconds: number) => {
    return await new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

export {
    decryptToken,
    generateAuthToken,
    generateUserAgent,
    generateMobileTracking,
    randHex,
    encryptPassword,
    decryptPassword,
    padding,
    generateNetwork,
    generateAccount,
    randVal,
    delay
}
