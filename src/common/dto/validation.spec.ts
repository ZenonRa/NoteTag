import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { LoginDto } from '../../auth/dto/login.dto';
import { RegisterDto } from '../../auth/dto/register.dto';
import { CreateNoteDto } from '../../notes/dto/create-note.dto';
import { NotesQueryDto } from '../../notes/dto/notes-query.dto';
import { UpdateNoteDto } from '../../notes/dto/update-note.dto';
import { CreateTagDto } from '../../tags/dto/create-tag.dto';
import { PaginationQueryDto } from './pagination-query.dto';

describe('request DTO validation', () => {
  it('accepts a valid registration and rejects a short password', async () => {
    const valid = plainToInstance(RegisterDto, { login: 'andrey', password: 'password123' });
    const invalid = plainToInstance(RegisterDto, { login: 'andrey', password: '123' });

    expect(await validate(valid)).toHaveLength(0);
    expect(await validate(invalid)).not.toHaveLength(0);
  });

  it('requires non-empty login credentials', async () => {
    const dto = plainToInstance(LoginDto, { login: '', password: '' });

    expect(await validate(dto)).toHaveLength(2);
  });

  it('converts pagination strings to numbers and enforces limits', async () => {
    const valid = plainToInstance(PaginationQueryDto, { page: '2', limit: '100' });
    const invalid = plainToInstance(PaginationQueryDto, { page: '0', limit: '101' });

    expect(valid).toMatchObject({ page: 2, limit: 100 });
    expect(await validate(valid)).toHaveLength(0);
    expect(await validate(invalid)).toHaveLength(2);
  });

  it('uses pagination defaults when the query is empty', async () => {
    const dto = plainToInstance(PaginationQueryDto, {});

    expect(dto).toMatchObject({ page: 1, limit: 20 });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('parses, de-duplicates and validates tag IDs', async () => {
    const dto = plainToInstance(NotesQueryDto, { tagIds: '1,3,3,5' });

    expect(dto.tagIds).toEqual([1, 3, 5]);
    expect(await validate(dto)).toHaveLength(0);
  });

  it.each(['1, 2', '1,-2', '0', 'abc', [1, 2]])('rejects malformed tagIds value %j', (tagIds) => {
    expect(() => plainToInstance(NotesQueryDto, { tagIds })).toThrow(BadRequestException);
  });

  it('trims tag names before validation', async () => {
    const dto = plainToInstance(CreateTagDto, { name: '  Учёба  ' });

    expect(dto.name).toBe('Учёба');
    expect(await validate(dto)).toHaveLength(0);
  });

  it.each([CreateNoteDto, UpdateNoteDto])('rejects empty note content for %s', async (Dto) => {
    const dto = plainToInstance(Dto, { content: '' });

    expect(await validate(dto)).not.toHaveLength(0);
  });
});
