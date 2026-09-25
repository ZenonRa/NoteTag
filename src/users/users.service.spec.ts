import { ConflictException } from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from './user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const queryBuilder = {
    addSelect: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    getOne: vi.fn(),
  };
  const repository = {
    create: vi.fn(),
    save: vi.fn(),
    createQueryBuilder: vi.fn().mockReturnValue(queryBuilder),
  };
  const service = new UsersService(repository as unknown as Repository<User>);

  beforeEach(() => vi.clearAllMocks());

  it('creates every public registration as a client', async () => {
    const user = { id: 1, login: 'andrey', role: UserRole.Client } as User;
    repository.create.mockReturnValue(user);
    repository.save.mockResolvedValue(user);

    await expect(service.createClient('andrey', 'hash')).resolves.toBe(user);
    expect(repository.create).toHaveBeenCalledWith({
      login: 'andrey',
      passwordHash: 'hash',
      role: UserRole.Client,
    });
  });

  it('maps a duplicate login violation to 409', async () => {
    repository.create.mockReturnValue({});
    repository.save.mockRejectedValue(
      new QueryFailedError('INSERT', [], { code: '23505' } as unknown as Error),
    );

    await expect(service.createClient('andrey', 'hash')).rejects.toBeInstanceOf(ConflictException);
  });

  it('rethrows non-unique database failures', async () => {
    const error = new QueryFailedError('INSERT', [], { code: '23502' } as unknown as Error);
    repository.create.mockReturnValue({});
    repository.save.mockRejectedValue(error);

    await expect(service.createClient('andrey', 'hash')).rejects.toBe(error);
  });

  it('explicitly selects the password hash during login lookup', async () => {
    const user = { id: 1, login: 'andrey', passwordHash: 'hash' } as User;
    queryBuilder.getOne.mockResolvedValue(user);

    await expect(service.findByLoginWithPassword('andrey')).resolves.toBe(user);
    expect(repository.createQueryBuilder).toHaveBeenCalledWith('user');
    expect(queryBuilder.addSelect).toHaveBeenCalledWith('user.passwordHash');
    expect(queryBuilder.where).toHaveBeenCalledWith('user.login = :login', { login: 'andrey' });
  });
});
