import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paginated } from '../common/interfaces/paginated.interface';
import { Tag } from '../tags/tag.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { NotesQueryDto } from './dto/notes-query.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NoteTag } from './note-tag.entity';
import { Note } from './note.entity';

export interface NoteResponse {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags: Array<{ id: number; name: string; createdAt: Date }>;
}

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private readonly notesRepository: Repository<Note>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(NoteTag)
    private readonly noteTagsRepository: Repository<NoteTag>,
  ) {}

  async findAll(userId: number, query: NotesQueryDto): Promise<Paginated<NoteResponse>> {
    const builder = this.notesRepository
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.noteTags', 'noteTag')
      .leftJoinAndSelect('noteTag.tag', 'tag')
      .where('note.userId = :userId', { userId })
      .orderBy('note.createdAt', 'DESC')
      .addOrderBy('note.id', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    if (query.tagIds?.length) {
      builder.andWhere(
        `note.id IN (
          SELECT filtered.note_id
          FROM note_tags filtered
          WHERE filtered.note_id = note.id
            AND filtered.tag_id IN (:...tagIds)
          GROUP BY filtered.note_id
          HAVING COUNT(DISTINCT filtered.tag_id) = :tagCount
        )`,
        { tagIds: query.tagIds, tagCount: query.tagIds.length },
      );
    }

    const [notes, total] = await builder.getManyAndCount();
    return {
      items: notes.map((note) => this.toResponse(note)),
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async findOne(userId: number, id: number): Promise<NoteResponse> {
    return this.toResponse(await this.findOwnedNote(userId, id));
  }

  async create(userId: number, dto: CreateNoteDto): Promise<NoteResponse> {
    const note = await this.notesRepository.save(
      this.notesRepository.create({ userId, content: dto.content }),
    );
    note.noteTags = [];
    return this.toResponse(note);
  }

  async update(userId: number, id: number, dto: UpdateNoteDto): Promise<NoteResponse> {
    const note = await this.findOwnedNote(userId, id);
    note.content = dto.content;
    return this.toResponse(await this.notesRepository.save(note));
  }

  async remove(userId: number, id: number): Promise<void> {
    const note = await this.findOwnedNote(userId, id);
    await this.notesRepository.remove(note);
  }

  async attachTag(
    userId: number,
    noteId: number,
    tagId: number,
  ): Promise<{ noteId: number; tagId: number }> {
    await this.findOwnedNote(userId, noteId, false);
    await this.findOwnedTag(userId, tagId);
    const existing = await this.noteTagsRepository.findOneBy({ noteId, tagId });
    if (!existing) {
      await this.noteTagsRepository.save(this.noteTagsRepository.create({ noteId, tagId }));
    }
    return { noteId, tagId };
  }

  async detachTag(userId: number, noteId: number, tagId: number): Promise<void> {
    await this.findOwnedNote(userId, noteId, false);
    await this.findOwnedTag(userId, tagId);
    await this.noteTagsRepository.delete({ noteId, tagId });
  }

  private async findOwnedNote(userId: number, id: number, withTags = true): Promise<Note> {
    const note = await this.notesRepository.findOne({
      where: { id, userId },
      relations: withTags ? { noteTags: { tag: true } } : undefined,
    });
    if (!note) throw new NotFoundException('Note not found');
    return note;
  }

  private async findOwnedTag(userId: number, id: number): Promise<Tag> {
    const tag = await this.tagsRepository.findOneBy({ id, userId });
    if (!tag) throw new NotFoundException('Tag not found');
    return tag;
  }

  private toResponse(note: Note): NoteResponse {
    return {
      id: note.id,
      content: note.content,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      tags: (note.noteTags ?? []).map(({ tag }) => ({
        id: tag.id,
        name: tag.name,
        createdAt: tag.createdAt,
      })),
    };
  }
}
