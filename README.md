# Concurrent Ticket Booking System

A premium cinema seat booking demonstration utilizing **Redis Optimistic Locking** for robust concurrency handling.

## Features
- **Real-time Seat Selection**: Modern UI with live status polling.
- **Concurrency Protection**: Uses Redis `WATCH` and `MULTI` to prevent double-booking.
- **Visual Feedback**: Success/conflict notifications with smooth animations.
- **Dockerized**: Easy deployment with one command.

---

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js 18+
- Redis (Running on localhost:6379)

### Setup
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   node index.js
   ```
4. Open [http://localhost:3000](http://localhost:3000).

---

## 🐳 Docker Setup (Recommended)

If you have Docker installed, you don't need to install Node.js or Redis separately.

```bash
docker-compose up --build
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## 🌐 Cloud Deployment

### Render / Railway
1. Push this code to a GitHub repository.
2. Connect the repository to **Render** or **Railway**.
3. Create a **Managed Redis** instance on the same platform.
4. Set the `REDIS_URL` environment variable in your Web Service to point to the Redis instance.

---

## 🛠 Project Structure
- `index.js`: Express server with Redis transaction logic.
- `public/`: Frontend assets (HTML/CSS/JS).
- `load-test.yml`: Artillery configuration for stress testing.
- `Dockerfile` & `docker-compose.yml`: Containerization assets.
