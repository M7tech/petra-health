import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

// Sends email via Gmail SMTP when GMAIL_USER + GMAIL_APP_PASSWORD are set.
// When unconfigured it is a no-op (returns false) so callers fall back to a
// dev flow (e.g. returning the OTP in the response) — useful before creds exist.
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const user = this.config.get<string>('GMAIL_USER');
    const pass = this.config.get<string>('GMAIL_APP_PASSWORD');
    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        // Explicit host/port (587, STARTTLS) rather than the 'gmail' shorthand
        // (which defaults to port 465/implicit TLS) — some restrictive PaaS
        // networks allow 587 but block 465.
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user, pass },
        // Fail fast instead of hanging the request if outbound SMTP is
        // blocked/unreachable (some PaaS hosts restrict egress entirely).
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 8000,
      });
    }
  }

  get configured(): boolean {
    return this.transporter !== null;
  }

  async send(to: string, subject: string, text: string): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(`Mail not configured; would send to ${to}: ${subject}`);
      return false;
    }
    try {
      const from = this.config.get<string>('GMAIL_USER');
      await this.transporter.sendMail({ from: `Petra Health <${from}>`, to, subject, text });
      return true;
    } catch (e) {
      this.logger.error(`Failed to send mail to ${to}: ${(e as Error).message}`);
      return false;
    }
  }

  sendOtp(to: string, code: string) {
    return this.send(
      to,
      'Your Petra Health verification code',
      `Your verification code is ${code}. It expires in 5 minutes.`,
    );
  }

  sendReset(to: string, link: string) {
    return this.send(
      to,
      'Reset your Petra Health password',
      `Open this link to set a new password (valid 30 minutes):\n\n${link}`,
    );
  }
}
