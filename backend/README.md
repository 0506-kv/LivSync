# LivSync Backend

Express backend for LivSync. It starts an HTTP server, connects to MongoDB with Mongoose, and currently exposes a basic root route.

## Tech Stack

- Node.js
- Express 5
- MongoDB through Mongoose
- dotenv for environment variables
- CORS middleware
- cookie-parser
- Development reload with Nodemon

Listed in dependencies but not currently wired into routes in `app.js`: `axios`, `bcrypt`, `express-validator`, `jsonwebtoken`, and `socket.io`.

## Installation

From the `backend` folder:

```bash
npm install
```

## Configuration

Create a `.env` file inside the `backend` folder.

```env
PORT=4000
DB_CONNECT=mongodb://127.0.0.1:27017/livsync
```

Environment variables used by the current code:

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `DB_CONNECT` | Yes | None | MongoDB connection string used by `mongoose.connect()` in `db/db.js` |
| `PORT` | No | `4000` | Port used by `app.listen()` in `app.js` |

The `.gitignore` file already excludes:

- `.env`
- `node_modules`

## Available Scripts

```bash
npm run dev
```

Starts the server with Nodemon for local development.

```bash
npm start
```

Starts the server with Node.

```bash
npm test
```

No backend tests are configured yet. This script currently exits with `Error: no test specified`.

## Server Setup

`app.js` configures the server with:

- `cors()` for cross-origin requests
- `express.json()` for JSON request bodies
- `express.urlencoded({ extended: true })` for form URL-encoded request bodies
- `cookieParser()` for reading cookies
- `connectToDb()` from `db/db.js` before route handling

The server listens on `process.env.PORT || 4000`.

## API Routes

Current routes defined in `app.js`:

| Method | Route | Response | Description |
| --- | --- | --- | --- |
| `GET` | `/` | `hello world` | Basic health/root route |

Example check after starting the server:

```bash
curl http://localhost:4000/
```

Expected response:

```text
hello world
```

## Database Connection

The database connection is defined in `db/db.js`:

- Reads the MongoDB URI from `process.env.DB_CONNECT`
- Calls `mongoose.connect(process.env.DB_CONNECT)`
- Logs `connected to db` on success
- Logs `error in db connection:` with the error on failure

Make sure MongoDB is running locally or use a valid hosted MongoDB connection string before starting the backend.
