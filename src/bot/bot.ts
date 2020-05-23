import { Client } from '../client/client';
import {AccountData, DeviceData, MediaData, Proxy} from '../interfaces';

enum BotState {
    offline,
    active,
    banned
}

export class Bot {
    private client: Client;
    private state: BotState = BotState.offline;

    constructor(readonly accountData: AccountData, readonly deviceData: DeviceData) {
        this.client = new Client(accountData, deviceData);
    }

    public setProxy(proxy: Proxy) {
        this.client.setProxy(proxy);
    }

    public async signUp() {
        await this.client.initSession();

        return await this.client.userCreate();
    }

    public async signIn() {
        await this.client.initSession();

        return await this.client.mobileUserAuth();
    }

    public async getFreeTrial() {
        try {
            //getting ARL for next method
            await this.client.mobileUserAutoLog();

            return await this.client.trialEnable();
        } catch (err) {

        }
    }

    public async listen(
        nextMedia: MediaData, currentMedia: MediaData, pageContext: MediaData, listenTime: number, currentTime: number
    ) {
        try {
            return await this.client.logListen(nextMedia, currentMedia, pageContext, listenTime, currentTime);
        } catch (err) {
            console.log(err);
        }
    }

    public async addSongToPlaylist(playlistId: string, songId: string) {
        await this.client.mobileAddSongsAndGetSongs(playlistId, [ songId ], "2000");
    }

    public async addSongsToPlaylist(playlistId: string, songIds: Array<string>) {
        await this.client.mobileAddSongsAndGetSongs(playlistId, songIds, "2000");
    }

    get getState() {
        return this.state;
    }

    set setState(state: BotState) {
        this.state = state;
    }
}
