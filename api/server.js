const express = require('express');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const log4js = require('log4js');
const cors = require('cors');

log4js.configure({
    appenders: { console: { type: 'stdout', layout: { type: 'pattern', pattern: '%m' } } },
    categories: { default: { appenders: ['console'], level: 'info' } }
});
const logger = log4js.getLogger();

const app = express();
app.use(express.json());
app.use(cors());

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'mysql',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rootpassword',
    database: process.env.DB_NAME || 'login_app',
    port: process.env.DB_PORT || 3306
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
        const [rows] = await pool.query(
            'SELECT id FROM users WHERE username = ? AND password_hash = ?',
            [username, password]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const userId = rows[0].id;
        const token = crypto.randomBytes(16).toString('hex');

        await pool.query('UPDATE users SET token = ? WHERE id = ?', [token, userId]);

        logger.info(JSON.stringify({
            timestamp: new Date().toISOString(),
            user_ID: userId,
            action: 'USER_LOGIN',
            IP_address: ipAddress
        }));

        res.json({ token: token });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    try {
        const [rows] = await pool.query('SELECT id, username FROM users WHERE token = ?', [token]);
        if (rows.length === 0) return res.status(403).json({ error: 'Invalid token' });

        req.user = rows[0];
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

app.get('/api/protected', authenticateToken, (req, res) => {
    res.json({ message: 'Welcome to the protected area!', user: req.user.username });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API is running on port ${PORT}`);
});