import nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { Address, AttachmentLike } from 'nodemailer/lib/mailer';
import { Readable } from 'stream';

// Define the type locally to avoid cross-project imports
export interface SenderProfile {
  name: string;
  email: string;
  verified: boolean;
}

export interface EmailOptions {
  to?: string | Address | (string | Address)[];
  subject?: string;
  text?: string | Readable | Buffer | AttachmentLike;
  html?: string | Readable | Buffer | AttachmentLike;
  senderProfile?: SenderProfile; // For blasts, to set the display name
}

class EmailService {
  private verificationTransporter: Transporter;
  private blastTransporter: Transporter;

  constructor() {
    // Transporter for general emails (like verification)
    this.verificationTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      requireTLS: true,
      tls: {
        rejectUnauthorized: false,
        servername: 'mail.ai.sudi.pro'
      },
      auth: {
        user: process.env.SMTP_USER, // uses test@ai.sudi.pro
        pass: process.env.SMTP_PASS,
      },
    });

    // Transporter specifically for email blasts
    this.blastTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      requireTLS: true,
      debug: true, // Enable detailed SMTP logging
      tls: {
        rejectUnauthorized: false,
        servername: 'mail.ai.sudi.pro'
      },
      auth: {
        user: process.env.BLAST_SMTP_USER, // uses undangan-noreply@ai.sudi.pro
        pass: process.env.BLAST_SMTP_PASS,
      },
    });
  }

  // Sends general-purpose emails (e.g., verification)
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.verificationTransporter.sendMail({
        from: `"SUDi Verification" <${process.env.SMTP_USER}>`,
        ...options,
      });
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send email.');
    }
  }

  // Sends email blasts with a custom sender name
  async sendBlastEmail(options: EmailOptions, senderProfile?: SenderProfile): Promise<void> {
    const senderName = senderProfile?.name || 'SUDi'; // Use sender profile name, fallback to SUDi

    try {
      await this.blastTransporter.sendMail({
        from: `"${senderName}" <${process.env.BLAST_SMTP_USER}>`,
        ...options,
      });
    } catch (error) {
      console.error('Error sending blast email:', error);
      throw new Error('Failed to send blast email.');
    }
  }
}

export const emailService = new EmailService();