/**
 * User Model
 * Database operations for user authentication and management
 */

import prisma from '../database/prisma';
import { hashPassword, comparePassword, generateEncryptionKey } from '../utils/auth.utils';
import { User } from '../types';

export class UserModel {
  /**
   * Create a new user
   */
  static async create(email: string, password: string): Promise<User> {
    const passwordHash = await hashPassword(password);
    const encryptionKey = generateEncryptionKey();
    const encryptionKeyHash = await hashPassword(encryptionKey);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        encryptionKeyHash,
      },
    });

    // Create empty user profile
    await prisma.userProfile.create({
      data: {
        userId: user.id,
      },
    });

    return user as User;
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    return user as User | null;
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    return user as User | null;
  }

  /**
   * Verify user password
   */
  static async verifyPassword(user: User, password: string): Promise<boolean> {
    return comparePassword(password, user.passwordHash);
  }

  /**
   * Update user password
   */
  static async updatePassword(userId: string, newPassword: string): Promise<void> {
    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  /**
   * Delete user and all related data
   */
  static async delete(userId: string): Promise<void> {
    await prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Get user with profile
   */
  static async findWithProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });
  }

  /**
   * Check if email exists
   */
  static async emailExists(email: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { email },
    });

    return count > 0;
  }
}
