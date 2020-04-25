export interface AccountData {
    birthday?: string;
    blogName?: string;
    email: string;
    password: string;
    userId?: string;
    sex?: string;
    lang?: string;
}

export interface DeviceData {
    deviceOS: string;
    deviceOSVersion: string;
    androidID: string;
    deviceType: string;
    deviceModel: string;
    appVersion: string;
    lang: string;
    screenWidth?: number;
    screenHeight?: number;
    uniqID: string;
    network: string;
    cpuCount?: number;
    cpuMaxFrequency?: number;
    ram?: number;
    serial?: string;
}

export interface MediaData {
    id: string;
    type: string;
    format?: string;
}

