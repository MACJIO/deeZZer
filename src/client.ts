import { DeviceData, UserData } from './interfaces';
import { Api } from './api';
import { decryptToken, generateAuthToken } from "./utils";

export class Client extends Api {
    private session: string | null = null;
    private readonly userData: UserData;
    private arl: string | null = null;

    constructor(userData: { birthday: string; password: string; blogName: string; sex: string; lang: string; email: string }, deviceData: DeviceData) {
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

    public async signUp() {
        try {
            if (this.session) {
                const emailValidation = await this.emailCheck(this.session, this.userData.email);

                if (emailValidation.results.domain_validity) {
                    const data = await this.userCreate(this.session, this.userData);
                    if (data.error) console.log('Deezer api error: ', data.error);
                    else {
                        this.arl = data.results;
                    }
                } else {
                    console.log('Cant sing up user with email: ' + this.userData.email + '. Domain validity failed.');
                }
            } else {
                console.log('Session expired or did not initialized.');
            }
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
