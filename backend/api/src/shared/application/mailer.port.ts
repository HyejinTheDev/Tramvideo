export interface MailMessage {
  to: string;
  subject: string;
  html: string;
}

export abstract class MailerPort {
  abstract send(message: MailMessage): Promise<void>;
}
