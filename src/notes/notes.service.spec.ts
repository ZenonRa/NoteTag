import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Tag } from '../tags/tag.entity';
import { NoteTag } from './note-tag.entity';
import { Note } from './note.entity';
import { NotesService } from './notes.service';

function makeNote(id = 10, userId = 1): Note {
  return Object.assign(new Note(), {
    id,
    userId,
    content: 'text',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    noteTags: [],
  });
}

describe('NotesService', () => {
  const notesRepository = {
    create: vi.fn(),
    save: vi.fn(),
    findOne: vi.fn(),
    remove: vi.fn(),
    createQueryBuilder: vi.fn(),
  };
  const tagsRepository = { findOneBy: vi.fn() };
  const noteTagsRepository = {
    findOneBy: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  };
  const service = new NotesService(
    notesRepository as unknown as Repository<Note>,
    tagsRepository as unknown as Repository<Tag>,
    noteTagsRepository as unknown as Repository<NoteTag>,
  );

  beforeEach(() => vi.clearAllMocks());

  it('creates a note using only the authenticated user id', async () => {
    const note = makeNote();
    notesRepository.create.mockReturnValue(note);
    notesRepository.save.mockResolvedValue(note);

    await service.create(1, { content: 'text' });

    expect(notesRepository.create).toHaveBeenCalledWith({ userId: 1, content: 'text' });
  });

  it('returns a paginated list and maps attached tags', async () => {
    const tag = { id: 5, name: 'Учёба', createdAt: new Date('2026-01-01') } as Tag;
    const note = Object.assign(makeNote(), { noteTags: [{ noteId: 10, tagId: 5, tag }] });
    const builder = {
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      addOrderBy: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      getManyAndCount: vi.fn().mockResolvedValue([[note], 21]),
    };
    notesRepository.createQueryBuilder.mockReturnValue(builder);

    const result = await service.findAll(1, { page: 2, limit: 10 });

    expect(result).toEqual({
      items: [
        {
          id: 10,
          content: 'text',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
          tags: [{ id: 5, name: 'Учёба', createdAt: new Date('2026-01-01') }],
        },
      ],
      page: 2,
      limit: 10,
      total: 21,
      totalPages: 3,
    });
    expect(builder.where).toHaveBeenCalledWith('note.userId = :userId', { userId: 1 });
    expect(builder.skip).toHaveBeenCalledWith(10);
    expect(builder.take).toHaveBeenCalledWith(10);
    expect(builder.andWhere).not.toHaveBeenCalled();
  });

  it('returns an owned note', async () => {
    notesRepository.findOne.mockResolvedValue(makeNote());
    await expect(service.findOne(1, 10)).resolves.toMatchObject({ id: 10, content: 'text' });
    expect(notesRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 10, userId: 1 } }),
    );
  });

  it('updates and saves only an owned note', async () => {
    const note = makeNote();
    notesRepository.findOne.mockResolvedValue(note);
    notesRepository.save.mockImplementation((saved: Note) => Promise.resolve(saved));

    await expect(service.update(1, 10, { content: 'changed' })).resolves.toMatchObject({
      id: 10,
      content: 'changed',
    });
    expect(notesRepository.save).toHaveBeenCalledWith(note);
  });

  it('removes only an owned note', async () => {
    const note = makeNote();
    notesRepository.findOne.mockResolvedValue(note);

    await service.remove(1, 10);

    expect(notesRepository.remove).toHaveBeenCalledWith(note);
  });

  it.each([
    ['read', () => service.findOne(1, 99)],
    ['update', () => service.update(1, 99, { content: 'changed' })],
    ['delete', () => service.remove(1, 99)],
  ])('does not allow %s of another client note', async (_operation, action) => {
    notesRepository.findOne.mockResolvedValue(null);
    await expect(action()).rejects.toBeInstanceOf(NotFoundException);
  });

  it('attaches an owned tag to an owned note once', async () => {
    notesRepository.findOne.mockResolvedValue(makeNote());
    tagsRepository.findOneBy.mockResolvedValue({ id: 5, userId: 1 });
    noteTagsRepository.findOneBy.mockResolvedValue(null);
    noteTagsRepository.create.mockReturnValue({ noteId: 10, tagId: 5 });

    await expect(service.attachTag(1, 10, 5)).resolves.toEqual({ noteId: 10, tagId: 5 });
    expect(noteTagsRepository.save).toHaveBeenCalledTimes(1);
  });

  it('does not insert a duplicate note-tag link', async () => {
    notesRepository.findOne.mockResolvedValue(makeNote());
    tagsRepository.findOneBy.mockResolvedValue({ id: 5, userId: 1 });
    noteTagsRepository.findOneBy.mockResolvedValue({ noteId: 10, tagId: 5 });

    await expect(service.attachTag(1, 10, 5)).resolves.toEqual({ noteId: 10, tagId: 5 });
    expect(noteTagsRepository.save).not.toHaveBeenCalled();
  });

  it('rejects attaching another client tag', async () => {
    notesRepository.findOne.mockResolvedValue(makeNote());
    tagsRepository.findOneBy.mockResolvedValue(null);
    await expect(service.attachTag(1, 10, 5)).rejects.toBeInstanceOf(NotFoundException);
    expect(noteTagsRepository.save).not.toHaveBeenCalled();
  });

  it('rejects attaching a tag to another client note', async () => {
    notesRepository.findOne.mockResolvedValue(null);
    await expect(service.attachTag(1, 10, 5)).rejects.toBeInstanceOf(NotFoundException);
    expect(tagsRepository.findOneBy).not.toHaveBeenCalled();
  });

  it('detaches only the link and does not delete the tag', async () => {
    notesRepository.findOne.mockResolvedValue(makeNote());
    tagsRepository.findOneBy.mockResolvedValue({ id: 5, userId: 1 });
    await service.detachTag(1, 10, 5);
    expect(noteTagsRepository.delete).toHaveBeenCalledWith({ noteId: 10, tagId: 5 });
  });

  it('uses all requested tag ids in the filter', async () => {
    const builder = {
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      addOrderBy: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      getManyAndCount: vi.fn().mockResolvedValue([[], 0]),
    };
    notesRepository.createQueryBuilder.mockReturnValue(builder);

    await service.findAll(1, { page: 1, limit: 20, tagIds: [1, 3, 5] });

    expect(builder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('HAVING COUNT(DISTINCT filtered.tag_id) = :tagCount'),
      { tagIds: [1, 3, 5], tagCount: 3 },
    );
  });
});
