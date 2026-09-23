import { Repository } from 'typeorm';
import { Note } from '../notes/note.entity';
import { Tag } from '../tags/tag.entity';
import { User } from '../users/user.entity';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  const usersRepository = { findAndCount: jest.fn(), count: jest.fn() };
  const notesRepository = { count: jest.fn() };
  const tagsRepository = { count: jest.fn() };
  const service = new AdminService(
    usersRepository as unknown as Repository<User>,
    notesRepository as unknown as Repository<Note>,
    tagsRepository as unknown as Repository<Tag>,
  );

  beforeEach(() => jest.clearAllMocks());

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
