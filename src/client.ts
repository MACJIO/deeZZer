import {DeviceData, AccountData, MediaData} from './interfaces';
import axios, { Method } from 'axios';
import {
    decryptToken, encryptPassword,
    generateAuthToken,
    generateMobileTracking,
    generateUserAgent,
    randHex
} from './utils';
import { config } from 'dotenv';

config();

export class Client {
    private readonly userAgent: string;
    private session: string | null = null;
    private readonly apiKey: string | undefined;
    private readonly mobileTracking: string | undefined;
    private decryptedToken: string | undefined;

    constructor(private readonly userData: AccountData, private readonly deviceData: DeviceData) {
        this.userAgent = generateUserAgent(this.deviceData);
        this.mobileTracking = generateMobileTracking(this.deviceData);
        this.apiKey = process.env.ANDROID_API_KEY;
    }

    public apiCaller(method: Method, type: 'https' | 'http', headers: {}, params: {}, data?: {}) {
        return axios.request({
            url: '/gateway.php',
            method,
            baseURL: type === 'http' ? process.env.HTTP_API_URL : process.env.HTTPS_API_URL,
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
        } catch (err) {
            throw new Error(err);
        }
    }

    public async userCreate() {
        try {
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
                    "BIRTHDAY": this.userData.birthday,
                    "BLOG_NAME": this.userData.blogName,
                    "EMAIL": this.userData.email,
                    // @ts-ignore
                    "PASSWORD": encryptPassword(this.userData.password, this.decryptedToken.substr(80, 16)),
                    "SEX": this.userData.sex,
                    "lang": this.userData.lang
                }
            );

            //may be I should move this initialization
            if (res.data.error.length == 0) {
                this.userData.arl = res.data.results;
            }

            return res.data;
        } catch (err) {
            throw new Error(err);
        }
    }

    public async mobileUserAuth() {
        try {
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
                    "consent_string": "",
                    "custo_partner": "",
                    "custo_version_id": "",
                    "device_name": this.deviceData.deviceModel,
                    "device_os": this.deviceData.platform,
                    "device_serial": this.deviceData.serial,
                    "device_type": this.deviceData.deviceType,
                    "google_play_services_availability": "0",
                    "mail": this.userData.email,
                    "model": this.deviceData.deviceModel,
                    // @ts-ignore
                    "password": encryptPassword(this.userData.password, this.decryptedToken.substr(80, 16)),
                    "platform": this.deviceData.platform || ""
                }
            );

            //may be I should move this initialization
            if (res.data.error.length == 0) {
                this.userData.arl = res.data.results.ARL;
            }

            return res.data;
        } catch (err) {
            throw new Error(err);
        }
    }

    public async mobileUserAutoLog() {
        try {
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
                    "ACCOUNT_ID": "",
                    "ARL": this.userData.arl,
                    "consent_string": "",
                    "custo_partner": "",
                    "custo_version_id": "",
                    "device_name": this.deviceData.deviceModel,
                    "device_os": this.deviceData.platform,
                    "device_serial": this.deviceData.serial,
                    "device_type": this.deviceData.deviceType,
                    "google_play_services_availability": "0",
                    "model": this.deviceData.deviceModel,
                    "platform": this.deviceData.platform
                }
            );

            return res.data;
        } catch (err) {
            throw new Error(err);
        }
    }

    public async trialEnable() {
        try {
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
                    "ORIGIN": ""
                }
            );

            return res.data;
        } catch (err) {
            throw new Error(err);
        }
    }

    public async logListen(nextMedia: MediaData, currentMedia: MediaData, pageContext: MediaData, listenTime: number, currentTime: number) {
        try {
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
                    "next_media": {
                        "media": {
                            "id": nextMedia.id,
                            "type": nextMedia.type
                        }
                    },
                    "params": {
                        "ctxt": {
                            "c": pageContext.id,
                            "id": pageContext.id,
                            "t": pageContext.type
                        },
                        "dev": {
                            "t": "30",
                            "v": "OnePlus_A0001_9_6.1.18.94"
                        },
                        "device": {
                            "cpu_count": this.deviceData.cpuCount,
                            "cpu_max_frequency": this.deviceData.cpuMaxFrequency,
                            "ram": this.deviceData.ram
                        },
                        "is_shuffle": false,
                        "l_30sec": 0,
                        "lt": listenTime,
                        "media": {
                            "format": currentMedia.format,
                            "id": currentMedia.id,
                            "type": currentMedia.type
                        },
                        "network": {
                            "subtype": "wifi",
                            "type": "LAN"
                        },
                        "repeat_type": "repeat_all",
                        "stat": {
                            "conn": "LAN",
                            "media_format": currentMedia.format,
                            "pause": 0,
                            "player_version": "jukebox_exo_player_2",
                            "seek": 0,
                            "sync": 1
                        },
                        "ts_listen": currentTime,
                        "type": 0
                    }
                }
            );

            return res.data;
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

    get getSession() {
        return this.session;
    }

    get getDecToken() {
        return this.decryptedToken;
    }

    get getARL() {
        return this.userData.arl;
    }
}
