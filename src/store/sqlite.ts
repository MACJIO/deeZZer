import * as sqlite3 from 'sqlite3';

export default class SQLite {
    public db : sqlite3.Database;

    constructor(path: string) {
        this.db = new sqlite3.Database(path, (err) => {
            err ? console.error(err) : null;
        });
    }

    public run(sql: string, params: any[]) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, (res: sqlite3.RunResult, err: Error | null) => {
                err ? reject(err) : resolve(res);
            });
        });
    }

    public get(sql: string, params: any[]) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (res: sqlite3.RunResult, err: Error | null) => {
                err ? reject(err) : resolve(res);
            });
        });
    }

    public all(sql: string, params: any[]) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (res: sqlite3.RunResult, err: Error | null) => {
                err ? reject(err) : resolve(res);
            });
        });
    }

    public each(sql: string, params: any[]) {
        return new Promise((resolve, reject) => {
            this.db.each(sql, params, (res: sqlite3.RunResult, err: Error | null) => {
                err ? reject(err) : resolve(res);
            });
        });
    }
}
