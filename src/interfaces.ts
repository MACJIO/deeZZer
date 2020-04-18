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
    deviceOS: string;
    deviseOSVersion: string;
    androidID: string;
    deviceType: string;
    deviceModel: string;
    appVersion: string;
    lang: string;
    screenWidth?: number;
    screenHeight?: number;
    uniqID: string;
    network: string;
    cpuCount: number;
    cpuMaxFrequency?: number;
    ram?: number;
    serial?: string;
}

export interface MediaData {
    id: string;
    type: string;
    format?: string;
}

