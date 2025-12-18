/**
 * Session Model
 * Database operations for therapy sessions
 */

import prisma from '../database/prisma';
import { Session } from '../types';

export class SessionModel {
  /**
   * Create a new therapy session
   */
  static async create(userId: string): Promise<Session> {
    const session = await prisma.session.create({
      data: {
        userId,
        status: 'active',
      },
    });

    return session as Session;
  }

  /**
   * Find session by ID
   */
  static async findById(sessionId: string): Promise<Session | null> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    return session as Session | null;
  }

  /**
   * Find all sessions for a user
   */
  static async findByUserId(userId: string, limit: number = 10): Promise<Session[]> {
    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });

    return sessions as Session[];
  }

  /**
   * Find active session for user
   */
  static async findActiveSession(userId: string): Promise<Session | null> {
    const session = await prisma.session.findFirst({
      where: {
        userId,
        status: 'active',
      },
      orderBy: { startedAt: 'desc' },
    });

    return session as Session | null;
  }

  /**
   * Update session
   */
  static async update(
    sessionId: string,
    data: {
      status?: string;
      endedAt?: Date;
      sessionSummary?: string;
      emotionalTrajectory?: any;
      keyThemes?: string[];
      durationSeconds?: number;
    }
  ): Promise<Session> {
    const session = await prisma.session.update({
      where: { id: sessionId },
      data,
    });

    return session as Session;
  }

  /**
   * End a session
   */
  static async endSession(
    sessionId: string,
    summary: string,
    keyThemes: string[]
  ): Promise<Session> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const durationSeconds = Math.floor(
      (new Date().getTime() - new Date(session.startedAt).getTime()) / 1000
    );

    return this.update(sessionId, {
      status: 'completed',
      endedAt: new Date(),
      sessionSummary: summary,
      keyThemes,
      durationSeconds,
    });
  }

  /**
   * Get session with messages
   */
  static async findWithMessages(sessionId: string) {
    return prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });
  }

  /**
   * Delete session
   */
  static async delete(sessionId: string): Promise<void> {
    await prisma.session.delete({
      where: { id: sessionId },
    });
  }
}
