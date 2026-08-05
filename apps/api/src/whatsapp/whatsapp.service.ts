import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Sends OTP/reset messages via the Meta WhatsApp Business Cloud API instead
// of email. Requires a WhatsApp Business app + a phone number registered
// with Meta, plus pre-approved message templates (WhatsApp only allows
// business-initiated messages through an approved template). When
// unconfigured this is a no-op (returns false) so callers fall back to a
// dev flow (e.g. returning the OTP in the response) — same pattern as
// MailService, useful before real credentials/templates exist.
@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly accessToken?: string;
  private readonly phoneNumberId?: string;
  private readonly apiVersion: string;
  private readonly templateLang: string;
  private readonly otpTemplate: string;
  private readonly resetTemplate: string;

  constructor(private readonly config: ConfigService) {
    this.accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN');
    this.phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    this.apiVersion = this.config.get<string>('WHATSAPP_API_VERSION') ?? 'v20.0';
    this.templateLang = this.config.get<string>('WHATSAPP_TEMPLATE_LANG') ?? 'en_US';
    this.otpTemplate = this.config.get<string>('WHATSAPP_OTP_TEMPLATE_NAME') ?? 'otp_code';
    this.resetTemplate = this.config.get<string>('WHATSAPP_RESET_TEMPLATE_NAME') ?? 'password_reset';
  }

  get configured(): boolean {
    return !!(this.accessToken && this.phoneNumberId);
  }

  private async sendTemplate(to: string, templateName: string, bodyParam: string): Promise<boolean> {
    if (!this.configured) {
      this.logger.warn(`WhatsApp not configured; would send "${templateName}" to ${to}`);
      return false;
    }
    // E.164-ish cleanup: keep the leading + and digits only.
    const digits = to.replace(/[^\d+]/g, '');
    try {
      const res = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: digits,
            type: 'template',
            template: {
              name: templateName,
              language: { code: this.templateLang },
              components: [{ type: 'body', parameters: [{ type: 'text', text: bodyParam }] }],
            },
          }),
        },
      );
      if (!res.ok) {
        this.logger.error(`WhatsApp send failed (${res.status}): ${await res.text()}`);
        return false;
      }
      return true;
    } catch (e) {
      this.logger.error(`WhatsApp send error: ${(e as Error).message}`);
      return false;
    }
  }

  sendOtp(to: string | null | undefined, code: string): Promise<boolean> {
    if (!to) return Promise.resolve(false);
    return this.sendTemplate(to, this.otpTemplate, code);
  }

  sendReset(to: string | null | undefined, link: string): Promise<boolean> {
    if (!to) return Promise.resolve(false);
    return this.sendTemplate(to, this.resetTemplate, link);
  }
}
