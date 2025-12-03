# Chirpy

A Node.js HTTP server built with Express, TypeScript, and PostgreSQL. This server provides a RESTful API for user management, authentication, and a "chirps" feature (similar to tweets).

## Prerequisites

Before running the server, make sure you have the following installed:

- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- **PostgreSQL** database (local or remote)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory with the following required environment variables:

```env
PORT=3000
PLATFORM=development
JWT_SECRET=your-secret-key-here-make-it-long-and-random
POLKA_KEY=your-polka-key-here
DB_URL=postgresql://username:password@localhost:5432/database_name
```

**Environment Variables Explained:**

- `PORT`: The port number the server will listen on (e.g., 3000)
- `PLATFORM`: Platform identifier (e.g., "development", "production")
- `JWT_SECRET`: A secret key used to sign and verify JWT tokens. Use a long, random string for security.
- `POLKA_KEY`: Secret key for Polka webhook authentication
- `DB_URL`: PostgreSQL connection string in the format: `postgresql://user:password@host:port/database`

### 3. Run Database Migrations

The server uses Drizzle ORM for database management. Migrations are automatically run when the server starts, but you can also run them manually:

```bash
npm run migrate
```

### 4. Build and Run the Server

**Development mode** (builds and runs):

```bash
npm run dev
```

**Production mode** (build first, then run):

```bash
npm run build
npm start
```

The server will start and listen on the port specified in your `PORT` environment variable. You should see a message like:

```
Server is running at http://localhost:3000
```

## Available APIs

Here are some of the key APIs you can try:

### Authentication APIs

**Create a User**

```bash
POST /api/users
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Login**

```bash
POST /api/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

Returns an access token and refresh token that you can use for authenticated requests.

**Refresh Access Token**

```bash
POST /api/refresh
Authorization: Bearer <refresh_token>
```

Returns a new access token when your current one expires.

### Chirps APIs

**Create a Chirp** (requires authentication)

```bash
POST /api/chirps
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "body": "This is my first chirp!"
}
```

Note: Chirps are limited to 140 characters and certain words are automatically filtered.

**Get All Chirps**

```bash
GET /api/chirps
```

Optional query parameters:

- `authorId`: Filter chirps by author ID
- `sort`: Sort order (`asc` or `desc`)

Example: `GET /api/chirps?authorId=123&sort=desc`

**Get Chirp by ID**

```bash
GET /api/chirps/:chirpID
```

**Delete a Chirp** (requires authentication, only the author can delete their own chirps)

```bash
DELETE /api/chirps/:chirpID
Authorization: Bearer <access_token>
```

### Other APIs

**Health Check**

```bash
GET /api/healthz
```

**Update User** (requires authentication)

```bash
PUT /api/users
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "email": "newemail@example.com",
  "password": "newpassword123"
}
```

**Static Files**

```bash
GET /app/*
```

Serves static files from the `src/app` directory.

## Example Usage

1. **Create a user:**

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

2. **Login:**

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

3. **Create a chirp (using the token from login):**

```bash
curl -X POST http://localhost:3000/api/chirps \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"body": "Hello, world!"}'
```

4. **Get all chirps:**

```bash
curl http://localhost:3000/api/chirps
```

## Development

- **Build TypeScript:** `npm run build`
- **Run tests:** `npm test`
- **Generate migrations:** `npm run generate`

## Notes

- Access tokens expire after 1 hour
- Refresh tokens expire after 60 days
- Chirps have a maximum length of 140 characters
- Certain words in chirps are automatically censored
- The server automatically runs database migrations on startup
