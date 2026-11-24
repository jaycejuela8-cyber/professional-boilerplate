# Authentication API (Email Verification & Password Reset)

A Node.js, Express, and TypeScript authentication backend that supports user registration, email verification, login, forgot password, and password reset using Nodemailer and Ethereal for email testing.

---

## Project Overview

This API adds account security and email workflows to the authentication system:
- **Email Verification:** Users verify their email address via a token sent by email before logging in.
- **Password Reset:** Users can request a password reset link and set a new password using a one-time reset token.
- **Token Security:** Tokens are generated securely, expire automatically, and are cleared after single use.

---

## Authentication Flow

### 1. Registration & Email Verification
1. Client sends `POST /api/auth/register` with `name`, `email`, and `password`.
2. The server creates the user with `isVerified = false`, generates a verification token, and sends a verification email via Nodemailer.
3. Client opens the verification link (`?token=...`) and calls `GET /api/auth/verify-email?token=<token>`.
4. The server validates the token, marks the user as verified, and clears the verification token.

### 2. Login
1. Client sends `POST /api/auth/login` with `email` and `password`.
2. If the user is not verified yet, login is rejected (`401 Unauthorized`).
3. Once verified and credentials match, login succeeds and returns authentication token(s).

### 3. Forgot Password & Reset Password
1. Client sends `POST /api/auth/forgot-password` with `email`.
2. The server generates a reset token (with a short expiration, such as 1 hour) and sends a reset email (`?token=...`).
3. Client sends `POST /api/auth/reset-password` with `token` and `newPassword`.
4. The server validates the token, updates the password (hashed), and clears the reset token so it cannot be reused.

---

## Testing with Ethereal Email

1. Start the development server:
   ```bash
   npm run dev