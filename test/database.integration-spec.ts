import 'dotenv/config';
import { Client } from 'pg';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe('PostgreSQL schema constraints', () => {
  const client = new Client({
    host: process.env.TEST_DB_HOST ?? process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.TEST_DB_PORT ?? process.env.DB_PORT ?? 5432),
    user: process.env.TEST_DB_USERNAME ?? process.env.DB_USERNAME ?? 'postgres',
    password: process.env.TEST_DB_PASSWORD ?? process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.TEST_DB_DATABASE ?? process.env.DB_DATABASE ?? 'notetag_acceptance',
  });

  beforeAll(async () => client.connect());
  afterAll(async () => client.end());
  beforeEach(async () => client.query('BEGIN'));
  afterEach(async () => client.query('ROLLBACK'));

  it('rejects a duplicate user login', async () => {
    await client.query(
      `INSERT INTO users (login, password_hash) VALUES ('db_unique_user', 'hash')`,
    );

    await expect(
      client.query(`INSERT INTO users (login, password_hash) VALUES ('db_unique_user', 'hash')`),
    ).rejects.toMatchObject({ code: '23505', constraint: 'UQ_users_login' });
  });

  it('cascades user deletion to notes, tags and note-tag links', async () => {
    const user = await client.query<{ id: number }>(
      `INSERT INTO users (login, password_hash) VALUES ('db_cascade_user', 'hash') RETURNING id`,
    );
    const userId = user.rows[0].id;
    const note = await client.query<{ id: number }>(
      `INSERT INTO notes (user_id, content) VALUES ($1, 'text') RETURNING id`,
      [userId],
    );
    const tag = await client.query<{ id: number }>(
      `INSERT INTO tags (user_id, name) VALUES ($1, 'db_tag') RETURNING id`,
      [userId],
    );
    await client.query(`INSERT INTO note_tags (note_id, tag_id) VALUES ($1, $2)`, [
      note.rows[0].id,
      tag.rows[0].id,
    ]);

    await client.query('DELETE FROM users WHERE id = $1', [userId]);

    const counts = await client.query<{ notes: string; tags: string; links: string }>(`
      SELECT
        (SELECT COUNT(*) FROM notes WHERE user_id = ${userId}) AS notes,
        (SELECT COUNT(*) FROM tags WHERE user_id = ${userId}) AS tags,
        (SELECT COUNT(*) FROM note_tags WHERE note_id = ${note.rows[0].id}) AS links
    `);
    expect(counts.rows[0]).toEqual({ notes: '0', tags: '0', links: '0' });
  });

  it('rejects a note without required content', async () => {
    const user = await client.query<{ id: number }>(
      `INSERT INTO users (login, password_hash) VALUES ('db_not_null_user', 'hash') RETURNING id`,
    );

    await expect(
      client.query('INSERT INTO notes (user_id, content) VALUES ($1, NULL)', [user.rows[0].id]),
    ).rejects.toMatchObject({ code: '23502', column: 'content' });
  });

  it('rejects a note that references a missing user', async () => {
    await expect(
      client.query(`INSERT INTO notes (user_id, content) VALUES (2147483647, 'text')`),
    ).rejects.toMatchObject({ code: '23503', constraint: 'FK_notes_user' });
  });

  it('uses client as the default role for a new user', async () => {
    const result = await client.query<{ role: string; created_at: Date }>(
      `INSERT INTO users (login, password_hash)
       VALUES ('db_default_user', 'hash')
       RETURNING role, created_at`,
    );

    expect(result.rows[0].role).toBe('client');
    expect(result.rows[0].created_at).toBeInstanceOf(Date);
  });
});
