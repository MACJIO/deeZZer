export interface AccountData {
    birthday: string;
    blogName: string;
    email: string;
    password: string;
    sex: string;
    lang: string;
}

export interface OS {
    name: string;
    version: string;
    androidId?: string;
}

export interface DeviceData {
    OS?: OS;
    type: string;
    name: string;
    model: string;
    appVersion?: string;
    lang: string;
    screenWidth?: number;
    screenHeight?: number;
    uniqID?: string;
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

export type Protocol = 'http' | 'https'

export interface Proxy {
    host: string;
    port: number;
    protocol?: Protocol;
}
