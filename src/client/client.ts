import {AccountData, DeviceData, MediaData, Proxy} from '../interfaces';
import axios, {AxiosRequestConfig, Method} from 'axios';
import * as tunnel from 'tunnel';
import {
    decryptToken,
    encryptPassword,
    generateAuthToken,
    generateMobileTracking,
    generateNetwork,
    generateUserAgent,
    randHex,
} from '../utils';
import config from '../../config.json'
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
    private proxy: Proxy | undefined;

    constructor(
        private readonly account: AccountData,
        private readonly device: DeviceData
    ) {
        if (!device.OS) {
            this.device.OS = {
                name: 'Android',
                version: '8.0.0',
                androidId: randHex(16)
            }
        }
        if (!device.appVersion)
            this.device.appVersion = '6.1.18.94';
        this.userAgent = generateUserAgent(this.device);
        this.mobileTracking = generateMobileTracking(this.device);
        this.apiKey = config.APP.ANDROID_API_KEY;
    }

    /**
     * Gets client session.
     */
    get getSession() {
        return this.session;
    }

    /**
     * Gets client ARL.
     */
    get getARL() {
        return this.arl;
    }

    /**
     * Gets client user id.
     */
    get getUserId() {
        return this.userId;
    }

    /**
     * Gets client proxy.
     */
    get getProxy() {
        return this.proxy || null;
    }

    /**
     * Sets proxy for client.
     *
     * @param {Proxy} proxy
     */
    public setProxy(proxy: Proxy) {
        this.proxy = proxy;
    }

    /**
     * Calls deezer API. If the session has not been initialized, initializes it.
     *
     * @param {Method}           method
     * @param {'http' | 'https'} type
     * @param {Object}           headers
     * @param {Object}           params  Query params.
     * @param {Object}           data    Optional. Request payload.
     */
    public async apiCaller(method: Method, type: 'https' | 'http', headers: {}, params: {}, data?: {}) {
        let axiosConfig: AxiosRequestConfig = {
            url: '/gateway.php',
            method,
            headers: {
                'User-Agent': this.userAgent,
                ...headers
            },
            params,
            data
        };
        if (type == 'http') {
            axiosConfig.baseURL = config.APP.HTTP_API_URL;
            if (this.proxy) {
                axiosConfig.httpAgent = tunnel.httpOverHttp({
                    proxy: {
                        host: this.proxy.host,
                        port: this.proxy.port
                    }
                });
                axiosConfig.proxy = false;
            }
        } else {
            axiosConfig.baseURL = config.APP.HTTPS_API_URL;
            if (this.proxy) {
                axiosConfig.baseURL = config.APP.HTTPS_API_URL_WITH_PORT;
                axiosConfig.httpAgent = tunnel.httpsOverHttp({
                    proxy: {
                        host: this.proxy.host,
                        port: this.proxy.port
                    }
                });
                axiosConfig.proxy = false;
            }
        }

        try {
            const res = await axios.request(axiosConfig);

            if ('NEED_API_AUTH_REQUIRED' in res.data.error)
                if (res.data.error.NEED_API_AUTH_REQUIRED === 'Require API auth') {
                    await this.initSession();
                    console.log('Session not defined. Try to reinitialize.');
                    // @ts-ignore
                    params.sid = this.session;
                    await this.apiCaller(method, type, headers, params, data);
                }
            return res.data;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Deezer API method that asks for TOKEN.
     */
    public async mobileAuth() {
        try {
            return await this.apiCaller(
                'GET',
                'http',
                {
                    'Accept-Encoding': 'gzip',
                    'Host': 'api.deezer.com',
                    'Connection': 'Keep-Alive'
                },
                {
                    network: generateNetwork(),
                    api_key: this.apiKey,
                    version: this.device.appVersion,
                    lang: this.device.lang,
                    buildId: 'android_v6',
                    screenWidth: this.device.screenWidth || '1080',
                    screenHeight: this.device.screenHeight || '1776',
                    output: 3,
                    uniq_id: this.device.uniqID,
                    method: 'mobile_auth'
                }
            );
        } catch (err) {
            throw new Error(err);
        }
    }

    /**
     * Deezer API methods that asks for session id.
     *
     * @param authToken Generated using TOKEN.
     */
    public async checkToken(authToken: string) {
        try {
            return await this.apiCaller(
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
        } catch (err) {
            throw new Error(err);
        }
    }

    /**
     * Deezer API method that validates email.
     */
    public async emailCheck() {
        try {
            return await this.apiCaller(
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
                    network: generateNetwork(),
                    mobile_tracking: this.mobileTracking
                },
                {
                    'EMAIL': this.account.email
                }
            );
        } catch (err) {
            throw new Error(err);
        }
    }

    /**
     * Deezer API method that sings up user.
     */
    public async userCreate() {
        try {
            const data = await this.apiCaller(
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
                    network: generateNetwork(),
                    mobile_tracking: this.mobileTracking
                },
                {
                    'BIRTHDAY': this.account.birthday,
                    'BLOG_NAME': this.account.blogName,
                    'EMAIL': this.account.email,
                    // @ts-ignore
                    'PASSWORD': encryptPassword(this.account.password, this.decryptedToken.substr(80, 16)),
                    'SEX': this.account.sex,
                    'lang': this.account.lang
                }
            );

            data.error.length === 0 ? this.arl = data.results : null;

            return data;
        } catch (err) {
            throw new Error(err);
        }
    }

    /**
     * Deezer API method that sings in user.
     * Also it inits user id and ARL.
     */
    public async mobileUserAuth() {
        try {
            const data = await this.apiCaller(
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
                    network: generateNetwork(),
                    mobile_tracking: this.mobileTracking
                },
                {
                    'consent_string': '',
                    'custo_partner': '',
                    'custo_version_id': '',
                    'device_name': this.device.model,
                    'device_os': this.device.OS?.name,
                    'device_serial': this.device.serial,
                    'device_type': 'phone',
                    'google_play_services_availability': '0',
                    'mail': this.account.email,
                    'model': this.device.model,
                    // @ts-ignore
                    'password': encryptPassword(this.account.password, this.decryptedToken.substr(80, 16)),
                    'platform': this.device.OS || ''
                }
            );

            data.results.ARL ? this.arl = data.results.ARL : null;
            data.results.USER_ID ? this.userId = data.results.USER_ID : null;

            return data;
        } catch (err) {
            throw new Error(err);
        }
    }

    /**
     * Deezer API method that asks for user log.
     */
    public async mobileUserAutoLog() {
        try {
            if (this.arl) {
                return await this.apiCaller(
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
                        network: generateNetwork(),
                        mobile_tracking: this.mobileTracking
                    },
                    {
                        'ACCOUNT_ID': '',
                        'ARL': this.arl,
                        'consent_string': '',
                        'custo_partner': '',
                        'custo_version_id': '',
                        'device_name': this.device.model,
                        'device_os': this.device.OS?.name,
                        'device_serial': this.device.serial,
                        'device_type': this.device.type,
                        'google_play_services_availability': '0',
                        'model': this.device.model,
                        'platform': this.device.OS?.name
                    }
                );
            } else {
                return new Error("ARL is not defined.");
            }
        } catch (err) {
            throw new Error(err);
        }
    }

    /**
     * Deezer API method that enables 15 days free trial.
     */
    public async trialEnable() {
        try {
            const data = await this.apiCaller(
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
                    network: generateNetwork(),
                    mobile_tracking: this.mobileTracking
                },
                {
                    'ORIGIN': ''
                }
            );

            data.results.USER_ID ? this.userId = data.results.USER_ID : null;

            return data;
        } catch (err) {
            throw new Error(err);
        }
    }

    /**
     * Deezer API method that logs listen activity.
     *
     * @param nextMedia
     * @param currentMedia
     * @param pageContext  Current page context.
     * @param listenTime   Listen duration in seconds.
     * @param currentTime  Current unix timestamp.
     */
    public async logListen(
        nextMedia: MediaData, currentMedia: MediaData, pageContext: MediaData, listenTime: number, currentTime: number
    ) {
        try {
            return await this.apiCaller(
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
                    network: generateNetwork(),
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
                            'v': this.device.model + randHex(3)
                        },
                        'device': {
                            'cpu_count': this.device.cpuCount || '',
                            'cpu_max_frequency': this.device.cpuMaxFrequency || '',
                            'ram': this.device.ram || ''
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
        } catch (err) {
            throw new Error(err);
        }
    }

    /**
     * Deezer API method that adds songs to playlist by playlist id and asks for songs data.
     *
     * @param playListId
     * @param songs
     * @param NB
     */
    public async mobileAddSongsAndGetSongs(playListId: string, songs: Array<string>, NB: string) {
        try {
            return await this.apiCaller(
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
                    network: generateNetwork(),
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
        } catch (err) {
            throw new Error(err);
        }
    }

    /**
     * Deezer API method that asks for search suggestions.
     *
     * @param query
     * @param NB
     */
    public async mobileSuggest(query: string, NB: string) {
        try {
            if (this.userId) {
                return await this.apiCaller(
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
                        network: generateNetwork(),
                        mobile_tracking: this.mobileTracking
                    },
                    {
                        'QUERY': query,
                        'NB': NB,
                        'TYPES': ['ALBUM', 'ARTIST', 'PLAYLIST', 'RADIO', 'SHOW', 'TRACK', 'USER', 'CHANNEL', 'LIVESTREAM', 'EPISODE'],
                        'USER_ID': this.userId
                    }
                );
            } else {
                return new Error('User id is undefined.');
            }
        } catch (err) {
            throw new Error(err);
        }
    }

    /**
     * Deezer API method that asks for playlist data by playlist id
     *
     * @param playListId
     * @param start
     * @param NB
     */
    public async playlistGetSongs(playListId: string, start: string, NB: string) {
        try {
            return await this.apiCaller(
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
                    network: generateNetwork(),
                    mobile_tracking: this.mobileTracking
                },
                {
                    'PLAYLIST_ID': playListId,
                    'START': start,
                    'NB': NB
                }
            );
        } catch (err) {
            throw new Error(err);
        }
    }

    /**
     * Initialises client session.
     */
    public async initSession() {
        try {
            let token = (await this.mobileAuth()).results.TOKEN;

            this.decryptedToken = decryptToken(token);
            let authToken = generateAuthToken(this.decryptedToken.substr(0, 64), this.decryptedToken.substr(64, 16));

            this.session = (await this.checkToken(authToken)).results;
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * Generates link for downloading music from deezer.
     *
     * @param MD5Origin
     * @param songId
     * @param mediaVersion
     * @param trackType
     * @param i
     */
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
            .createCipheriv('aes-128-ecb', config.APP.MUSIC_TOKEN_CIPHER_KEY, null)
            .setAutoPadding(false);

        let token: string = cipher.update(str8, undefined, 'hex');
        token += cipher.final('hex');

        return 'http://e-cdn-proxy-' + MD5Origin[0] + '.deezer.com/mobile/1/' + token;
    };
}
