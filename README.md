# Professional Boilerplate with JWT Authentication

A Node.js + Express + TypeScript REST API boilerplate with TypeORM and MySQL. It now includes **JWT (JSON Web Token) authentication**: users can log in, receive a signed token, and use that token to access protected routes.

## Tech Stack

- Node.js, Express, TypeScript
- TypeORM + MySQL
- Joi (validation)
- bcrypt (password hashing)
- jsonwebtoken (JWT)
- Winston (logging), Helmet, CORS, express-rate-limit

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root (copy `.env.example`) and fill in your values:

   ```env
   NODE_ENV=development
   PORT=3001

   DB_HOST=localhost
   DB_PORT=3306
   DB_USERNAME=root
   DB_PASSWORD=your_mysql_password
   DB_DATABASE=boilerplate_db

   FRONTEND_URL=http://localhost:4200

   JWT_SECRET=your-long-random-secret-at-least-32-characters
   JWT_EXPIRES_IN=24h
   ```

3. Generate a secure JWT secret:

   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

4. Create the database `boilerplate_db` in MySQL, then run the migrations:

   ```bash
   npm run migration:run
   ```

5. Start the server:

   ```bash
   npm run dev
   ```

The API runs at `http://localhost:3001` (or whatever `PORT` you set).

## Authentication Flow

1. The client sends `email` and `password` to `POST /api/auth/login`.
2. The server finds the user by email and checks that the account is active.
3. The server compares the password with the stored bcrypt hash.
4. If valid, the server signs a JWT containing `userId` and `email`, using `JWT_SECRET`, and returns it with basic user info.
5. For protected routes, the client sends the token in the `Authorization` header.
6. The auth middleware verifies the token's signature and expiry, attaches the user data to `req.user`, and lets the request continue. Invalid, missing, or expired tokens get a `401 Unauthorized`.

## How to Get a Token

**Request**

```http
POST /api/auth/login
Content-Type: application/json

{
    "email": "test@example.com",
    "password": "Password123"
}
```

**Response**

```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
            "id": 1,
            "email": "test@example.com",
            "name": "Test User"
        }
    }
}
```

## How to Use the Token

Send the token in the `Authorization` header using the `Bearer` format:

```http
GET /api/auth/me
Authorization: Bearer YOUR_TOKEN_HERE
```

## Endpoints

| Method | Endpoint          | Access    | Description                         |
|--------|-------------------|-----------|-------------------------------------|
| GET    | `/health`         | Public    | Health check and database status    |
| POST   | `/api/auth/login` | Public    | Log in and receive a JWT            |
| GET    | `/api/auth/me`    | Protected | Get the current user from the token |
| POST   | `/api/users`      | Public    | Create a new user (registration)    |
| GET    | `/api/users`      | Protected | List users (token required)         |
| GET    | `/api/users/:id`  | Protected | Get a single user                   |
| PUT    | `/api/users/:id`  | Protected | Update a user                       |
| DELETE | `/api/users/:id`  | Protected | Delete a user                       |

## Error Responses

| Status | Code               | Example message                                    |
|--------|--------------------|----------------------------------------------------|
| 400    | `VALIDATION_ERROR` | Please provide a valid email address               |
| 401    | `UNAUTHORIZED`     | No token provided / Invalid token / Token has expired |
| 401    | `UNAUTHORIZED`     | Invalid email or password                          |

## Testing with Postman

1. `POST /api/auth/login` with valid credentials returns a token.
2. `GET /api/users` with `Authorization: Bearer <token>` returns the user list.
3. `GET /api/users` with no token returns `401 No token provided`.
4. `GET /api/auth/me` with a valid token returns the current user.
5. `GET /api/users` with `Bearer invalid-token-here` returns `401 Invalid token`.
6. `POST /api/auth/login` with a wrong password returns `401 Invalid email or password`.
7. `POST /api/auth/login` with `not-an-email` returns `400 VALIDATION_ERROR`.

## Project Structure

```
src/
├── config/        # env validation, data source
├── controllers/   # request handlers (authController)
├── dto/           # Joi validation schemas (auth.dto)
├── entities/      # TypeORM entities
├── middleware/    # auth, validation, security, logging, errors
├── migrations/    # database migrations
├── routes/        # route definitions (authRoutes, userRoutes)
├── services/      # business logic (authService, userService)
└── utils/         # logger, errors, response helpers
```

---

## Reflection Answers

**1. What is the difference between authentication and authorization? Give a real-world example of each.**
Authentication verifies *who you are*; authorization decides *what you are allowed to do*. Example of authentication: showing your ID at the airport. Example of authorization: your boarding pass only lets you onto your flight, not every plane.

**2. Why is JWT considered "stateless" and how does that benefit scalability?**
The token itself carries the user's identity and is signed, so the server does not have to store sessions or look anything up to validate it. Any server instance with the secret can verify a token, which makes it easy to add more servers without sharing session storage.

**3. What are the three parts of a JWT token and what does each part do?**
The **header** says which algorithm and token type are used. The **payload** holds the claims (such as `userId`, `email`, and expiry). The **signature** is created from the header, payload, and secret, and proves the token was not tampered with.

**4. Why should you never put sensitive data (like passwords) in the JWT payload?**
The payload is only Base64-encoded, not encrypted, so anyone who gets the token can decode and read it. Only non-sensitive identifiers should go in it.

**5. How does bcrypt protect user passwords? What is the purpose of the "salt" and "rounds"?**
bcrypt is a slow, one-way hash, so stored passwords cannot be turned back into the original. The **salt** is a random value added to each password so identical passwords produce different hashes and precomputed (rainbow) tables fail. The **rounds** (cost factor) control how slow hashing is, which makes brute-force attacks expensive.

**6. What happens if someone steals a JWT token? How can you mitigate this risk?**
They can act as that user until the token expires. Mitigations: short expiry times, HTTPS only, refresh tokens, a token blacklist on logout, storing tokens securely on the client, and rotating the secret if it leaks.

**7. Why is it important to use HTTPS when transmitting JWT tokens?**
Without HTTPS, the token travels in plain text and can be intercepted on the network. HTTPS encrypts the traffic so attackers cannot read or steal it.

**8. What is the difference between a short-lived access token and a long-lived refresh token? When would you use each?**
An access token is sent with every request and expires quickly (minutes to hours), which limits damage if stolen. A refresh token lives longer and is used only to get a new access token, so the user does not have to log in again. Use access tokens for API calls and refresh tokens to keep sessions going securely.

**9. How does the auth middleware know which user is making the request?**
It reads the token from the `Authorization: Bearer <token>` header, verifies the signature and expiry with `JWT_SECRET`, and reads `userId` and `email` from the decoded payload. It then stores them on `req.user` for the rest of the request.

**10. If you had to implement role-based authorization (e.g., admin vs. regular user), how would you modify your current setup?**
Add a `role` column to the User entity (default `user`), include `role` in the token payload, and add it to `req.user`. Then create a `requireRole('admin')` middleware that runs after `authMiddleware` and returns `403 Forbidden` if the user's role is not allowed. Apply it to admin-only routes, such as deleting users.
