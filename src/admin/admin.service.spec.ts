import { Repository } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Note } from '../notes/note.entity';
import { Tag } from '../tags/tag.entity';
import { User } from '../users/user.entity';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  const usersRepository = { findAndCount: vi.fn(), count: vi.fn() };
  const notesRepository = { count: vi.fn() };
  const tagsRepository = { count: vi.fn() };
  const service = new AdminService(
    usersRepository as unknown as Repository<User>,
    notesRepository as unknown as Repository<Note>,
    tagsRepository as unknown as Repository<Tag>,
  );

  beforeEach(() => vi.clearAllMocks());

  it('applies pagination, stable ordering and page metadata', async () => {
    usersRepository.findAndCount.mockResolvedValue([
      [
        {
          id: 21,
          login: 'user21',
          role: 'client',
          createdAt: new Date('2026-01-02'),
        },
      ],
      41,
    ]);

    await expect(service.findUsers({ page: 2, limit: 20 })).resolves.toMatchObject({
      page: 2,
      limit: 20,
      total: 41,
      totalPages: 3,
    });
    expect(usersRepository.findAndCount).toHaveBeenCalledWith({
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: 20,
      take: 20,
    });
  });

  it('returns users without password hashes', async () => {
    usersRepository.findAndCount.mockResolvedValue([
      [
        {
          id: 1,
          login: 'user1',
          role: 'client',
          passwordHash: 'secret',
          createdAt: new Date('2026-01-01'),
        },
      ],
      1,
    ]);
    const result = await service.findUsers({ page: 1, limit: 20 });
    expect(result.items[0]).not.toHaveProperty('passwordHash');
  });

  it('returns system-wide counts', async () => {
    usersRepository.count.mockResolvedValue(100);
    notesRepository.count.mockResolvedValue(850);
    tagsRepository.count.mockResolvedValue(240);
    await expect(service.getStats()).resolves.toEqual({
      usersCount: 100,
      notesCount: 850,
      tagsCount: 240,
    });
  });
});
