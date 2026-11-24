import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { createLogger } from '../utils/logger';
import { InternalError } from '../utils/errors';

const logger = createLogger('EmailService');

const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
        user: config.email.user,
        pass: config.email.pass,
    },
});

transporter
    .verify()
    .then(() => logger.info('✅ Email service connected'))
    .catch((error) => logger.error('❌ Email service connection failed', { error }));

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

export class EmailService {
    static async sendVerificationEmail(email: string, token: string): Promise<void> {
        const verificationLink = `${config.frontendUrl}/verify-email?token=${token}`;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; color: #333;">
                <h2>Welcome to Our App!</h2>
                <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
                <a href="${verificationLink}"
                   style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                    Verify Email Address
                </a>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; font-size: 12px;">${verificationLink}</p>
                <p><strong>This link will expire in 24 hours.</strong></p>
                <p>If you didn't create an account, please ignore this email.</p>
                <p style="font-size: 12px; color: #666;">This is an automated message. Please do not reply.</p>
            </div>
        `;

        await this.sendEmail({
            to: email,
            subject: 'Verify Your Email Address',
            html,
        });
    }

    static async sendPasswordResetEmail(email: string, token: string): Promise<void> {
        const resetLink = `${config.frontendUrl}/reset-password?token=${token}`;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; color: #333;">
                <h2>Password Reset Request</h2>
                <p>We received a request to reset your password. Click the button below to create a new password:</p>
                <a href="${resetLink}"
                   style="display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                    Reset Password
                </a>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; font-size: 12px;">${resetLink}</p>
                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0;">
                    <strong>⚠️ This link will expire in 1 hour.</strong>
                </div>
                <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
                <p style="font-size: 12px; color: #666;">This is an automated message. Please do not reply.</p>
            </div>
        `;

        await this.sendEmail({
            to: email,
            subject: 'Reset Your Password',
            html,
        });
    }

    private static async sendEmail(options: EmailOptions): Promise<void> {
        try {
            const info = await transporter.sendMail({
                from: `"Your App" <${config.email.from}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
            });

            logger.info('Email sent successfully', {
                to: options.to,
                subject: options.subject,
                messageId: info.messageId,
            });

            if (config.email.host === 'smtp.ethereal.email') {
                const previewUrl = nodemailer.getTestMessageUrl(info);
                logger.info('📧 Ethereal preview URL', { previewUrl });
                console.log(`\n📧 Ethereal preview URL: ${previewUrl}\n`);
            }
        } catch (error) {
            logger.error('Failed to send email', {
                to: options.to,
                subject: options.subject,
                error,
            });
            throw new InternalError('Failed to send email');
        }
    }
}