import { Injectable, Logger } from '@nestjs/common';

// Sends via Expo's push service (https://exp.host) — works for any device
// registered with an Expo push token from a dev/production build. No API
// key needed for basic sends; unlike SMTP this is plain HTTPS, so it isn't
// affected by Render's outbound-SMTP block.
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  async send(token: string | null | undefined, title: string, body: string): Promise<boolean> {
    if (!token) return false;
    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ to: token, title, body, sound: 'default' }),
      });
      if (!res.ok) {
        this.logger.warn(`Push send failed: ${res.status} ${await res.text()}`);
        return false;
      }
      return true;
    } catch (e) {
      this.logger.warn(`Push send error: ${(e as Error).message}`);
      return false;
    }
  }
}
