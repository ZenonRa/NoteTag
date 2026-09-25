import { QueryRunner } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';
import { CreateNoteTagSchema1720000000000 } from './1720000000000-CreateNoteTagSchema';

describe('CreateNoteTagSchema migration', () => {
  it('creates all tables, ownership constraints and cascade foreign keys', async () => {
    const query = vi.fn<(sql: string) => Promise<void>>().mockResolvedValue(undefined);
    const runner = { query } as unknown as QueryRunner;

    await new CreateNoteTagSchema1720000000000().up(runner);

    const sql = query.mock.calls.flat().join('\n');
    expect(sql).toContain('CREATE TABLE "users"');
    expect(sql).toContain('CREATE TABLE "notes"');
    expect(sql).toContain('CREATE TABLE "tags"');
    expect(sql).toContain('CREATE TABLE "note_tags"');
    expect(sql).toContain('UNIQUE ("user_id", "name")');
    expect(sql).toContain("CHECK (\"role\" IN ('client', 'admin'))");
    expect(sql.match(/ON DELETE CASCADE/g)).toHaveLength(4);
  });

  it('drops tables in dependency-safe order', async () => {
    const query = vi.fn<(sql: string) => Promise<void>>().mockResolvedValue(undefined);
    const runner = { query } as unknown as QueryRunner;

    await new CreateNoteTagSchema1720000000000().down(runner);

    expect(query.mock.calls.map(([sql]) => sql)).toEqual([
      'DROP TABLE "note_tags"',
      'DROP TABLE "tags"',
      'DROP TABLE "notes"',
      'DROP TABLE "users"',
    ]);
  });
});
