import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createTransport } from 'nodemailer';

@Injectable()
export class PasswordResetMailer {
  async send(email: string, name: string, token: string): Promise<void> {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const from = process.env.SMTP_FROM;
    const frontendUrl = process.env.FRONTEND_URL;
    if (!host || !from || !frontendUrl || !Number.isSafeInteger(port) || port < 1 || port > 65535) {
      throw new ServiceUnavailableException('Password reset email is not configured');
    }

    const transport = createTransport({
      host,
      port,
      secure: port === 465,
      ...(process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } }
        : {}),
    });
    const resetUrl = new URL('/reset-password', frontendUrl);
    resetUrl.searchParams.set('token', token);
    await transport.sendMail({
      from,
      to: email,
      subject: 'Reset your Digital Wardrobe password',
      text: `Hello ${name},\n\nUse this link within 30 minutes to reset your password:\n${resetUrl.href}\n\nIf you did not request this, you can ignore this email.`,
    });
  }
}
