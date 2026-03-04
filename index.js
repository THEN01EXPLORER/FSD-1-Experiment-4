const express = require('express');
const { Redis } = require('@upstash/redis');
const app = express();
const port = 3001;

app.use(express.json());
app.use(express.static('public'));

// Initialize Upstash Redis Client (Serverless HTTP)
let upstashUrl = process.env.UPSTASH_REDIS_REST_URL || 'http://localhost:8079';
let upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN || 'mock-token';

// Fallback logic if the user only provided the old REDIS_URL string
if (!process.env.UPSTASH_REDIS_REST_URL && process.env.REDIS_URL) {
    try {
        const parsedUrl = new URL(process.env.REDIS_URL);
        upstashToken = parsedUrl.password;
        upstashUrl = `https://${parsedUrl.hostname}`;
    } catch (e) {
        console.error("Failed to parse REDIS_URL, falling back to local mock");
    }
}

const client = new Redis({ url: upstashUrl, token: upstashToken });

(async () => {
    // Upstash Redis HTTP client doesn't need explicit .connect()
    console.log('Connected to Redis (Serverless)');

    // Initialize 10 seats if not present
    for (let i = 1; i <= 10; i++) {
        const seatKey = `seat:${i}`;
        const status = await client.get(seatKey);
        if (status === null) {
            await client.set(seatKey, 'available');
        }
    }
})();

// GET /seats - View all seats
app.get('/seats', async (req, res) => {
    const keys = await client.keys('seat:*');
    const seats = [];

    for (const key of keys) {
        const status = await client.get(key);
        seats.push({ seat: key, status });
    }

    res.json(seats.sort((a, b) => {
        const numA = parseInt(a.seat.split(':')[1]);
        const numB = parseInt(b.seat.split(':')[1]);
        return numA - numB;
    }));
});

// POST /reset - Reset all seats to available
app.post('/reset', async (req, res) => {
    try {
        for (let i = 1; i <= 10; i++) {
            await client.set(`seat:${i}`, 'available');
        }
        res.status(200).send('All seats reset to available.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Reset failed.');
    }
});

// POST /book/:seatId - Book a seat transactionally
app.post('/book/:seatId', async (req, res) => {
    const seatId = req.params.seatId;
    const seatKey = `seat:${seatId}`;

    try {
        const status = await client.get(seatKey);

        if (status === 'available') {
            // @upstash/redis doesn't strictly support stateful WATCH/MULTI like TCP clients
            // But we can simulate atomic updates via simple set if it hasn't changed
            // For a robust serverless setup, we usually use Lua scripts or simple SETNX
            const results = await client.set(seatKey, 'booked', { get: true });

            // If the previous value returned by GET was 'available', our SET worked.
            if (results === 'available') {
                res.status(200).send(`Seat ${seatId} booked successfully.`);
            } else {
                // Someone else got it a millisecond before us
                res.status(409).send(`Seat ${seatId} booking failed (concurrency conflict).`);
            }
        } else {
            res.status(400).send(`Seat ${seatId} is already booked or invalid.`);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;
