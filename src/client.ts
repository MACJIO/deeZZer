import {DeviceData, AccountData, MediaData} from './interfaces';
import axios, { Method } from 'axios';
import {
    decryptToken, encryptPassword,
    generateAuthToken,
    generateMobileTracking,
    generateUserAgent,
    randHex
} from './utils';
// @ts-ignore
import config from '../config.json'
import md5 from 'md5';
import crypto from 'crypto';

export class Client {
    private readonly userAgent: string;
    private session: string | undefined;
    private arl: string | undefined;
    private userId: string | undefined;
    private readonly apiKey: string | undefined;
    private readonly mobileTracking: string | undefined;
    private decryptedToken: string | undefined;

    constructor(private readonly userData: AccountData, private readonly deviceData: DeviceData) {
        this.userAgent = generateUserAgent(this.deviceData);
        this.mobileTracking = generateMobileTracking(this.deviceData);
        this.apiKey = config.ANDROID_API_KEY;
    }

    public apiCaller(method: Method, type: 'https' | 'http', headers: {}, params: {}, data?: {}) {
        return axios.request({
            url: '/gateway.php',
            method,
            baseURL: type === 'http' ? config.HTTP_API_URL : config.HTTPS_API_URL,
            headers: {
                'User-Agent': this.userAgent,
                ...headers
            },
            params,
            data
        });
    }

    public async mobileAuth() {
        try {
            let res = await this.apiCaller(
                'GET',
                'http',
                {
                    'Accept-Encoding': 'gzip',
                    'Host': 'api.deezer.com',
                    'Connection': 'Keep-Alive'
                },
                {
                    network: this.deviceData.network,
                    api_key: this.apiKey,
                    version: this.deviceData.appVersion,
                    lang: this.deviceData.lang,
                    buildId: 'android_v6',
                    screenWidth: this.deviceData.screenWidth || '1080',
                    screenHeight: this.deviceData.screenHeight || '1776',
                    output: 3,
                    uniq_id: this.deviceData.uniqID,
                    method: 'mobile_auth'
                }
            );

            return res.data;
        } catch (err) {
            throw new Error(err);
        }
    }

    public async checkToken(authToken: string) {
        try {
            let res = await this.apiCaller(
                'GET',
                'http',
                {
                    'Accept-Encoding': 'gzip',
                    'Host': 'api.deezer.com',
                    'Connection': 'Keep-Alive'
                },
                {
                    api_key: this.apiKey,
                    auth_token: authToken,
                    output: 3,
                    method: 'api_checkToken'
                }
            );

            return res.data;
        } catch (err) {
            throw new Error(err);
        }
    }

    public async emailCheck() {
        try {
            if (this.session) {
                const res = await this.apiCaller(
                    'POST',
                    'https',
                    {
                        'accept-encoding': 'gzip'
                    },
                    {
                        api_key: this.apiKey,
                        sid: this.session,
                        method: 'deezer_emailCheck',
                        output: 3,
                        input: 3,
                        network: this.deviceData.network,
                        mobile_tracking: this.mobileTracking
                    },
                    {
                        'EMAIL': this.userData.email
                    }
                );

                return res.data;
            } else {
                return new Error('Session is not defined. Use initSession.');
            }
        } catch (err) {
            throw new Error(err);
        }
    }

    public async userCreate() {
        try {
            if (this.session) {
                const res = await this.apiCaller(
                    'POST',
                    'https',
                    {
                        'accept-encoding': 'gzip'
                    },
                    {
                        api_key: this.apiKey,
                        sid: this.session,
                        method: 'user_create',
                        output: 3,
                        input: 3,
                        network: this.deviceData.network,
                        mobile_tracking: this.mobileTracking
                    },
                    {
                        'BIRTHDAY': this.userData.birthday,
                        'BLOG_NAME': this.userData.blogName,
                        'EMAIL': this.userData.email,
                        // @ts-ignore
                        'PASSWORD': encryptPassword(this.userData.password, this.decryptedToken.substr(80, 16)),
                        'SEX': this.userData.sex,
                        'lang': this.userData.lang
                    }
                );

                res.data.results.ARL ? this.arl = res.data.results.ARL : null;

                return res.data;
            } else {
                return new Error('Session is not defined. Use initSession.');
            }
        } catch (err) {
            throw new Error(err);
        }
    }

    public async mobileUserAuth() {
        try {
            if (this.session) {
                const res = await this.apiCaller(
                    'POST',
                    'http',
                    {
                        'accept-encoding': 'gzip'
                    },
                    {
                        api_key: this.apiKey,
                        sid: this.session,
                        method: 'mobile_userAuth',
                        output: 3,
                        input: 3,
                        network: this.deviceData.network,
                        mobile_tracking: this.mobileTracking
                    },
                    {
                        'consent_string': '',
                        'custo_partner': '',
                        'custo_version_id': '',
                        'device_name': this.deviceData.deviceModel,
                        'device_os': this.deviceData.deviceOS,
                        'device_serial': this.deviceData.serial,
                        'device_type': this.deviceData.deviceType,
                        'google_play_services_availability': '0',
                        'mail': this.userData.email,
                        'model': this.deviceData.deviceModel,
                        // @ts-ignore
                        'password': encryptPassword(this.userData.password, this.decryptedToken.substr(80, 16)),
                        'platform': this.deviceData.deviceOS || ''
                    }
                );

                res.data.results.ARL ? this.arl = res.data.results.ARL : null;

                return res.data;
            } else {
                return new Error('Session is not defined. Use initSession.');
            }
        } catch (err) {
            throw new Error(err);
        }
    }

    public async mobileUserAutoLog() {
        try {
            if (this.session) {
                if (this.arl) {
                    const res = await this.apiCaller(
                        'POST',
                        'https',
                        {
                            'accept-encoding': 'gzip',
                            'Host': 'api.deezer.com',
                            'Connection': 'Keep-Alive'
                        },
                        {
                            api_key: this.apiKey,
                            sid: this.session,
                            method: 'mobile_userAutolog',
                            output: 3,
                            input: 3,
                            network: this.deviceData.network,
                            mobile_tracking: this.mobileTracking
                        },
                        {
                            'ACCOUNT_ID': '',
                            'ARL': this.arl,
                            'consent_string': '',
                            'custo_partner': '',
                            'custo_version_id': '',
                            'device_name': this.deviceData.deviceModel,
                            'device_os': this.deviceData.deviceOS,
                            'device_serial': this.deviceData.serial,
                            'device_type': this.deviceData.deviceType,
                            'google_play_services_availability': '0',
                            'model': this.deviceData.deviceModel,
                            'platform': this.deviceData.deviceOS
                        }
                    );



                    return res.data;
                } else {
                    return new Error("ARL is not defined.");
                }
            } else {
                return new Error('Session is not defined. Use initSession.');
            }
        } catch (err) {
            throw new Error(err);
        }
    }

    public async trialEnable() {
        try {
            if (this.session) {
                const res = await this.apiCaller(
                    'POST',
                    'https',
                    {
                        'accept-encoding': 'gzip'
                    },
                    {
                        api_key: this.apiKey,
                        sid: this.session,
                        method: 'trial_enable',
                        output: 3,
                        input: 3,
                        network: this.deviceData.network,
                        mobile_tracking: this.mobileTracking
                    },
                    {
                        'ORIGIN': ''
                    }
                );

                res.data.results.USER_ID ? this.userId = res.data.results.USER_ID : null;

                return res.data;
            } else {
                return new Error('Session is not defined. Use initSession.');
            }
        } catch (err) {
            throw new Error(err);
        }
    }

    public async logListen(nextMedia: MediaData, currentMedia: MediaData, pageContext: MediaData, listenTime: number, currentTime: number) {
        try {
            if (this.session) {
                const res = await this.apiCaller(
                    'POST',
                    'https',
                    {
                        'accept-encoding': 'gzip'
                    },
                    {
                        api_key: this.apiKey,
                        sid: this.session,
                        method: 'log.listen',
                        output: 3,
                        input: 3,
                        network: this.deviceData.network,
                        mobile_tracking: this.mobileTracking
                    },
                    {
                        'next_media': {
                            'media': {
                                'id': nextMedia.id,
                                'type': nextMedia.type
                            }
                        },
                        'params': {
                            'ctxt': {
                                'c': pageContext.id,
                                'id': pageContext.id,
                                't': pageContext.type
                            },
                            'dev': {
                                't': '30',
                                'v': 'OnePlus_A0001_9_6.1.18.94'
                            },
                            'device': {
                                'cpu_count': this.deviceData.cpuCount,
                                'cpu_max_frequency': this.deviceData.cpuMaxFrequency,
                                'ram': this.deviceData.ram
                            },
                            'is_shuffle': false,
                            'l_30sec': 0,
                            'lt': listenTime,
                            'media': {
                                'format': currentMedia.format,
                                'id': currentMedia.id,
                                'type': currentMedia.type
                            },
                            'network': {
                                'subtype': 'wifi',
                                'type': 'LAN'
                            },
                            'repeat_type': 'repeat_all',
                            'stat': {
                                'conn': 'LAN',
                                'media_format': currentMedia.format,
                                'pause': 0,
                                'player_version': 'jukebox_exo_player_2',
                                'seek': 0,
                                'sync': 1
                            },
                            'ts_listen': currentTime,
                            'type': 0
                        }
                    }
                );

                return res.data;
            } else {
                return new Error('Session is not defined. Use initSession.');
            }
        } catch (err) {
            throw new Error(err);
        }
    }

    public async mobileAddSongsAndGetSongs(playListId: string, songs: Array<string>, NB: string) {
        try {
            if (this.session) {
                const res = await this.apiCaller(
                    'POST',
                    'https',
                    {
                        'accept-encoding': 'gzip'
                    },
                    {
                        api_key: this.apiKey,
                        sid: this.session,
                        method: 'mobile_addSongsAndGetSongs',
                        output: 3,
                        input: 3,
                        network: this.deviceData.network,
                        mobile_tracking: this.mobileTracking
                    },
                    {
                        'PLAYLIST_ID': '7568612802',
                        'SONGS': [
                            ...songs.map((song, i) => [song, i.toString()])
                        ],
                        'NB': NB
                    }
                );

                return res.data;
            } else {
                return new Error('Session is not defined. Use initSession.');
            }
        } catch (err) {
            throw new Error(err);
        }
    }

    public async mobileSuggest(query: string, NB: string) {
        try {
            if (this.session) {
                if (this.userId) {
                    const res = await this.apiCaller(
                        'POST',
                        'https',
                        {
                            'accept-encoding': 'gzip'
                        },
                        {
                            api_key: this.apiKey,
                            sid: this.session,
                            method: 'mobile_suggest',
                            output: 3,
                            input: 3,
                            network: this.deviceData.network,
                            mobile_tracking: this.mobileTracking
                        },
                        {
                            'QUERY': query,
                            'NB': NB,
                            'TYPES': ['ALBUM', 'ARTIST', 'PLAYLIST', 'RADIO', 'SHOW', 'TRACK', 'USER', 'CHANNEL', 'LIVESTREAM', 'EPISODE'],
                            'USER_ID': this.userId
                        }
                    );

                    return res.data;
                } else {
                    return new Error('User id is undefined.');
                }
            } else {
                return new Error('Session is not defined. Use initSession.');
            }
        } catch (err) {
            throw new Error(err);
        }
    }

    public async playlistGetSongs(playListId: string, start: string, NB: string) {
        try {
            if (this.session) {
                const res = await this.apiCaller(
                    'POST',
                    'https',
                    {
                        'accept-encoding': 'gzip'
                    },
                    {
                        api_key: this.apiKey,
                        sid: this.session,
                        method: 'playlist_getSongs',
                        output: 3,
                        input: 3,
                        network: this.deviceData.network,
                        mobile_tracking: this.mobileTracking
                    },
                    {
                        'PLAYLIST_ID': playListId,
                        'START': start,
                        'NB': NB
                    }
                );

                return res.data;
            } else {
                return new Error('Session is not defined. Use initSession.');
            }
        } catch (err) {
            throw new Error(err);
        }
    }

    public async initSession() {
        try {
            let token = (await this.mobileAuth()).results.TOKEN;

            this.decryptedToken = decryptToken(token);
            let authToken = generateAuthToken(this.decryptedToken.substr(0, 64), this.decryptedToken.substr(64, 16));

            this.session = (await this.checkToken(authToken)).results;
        } catch (err) {
            throw new Error(err);
        }
    }

    public generateMusicLoadLink(MD5Origin: string, songId: string, mediaVersion: string, trackType: string, i: number = 1) {
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
            .createCipheriv('aes-128-ecb', config.MUSIC_TOKEN_CIPHER_KEY, null)
            .setAutoPadding(false);

        let token: string = cipher.update(str8, undefined, 'hex');
        token += cipher.final('hex');

        return 'http://e-cdn-proxy-' + MD5Origin[0] + '.deezer.com/mobile/1/' + token;
    };

    get getSession() {
        return this.session;
    }

    get getDecToken() {
        return this.decryptedToken;
    }

    get getARL() {
        return this.arl;
    }
}
