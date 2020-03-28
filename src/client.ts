import { DeviceData, UserData } from './interfaces';
import { Api } from './api';
import { decryptToken, generateAuthToken } from "./utils";

export class Client extends Api {
    private session: string | null = null;
    private readonly userData: UserData;

    constructor(userData: UserData, deviceData: DeviceData) {
        super(deviceData);
        this.userData = userData;
        this.deviceData = deviceData;
    }

    public async initSession() {
        try {
            let token = (await this.mobileAuth()).results.TOKEN;

            let decryptedToken = decryptToken(token);
            let authToken = generateAuthToken(decryptedToken.substr(0, 64), decryptedToken.substr(64, 16));

            let session = (await this.checkToken(authToken)).results;

            this.session = session;
        } catch (err) {
            throw new Error(err);
        }
    }

    public getUserData(): UserData {
        return this.userData;
    }

    public getSession(): string | null {
        return this.session;
    }
}
