/**
 * Message Model
 * Database operations for encrypted conversation messages
 */

import prisma from '../database/prisma';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

export class MessageModel {
  /**
   * Encrypt message content
   */
  private static encrypt(
    plaintext: string,
    encryptionKey: string
  ): { ciphertext: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(encryptionKey, 'hex');
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return {
      ciphertext: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  /**
   * Decrypt message content
   */
  private static decrypt(
    ciphertext: string,
    iv: string,
    authTag: string,
    encryptionKey: string
  ): string {
    const key = Buffer.from(encryptionKey, 'hex');
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Create a new encrypted message
   */
  static async create(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    encryptionKey: string,
    emotionalMarkers?: any
  ) {
    const { ciphertext, iv, authTag } = this.encrypt(content, encryptionKey);

    const message = await prisma.message.create({
      data: {
        sessionId,
        role,
        contentEncrypted: ciphertext,
        iv,
        authTag,
        emotionalMarkers,
      },
    });

    return message;
  }

  /**
   * Get decrypted messages for a session
   */
  static async getSessionMessages(sessionId: string, encryptionKey: string) {
    const messages = await prisma.message.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });

    return messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: this.decrypt(msg.contentEncrypted, msg.iv, msg.authTag, encryptionKey),
      emotionalMarkers: msg.emotionalMarkers,
      timestamp: msg.timestamp,
    }));
  }

  /**
   * Delete messages older than retention period (30 days)
   */
  static async deleteOldMessages(): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await prisma.message.deleteMany({
      where: {
        timestamp: {
          lt: thirtyDaysAgo,
        },
      },
    });

    return result.count;
  }

  /**
   * Get conversation text for insight extraction
   */
  static async getConversationText(
    sessionId: string,
    encryptionKey: string
  ): Promise<string> {
    const messages = await this.getSessionMessages(sessionId, encryptionKey);

    return messages
      .map((msg) => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`)
      .join('\n\n');
  }
}
