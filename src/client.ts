import { DeviceData, UserData } from './interfaces';
import axios, { Method } from 'axios';
import {
    decryptToken,
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
    private arl: string | null = null;
    //TODO: Make network and uniqId generation
    private network: string = randHex(64);
    private uniqId: string = randHex(32);
    private readonly apiKey: string | undefined;
    private readonly mobileTracking: string | undefined;

    constructor(private readonly userData: UserData, private readonly deviceData: DeviceData) {
        this.userAgent = generateUserAgent(this.deviceData);
        this.mobileTracking = generateMobileTracking();
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
                    network: this.network,
                    api_key: this.apiKey,
                    version: this.deviceData.appVersion,
                    lang: this.deviceData.lang,
                    buildId: 'android_v6',
                    screenWidth: this.deviceData.screenWidth || '1080',
                    screenHeight: this.deviceData.screenHeight || '1776',
                    output: 3,
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

    public async emailCheck(sid: string, email: string) {
        try {
            const res = await this.apiCaller(
                'POST',
                'https',
                {
                    'accept-encoding': 'gzip'
                },
                {
                    api_key: this.apiKey,
                    sid,
                    method: 'deezer_emailCheck',
                    output: 3,
                    input: 3,
                    network: this.network,
                    mobile_tracking: this.mobileTracking
                },
                {
                    'EMAIL': email
                }
            );

            return res.data;
        } catch (err) {
            throw new Error(err);
        }
    }

    public async userCreate(sid: string, userData: UserData) {
        try {
            const res = await this.apiCaller(
                'POST',
                'https',
                {
                    'accept-encoding': 'gzip'
                },
                {
                    api_key: this.apiKey,
                    sid,
                    method: 'user_create',
                    output: 3,
                    input: 3,
                    network: this.network,
                    mobile_tracking: this.mobileTracking
                },
                {
                    "BIRTHDAY": userData.birthday,
                    "BLOG_NAME": userData.blogName,
                    "EMAIL": userData.email,
                    "PASSWORD": userData.password,
                    "SEX": userData.sex,
                    "lang": userData.lang
                }
            );

            return res.data;
        } catch (err) {
            throw new Error(err);
        }
    }

    public async mobileUserAuth(sid: string, userData: UserData) {
        try {
            const res = await this.apiCaller(
                'POST',
                'http',
                {
                    'accept-encoding': 'gzip'
                },
                {
                    api_key: this.apiKey,
                    sid,
                    method: 'mobile_userAuth',
                    output: 3,
                    input: 3,
                    network: this.network,
                    mobile_tracking: this.mobileTracking
                },
                {
                    "BIRTHDAY": userData.birthday,
                    "BLOG_NAME": userData.blogName,
                    "EMAIL": userData.email,
                    "PASSWORD": userData.password,
                    "SEX": userData.sex,
                    "lang": userData.lang
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

            let decryptedToken = decryptToken(token);
            let authToken = generateAuthToken(decryptedToken.substr(0, 64), decryptedToken.substr(64, 16));

            this.session = (await this.checkToken(authToken)).results;
        } catch (err) {
            throw new Error(err);
        }
    }

    get getSession() {
        return this.session;
    }
}
