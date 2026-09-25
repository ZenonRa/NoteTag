import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Tag } from './tag.entity';
import { TagsService } from './tags.service';

describe('TagsService', () => {
  const repository = {
    create: vi.fn(),
    save: vi.fn(),
    findAndCount: vi.fn(),
    findOneBy: vi.fn(),
    remove: vi.fn(),
  };
  const service = new TagsService(repository as unknown as Repository<Tag>);

  beforeEach(() => vi.clearAllMocks());

  it('lists only owned tags with pagination metadata', async () => {
    const tag = { id: 4, userId: 7, name: 'Работа' } as Tag;
    repository.findAndCount.mockResolvedValue([[tag], 11]);

    await expect(service.findAll(7, { page: 2, limit: 10 })).resolves.toEqual({
      items: [tag],
      page: 2,
      limit: 10,
      total: 11,
      totalPages: 2,
    });
    expect(repository.findAndCount).toHaveBeenCalledWith({
      where: { userId: 7 },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: 10,
      take: 10,
    });
  });

  it('creates a tag for the authenticated client', async () => {
    const tag = { id: 1, userId: 7, name: 'Учёба' } as Tag;
    repository.create.mockReturnValue(tag);
    repository.save.mockResolvedValue(tag);
    await expect(service.create(7, { name: 'Учёба' })).resolves.toBe(tag);
    expect(repository.create).toHaveBeenCalledWith({ userId: 7, name: 'Учёба' });
  });

  it('maps a unique constraint violation to 409', async () => {
    repository.create.mockReturnValue({});
    repository.save.mockRejectedValue(
      new QueryFailedError('INSERT', [], { code: '23505' } as unknown as Error),
    );
    await expect(service.create(7, { name: 'Учёба' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('rethrows a database error that is not a unique violation', async () => {
    const error = new QueryFailedError('INSERT', [], { code: '23503' } as unknown as Error);
    repository.create.mockReturnValue({});
    repository.save.mockRejectedValue(error);

    await expect(service.create(7, { name: 'Учёба' })).rejects.toBe(error);
  });

  it('deletes only an owned tag', async () => {
    const tag = { id: 1, userId: 7 } as Tag;
    repository.findOneBy.mockResolvedValue(tag);
    await service.remove(7, 1);
    expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1, userId: 7 });
    expect(repository.remove).toHaveBeenCalledWith(tag);
  });

  it('returns 404 for another client tag', async () => {
    repository.findOneBy.mockResolvedValue(null);
    await expect(service.remove(7, 1)).rejects.toBeInstanceOf(NotFoundException);
  });
});
