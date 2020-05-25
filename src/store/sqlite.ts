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
            this.db.run(sql, params, (err: Error | null) => {
                err ? reject(err) : resolve();
            });
        });
    }

    public get(sql: string, params: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err: Error | null, row: any) => {
                err ? reject(err) : resolve(row);
            });
        });
    }

    public all(sql: string, params: any[]): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err: Error | null, rows: any[]) => {
                err ? reject(err) : resolve(rows);
            });
        });
    }
}
