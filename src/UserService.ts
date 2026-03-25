import { PrismaClient, User } from '@prisma/client';

export class UserService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Find a user by ID, excluding soft-deleted users by default.
   */
  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  /**
   * Find all active (non-deleted) users.
   */
  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
    });
  }

  /**
   * Find a user by email, excluding soft-deleted users by default.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  /**
   * Soft-delete a user by setting deletedAt to the current timestamp.
   * Does NOT perform a hard delete.
   */
  async softDelete(id: number): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Restore a soft-deleted user by clearing the deletedAt field.
   */
  async restore(id: number): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  // ---- Admin / opt-in methods that bypass the soft-delete filter ----

  /**
   * Find all soft-deleted users (admin use).
   */
  async findDeleted(): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { deletedAt: { not: null } },
    });
  }

  /**
   * Find ALL users including soft-deleted ones (admin use).
   */
  async findAllIncludingDeleted(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  /**
   * Find any user by ID regardless of soft-delete status (admin use).
   */
  async findByIdIncludingDeleted(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
