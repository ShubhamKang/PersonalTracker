import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

export interface PushMessage {
  to: string; // Expo push token
  title: string;
  body: string;
}

export interface PushTransport {
  send(messages: PushMessage[]): Promise<void>;
}

/**
 * Real transport backed by expo-server-sdk. Filters invalid tokens and
 * sends in chunks. Injected via a token so tests can substitute a mock.
 */
@Injectable()
export class ExpoPushTransport implements PushTransport {
  private readonly logger = new Logger(ExpoPushTransport.name);
  private readonly expo = new Expo();

  async send(messages: PushMessage[]): Promise<void> {
    const valid: ExpoPushMessage[] = messages
      .filter((m) => {
        if (!Expo.isExpoPushToken(m.to)) {
          this.logger.warn(`Skipping invalid Expo push token: ${m.to}`);
          return false;
        }
        return true;
      })
      .map((m) => ({ to: m.to, sound: 'default', title: m.title, body: m.body }));

    if (valid.length === 0) {
      return;
    }

    const chunks = this.expo.chunkPushNotifications(valid);
    for (const chunk of chunks) {
      try {
        await this.expo.sendPushNotificationsAsync(chunk);
      } catch (err) {
        this.logger.error('Failed to send push chunk', err as Error);
      }
    }
  }
}

export const PUSH_TRANSPORT = Symbol('PUSH_TRANSPORT');
