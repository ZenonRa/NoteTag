import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { Tag } from './tag.entity';
import { TagsService } from './tags.service';

describe('TagsService', () => {
  const repository = {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    remove: jest.fn(),
  };
  const service = new TagsService(repository as unknown as Repository<Tag>);

  beforeEach(() => jest.clearAllMocks());

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
