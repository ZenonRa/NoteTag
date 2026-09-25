import { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import { NoteTag } from '../notes/note-tag.entity';
import { Note } from '../notes/note.entity';
import { Tag } from '../tags/tag.entity';
import { User } from '../users/user.entity';
import { createTypeOrmOptions } from './typeorm.config';

describe('createTypeOrmOptions', () => {
  it('reads PostgreSQL settings and keeps schema synchronization disabled', () => {
    const values: Record<string, string> = {
      DB_HOST: 'db.internal',
      DB_PORT: '5544',
      DB_USERNAME: 'notetag',
      DB_PASSWORD: 'secret',
      DB_DATABASE: 'notetag_test',
    };
    const config = {
      get: vi.fn((key: string, fallback: string) => values[key] ?? fallback),
    };

    expect(createTypeOrmOptions(config as unknown as ConfigService)).toEqual({
      type: 'postgres',
      host: 'db.internal',
      port: 5544,
      username: 'notetag',
      password: 'secret',
      database: 'notetag_test',
      entities: [User, Note, Tag, NoteTag],
      synchronize: false,
    });
  });
});
