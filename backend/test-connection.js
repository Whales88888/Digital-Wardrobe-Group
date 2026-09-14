const pool = require('./dbconnection');

async function testConnection() {
    let conn;

    try {
        conn = await pool.getConnection();

        console.log('Database connected successfully!');

        const rows = await conn.query('SHOW TABLES;');

        console.log(rows);
    } catch (error) {
        console.error('Database connection failed:', error);
    } finally {
        if (conn) conn.release();
        await pool.end();
    }
}

testConnection();
