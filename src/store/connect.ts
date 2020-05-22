import { Pool } from 'pg';
import config from '../../config.json';

const pool = new Pool({
    database: config.PG.database,
    user: config.PG.user,
    password: config.PG.password
});

export default pool;
