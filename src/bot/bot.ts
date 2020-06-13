import {Client} from '../client/client';
import {AccountData, DeviceData, MediaData, Playlist, Proxy} from '../interfaces';
import {delay, randHex} from '../utils';

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

    /**
     * Gets bot state.
     */
    get getState() {
        return this.state;
    }

    /**
     * Sets bot state
     *
     * @param state
     */
    set setState(state: BotState) {
        this.state = state;
    }

    /**
     * Sets bot proxy.
     *
     * @param proxy
     */
    public setProxy(proxy: Proxy) {
        this.client.setProxy(proxy);
    }

    /**
     * Sings up bot.
     */
    public async signUp() {
        await this.client.initSession();

        return await this.client.userCreate();
    }

    /**
     * Signs in bot.
     */
    public async signIn() {
        await this.client.initSession();

        return await this.client.mobileUserAuth();
    }

    /**
     * Gets free trial for bot.
     */
    public async getFreeTrial() {
        try {
            //getting ARL for next method
            await this.client.mobileUserAutoLog();

            return await this.client.trialEnable();
        } catch (err) {

        }
    }

    /**
     * Emulates listen for one track.
     *
     * @param nextMedia
     * @param currentMedia
     * @param pageContext
     * @param listenTime
     * @param currentTime
     */
    public async listen(
        nextMedia: MediaData, currentMedia: MediaData, pageContext: MediaData, listenTime: number, currentTime: number
    ) {
        try {
            return await this.client.logListen(nextMedia, currentMedia, pageContext, listenTime, currentTime);
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * Adds song to playlist.
     *
     * @param {string} playlistId Deezer playlist id.
     * @param {string} songId     Deezer song id.
     */
    public async addSongToPlaylist(playlistId: string, songId: string) {
        await this.client.mobileAddSongsAndGetSongs(playlistId, [songId], "2000");
    }

    /**
     * Adds array of songs to playlist.
     *
     * @param {string}        playlistId Deezer playlist id.
     * @param {Array<string>} songIds    Deezer song ids.
     */
    public async addSongsToPlaylist(playlistId: string, songIds: Array<string>) {
        await this.client.mobileAddSongsAndGetSongs(playlistId, songIds, "2000");
    }

    /**
     * Emulates full playlist listening.
     *
     * @param playlist
     */
    public async listenPlaylist(playlist: Playlist) {
        try {
            for (let i = 0; i < playlist.songs.length; i++) {
                let rand = randHex(5);
                let song = playlist.songs[i];
                console.time('Listen[' + rand + '] track ' + song.id);
                let next =
                    i + 1 == playlist.songs.length ?
                        {id: playlist.songs[0].id, type: 'song'} :
                        {id: playlist.songs[i + 1].id, type: 'song'};

                await delay(song.duration);

                await this.listen(
                    next,
                    {
                        id: song.id,
                        type: 'song',
                        format: 'MP3_128'
                    },
                    {
                        id: playlist.context.id,
                        type: playlist.context.type
                    },
                    song.duration,
                    Math.floor(Date.now() / 1000)
                );
                console.timeEnd('Listen[' + rand + '] track ' + song.id);
            }
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * Emulates album listen for n times.
     *
     * @param album
     * @param n
     */
    public async listenLoopPlaylist(album: Playlist, n: number) {
        for (let i = 0; i < n; i++)
            await this.listenPlaylist(album);
    }
}
