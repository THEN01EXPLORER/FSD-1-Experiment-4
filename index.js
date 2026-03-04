const express = require('express');
const { createClient } = require('redis');
const app = express();
const port = 3001;

app.use(express.json());
app.use(express.static('public'));

// Initialize Redis Client
const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
    await client.connect();
    console.log('Connected to Redis');

    // Reset seats for demo purposes safely
    // await client.flushDb(); 
    // Initialize 10 seats if not present
    for (let i = 1; i <= 10; i++) {
        const seatKey = `seat:${i}`;
        const exists = await client.exists(seatKey);
        if (!exists) {
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

    // Redis Transaction (Optimistic Locking)
    try {
        await client.watch(seatKey);
        const status = await client.get(seatKey);

        if (status === 'available') {
            const multi = client.multi();
            multi.set(seatKey, 'booked');
            const results = await multi.exec();

            if (results) {
                res.status(200).send(`Seat ${seatId} booked successfully.`);
            } else {
                res.status(409).send(`Seat ${seatId} booking failed (concurrency conflict).`);
            }
        } else {
            await client.unwatch(); // Important to release the watch
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
