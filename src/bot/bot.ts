import { Client } from '../client/client';
import { AccountData, DeviceData } from '../client/interfaces';

enum BotState {
    online,
    offline
}

export class Bot {
    private client: Client;
    private state: BotState = BotState.offline;

    constructor(readonly accountData: AccountData, readonly deviceData: DeviceData) {
        this.client = new Client(accountData, deviceData);
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
        //getting ARL for next method
        await this.client.mobileUserAutoLog();

        return await this.client.trialEnable();
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