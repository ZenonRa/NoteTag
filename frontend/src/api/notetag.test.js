import { describe, expect, it, vi } from 'vitest';
import { decodeNote, decodeSession, encodeNote } from './notetag';

function token(payload) {
  const part = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `header.${part}.signature`;
}

describe('frontend NoteTag helpers', () => {
  it('stores title and body reversibly in backend content', () => {
    const content = encodeNote('План', 'Купить молоко');

    expect(content).toBe('План\n\nКупить молоко');
    expect(
      decodeNote({
        id: 1,
        content,
        tags: [{ id: 3 }],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-02',
      }),
    ).toMatchObject({ id: 1, title: 'План', content: 'Купить молоко', tags: [3] });
  });

  it('uses a fallback title and handles a title-only note', () => {
    expect(encodeNote(' ', ' ')).toBe('Без названия');
    expect(decodeNote({ content: 'Короткая заметка' })).toMatchObject({
      title: 'Короткая заметка',
      content: '',
      tags: [],
    });
  });

  it('decodes a valid client session', () => {
    const accessToken = token({
      sub: 9,
      login: 'maria',
      role: 'client',
      exp: Math.floor(Date.now() / 1000) + 60,
    });

    expect(decodeSession(accessToken)).toEqual({
      token: accessToken,
      user: { id: 9, login: 'maria', role: 'client' },
    });
  });

  it('rejects expired, malformed and unexpected-role tokens', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const expired = token({ sub: 9, login: 'maria', role: 'client', exp: 1 });
    const wrongRole = token({ sub: 9, login: 'maria', role: 'owner' });

    expect(decodeSession(expired)).toBeNull();
    expect(decodeSession(wrongRole)).toBeNull();
    expect(decodeSession('broken')).toBeNull();
    vi.useRealTimers();
  });
});
