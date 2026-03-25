import { PrismaClient, User } from '@prisma/client';
import { UserService } from './UserService';

// Mock the entire @prisma/client module
jest.mock('@prisma/client', () => {
  const mockUserOps = {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: mockUserOps,
    })),
  };
});

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  email: 'alice@example.com',
  name: 'Alice',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  deletedAt: null,
  ...overrides,
});

describe('UserService', () => {
  let prisma: PrismaClient;
  let userService: UserService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
    userService = new UserService(prisma);
    mockUser = (prisma as any).user;
  });

  // ---- findById ----

  it('findById passes deletedAt: null filter', async () => {
    const user = makeUser();
    mockUser.findFirst.mockResolvedValue(user);

    const result = await userService.findById(1);

    expect(mockUser.findFirst).toHaveBeenCalledWith({
      where: { id: 1, deletedAt: null },
    });
    expect(result).toEqual(user);
  });

  it('findById returns null for a soft-deleted user', async () => {
    mockUser.findFirst.mockResolvedValue(null);

    const result = await userService.findById(1);

    expect(result).toBeNull();
  });

  // ---- findAll ----

  it('findAll passes deletedAt: null filter', async () => {
    const users = [makeUser(), makeUser({ id: 2, email: 'bob@example.com', name: 'Bob' })];
    mockUser.findMany.mockResolvedValue(users);

    const result = await userService.findAll();

    expect(mockUser.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
    });
    expect(result).toHaveLength(2);
  });

  it('findAll returns empty array when all users are soft-deleted', async () => {
    mockUser.findMany.mockResolvedValue([]);

    const result = await userService.findAll();

    expect(result).toEqual([]);
  });

  // ---- findByEmail ----

  it('findByEmail passes deletedAt: null filter', async () => {
    const user = makeUser();
    mockUser.findFirst.mockResolvedValue(user);

    const result = await userService.findByEmail('alice@example.com');

    expect(mockUser.findFirst).toHaveBeenCalledWith({
      where: { email: 'alice@example.com', deletedAt: null },
    });
    expect(result).toEqual(user);
  });

  it('findByEmail returns null for a soft-deleted user', async () => {
    mockUser.findFirst.mockResolvedValue(null);

    const result = await userService.findByEmail('alice@example.com');

    expect(result).toBeNull();
  });

  // ---- softDelete ----

  it('softDelete sets deletedAt to a Date via update (no hard delete)', async () => {
    const deletedUser = makeUser({ deletedAt: new Date() });
    mockUser.update.mockResolvedValue(deletedUser);

    const result = await userService.softDelete(1);

    expect(mockUser.update).toHaveBeenCalledTimes(1);
    const call = mockUser.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: 1 });
    expect(call.data.deletedAt).toBeInstanceOf(Date);
    expect(result.deletedAt).not.toBeNull();
  });

  it('softDelete never calls prisma.user.delete', async () => {
    mockUser.update.mockResolvedValue(makeUser({ deletedAt: new Date() }));

    await userService.softDelete(1);

    expect(mockUser.delete).not.toHaveBeenCalled();
  });

  it('softDelete returns the updated user record', async () => {
    const now = new Date();
    const deletedUser = makeUser({ deletedAt: now });
    mockUser.update.mockResolvedValue(deletedUser);

    const result = await userService.softDelete(1);

    expect(result).toEqual(deletedUser);
    expect(result.deletedAt).toEqual(now);
  });

  // ---- restore ----

  it('restore clears deletedAt by setting it to null', async () => {
    const restoredUser = makeUser({ deletedAt: null });
    mockUser.update.mockResolvedValue(restoredUser);

    const result = await userService.restore(1);

    expect(mockUser.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { deletedAt: null },
    });
    expect(result.deletedAt).toBeNull();
  });

  it('restore returns the restored user record', async () => {
    const restoredUser = makeUser();
    mockUser.update.mockResolvedValue(restoredUser);

    const result = await userService.restore(1);

    expect(result).toEqual(restoredUser);
  });

  // ---- findDeleted (admin opt-in) ----

  it('findDeleted queries only records where deletedAt is not null', async () => {
    const deletedUsers = [makeUser({ deletedAt: new Date() })];
    mockUser.findMany.mockResolvedValue(deletedUsers);

    const result = await userService.findDeleted();

    expect(mockUser.findMany).toHaveBeenCalledWith({
      where: { deletedAt: { not: null } },
    });
    expect(result).toEqual(deletedUsers);
  });

  it('findDeleted returns empty array when no users are soft-deleted', async () => {
    mockUser.findMany.mockResolvedValue([]);

    const result = await userService.findDeleted();

    expect(result).toEqual([]);
  });

  // ---- findAllIncludingDeleted (admin opt-in) ----

  it('findAllIncludingDeleted calls findMany without any filter', async () => {
    const allUsers = [makeUser(), makeUser({ id: 2, deletedAt: new Date() })];
    mockUser.findMany.mockResolvedValue(allUsers);

    const result = await userService.findAllIncludingDeleted();

    expect(mockUser.findMany).toHaveBeenCalledWith();
    expect(result).toHaveLength(2);
  });

  it('findAllIncludingDeleted returns both active and deleted users', async () => {
    const active = makeUser();
    const deleted = makeUser({ id: 2, deletedAt: new Date() });
    mockUser.findMany.mockResolvedValue([active, deleted]);

    const result = await userService.findAllIncludingDeleted();

    expect(result.some((u) => u.deletedAt === null)).toBe(true);
    expect(result.some((u) => u.deletedAt !== null)).toBe(true);
  });

  // ---- findByIdIncludingDeleted (admin opt-in) ----

  it('findByIdIncludingDeleted uses findUnique without deletedAt filter', async () => {
    const deletedUser = makeUser({ deletedAt: new Date() });
    mockUser.findUnique.mockResolvedValue(deletedUser);

    const result = await userService.findByIdIncludingDeleted(1);

    expect(mockUser.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toEqual(deletedUser);
  });

  it('findByIdIncludingDeleted returns null when user does not exist', async () => {
    mockUser.findUnique.mockResolvedValue(null);

    const result = await userService.findByIdIncludingDeleted(999);

    expect(result).toBeNull();
  });

  // ---- cross-cutting: default methods never see deleted users ----

  it('default queries (findAll, findById, findByEmail) all include deletedAt:null', async () => {
    mockUser.findFirst.mockResolvedValue(null);
    mockUser.findMany.mockResolvedValue([]);

    await userService.findAll();
    await userService.findById(1);
    await userService.findByEmail('x@example.com');

    const findManyCalls = mockUser.findMany.mock.calls;
    const findFirstCalls = mockUser.findFirst.mock.calls;

    expect(findManyCalls[0][0]).toMatchObject({ where: { deletedAt: null } });
    expect(findFirstCalls[0][0]).toMatchObject({ where: { deletedAt: null } });
    expect(findFirstCalls[1][0]).toMatchObject({ where: { deletedAt: null } });
  });
});
