import axios, { Method } from 'axios';
import { DeviceData, UserData } from './interfaces';
import { config } from 'dotenv';
import {
    generateUserAgent,
    randHex
} from './utils';

config();

export class Api {
    protected deviceData: DeviceData;
    private readonly userAgent: string;
    private network: string = randHex(64);
    private uniqId: string = randHex(32);
    private readonly apiKey: string | undefined;
    // base64 encoded json TODO: understand how this JSON generates
    private mobileTracking = 'eyJvdXJzZWNyZXQiOiJkZWV6ZXIwMTEwMTNzYyIsImFuZHJvaWRJRCI6ImRlNTNhZWQ2NDc4NzM1OTkiLCJpZGZhIjoiYmQyYWYwMjMtMzQ1ZS00NjYzLWE0MjktMDU1OGM3MDUxMmYwIiwibWFjQWRkcmVzcyI6IjAyOjAwOjAwOjAwOjAwOjAwIiwiZGV2aWNlX3R5cGUiOiJhbmRyb2lkIiwiYXBwX2lkIjoiZGVlemVyLmFuZHJvaWQuYXBwIn0';

    constructor(deviceData: DeviceData) {
        this.deviceData = deviceData;
        this.userAgent = generateUserAgent(deviceData);
        if (deviceData.platform === 'Android') this.apiKey = process.env.ANDROID_API_KEY;
        else if (deviceData.platform === 'IOS') this.apiKey = process.env.IOS_API_KEY;
        else this.apiKey = undefined;
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
                    //TODO: understand how build id initialize
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
}
