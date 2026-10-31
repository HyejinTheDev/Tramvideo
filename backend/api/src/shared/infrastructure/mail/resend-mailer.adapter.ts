import { Injectable, Logger } from '@nestjs/common';
import { env } from '../../../config/env';
import { MailerPort, MailMessage } from '../../application/mailer.port';

/** Gửi mail qua Resend HTTP API. Chưa có RESEND_API_KEY → chỉ log ra console (dev). */
@Injectable()
export class ResendMailerAdapter extends MailerPort {
  private readonly logger = new Logger(ResendMailerAdapter.name);

  async send(message: MailMessage): Promise<void> {
    if (!env.RESEND_API_KEY) {
      this.logger.log(`[DEV MAIL] → ${message.to} | ${message.subject}\n${message.html}`);
      return;
    }
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.MAIL_FROM,
        to: message.to,
        subject: message.subject,
        html: message.html,
      }),
    });
    if (!res.ok) {
      this.logger.error(`Gửi mail thất bại (${res.status}): ${await res.text()}`);
    }
  }
}
