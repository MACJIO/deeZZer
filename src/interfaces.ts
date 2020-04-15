export interface AccountData {
    birthday?: string;
    blogName?: string;
    email: string;
    password: string;
    sex?: string;
    lang?: string;
    arl?: string;
}

export interface DeviceData {
    platform: string;
    platformVersion: string;
    deviceType: string;
    deviceModel: string;
    appVersion: string;
    lang: string;
    screenWidth?: number;
    screenHeight?: number;
}
