import { useEffect, useState } from 'react';
import mock from '../mocks/mock.json';
import { AppContext } from './context';

const DATA_KEY = 'notetag-data-v1';
const SESSION_KEY = 'notetag-session-v1';

const seed = {
  users: mock.users,
  tags: mock.tags.map((tag) => ({ ...tag, userId: 1 })),
  notes: mock.notes,
};

function readData() {
  try {
    const stored = JSON.parse(localStorage.getItem(DATA_KEY));
    if (stored && Array.isArray(stored.users) && Array.isArray(stored.notes) && Array.isArray(stored.tags)) return stored;
  } catch { /* Reset invalid local data. */ }
  return seed;
}

function readSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}

function nextId(items) {
  return Math.max(0, ...items.map((item) => Number(item.id) || 0)) + 1;
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256);
  return bytesToHex(new Uint8Array(bits));
}

const demoPasswords = { ivanov: 'demo1234', petrova: 'demo1234', admin: 'admin1234' };

export function AppProvider({ children }) {
  const [data, setData] = useState(readData);
  const [sessionId, setSessionId] = useState(readSession);
  const user = data.users.find((item) => item.id === sessionId) ?? null;

  useEffect(() => { localStorage.setItem(DATA_KEY, JSON.stringify(data)); }, [data]);
  useEffect(() => {
    if (sessionId == null) sessionStorage.removeItem(SESSION_KEY);
    else sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionId));
  }, [sessionId]);

  async function login(loginName, password) {
    const name = loginName.trim().toLowerCase();
    const account = data.users.find((item) => item.login.toLowerCase() === name);
    if (!account || account.status !== 'active') throw new Error('Неверный логин или пароль');
    const valid = account.passwordHash
      ? await hashPassword(password, account.passwordSalt) === account.passwordHash
      : demoPasswords[name] === password;
    if (!valid) throw new Error('Неверный логин или пароль');
    setSessionId(account.id);
    return account;
  }

  async function register(loginName, password) {
    const name = loginName.trim().toLowerCase();
    if (!/^[a-zа-яё0-9_.-]{3,24}$/i.test(name)) throw new Error('Логин: 3–24 символа, буквы, цифры, точка, дефис или _');
    if (password.length < 6) throw new Error('Пароль должен содержать не менее 6 символов');
    if (data.users.some((item) => item.login.toLowerCase() === name)) throw new Error('Этот логин уже занят');
    const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
    const account = {
      id: nextId(data.users), login: name, role: 'client', status: 'active',
      createdAt: new Date().toISOString(), passwordSalt: salt,
      passwordHash: await hashPassword(password, salt),
    };
    setData((current) => ({ ...current, users: [...current.users, account] }));
    setSessionId(account.id);
    return account;
  }

  function logout() { setSessionId(null); }

  function createNote({ title, content, tags }) {
    if (!user || user.role !== 'client') return null;
    const now = new Date().toISOString();
    const note = { id: nextId(data.notes), userId: user.id, title: title.trim(), content: content.trim(), tags, createdAt: now, updatedAt: now };
    setData((current) => ({ ...current, notes: [note, ...current.notes] }));
    return note;
  }

  function updateNote(id, changes) {
    if (!user || user.role !== 'client') return;
    setData((current) => ({ ...current, notes: current.notes.map((note) =>
      String(note.id) === String(id) && note.userId === user.id
        ? { ...note, title: changes.title.trim(), content: changes.content.trim(), tags: changes.tags, updatedAt: new Date().toISOString() }
        : note) }));
  }

  function deleteNote(id) {
    if (!user || user.role !== 'client') return;
    setData((current) => ({ ...current, notes: current.notes.filter((note) => String(note.id) !== String(id) || note.userId !== user.id) }));
  }

  function createTag(name) {
    if (!user || user.role !== 'client') return null;
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Введите название тега');
    const existing = data.tags.find((tag) => tag.userId === user.id && tag.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;
    const tag = { id: nextId(data.tags), userId: user.id, name: trimmed };
    setData((current) => ({ ...current, tags: [...current.tags, tag] }));
    return tag;
  }

  function deleteTag(id) {
    if (!user || user.role !== 'client') return;
    if (!data.tags.some((tag) => String(tag.id) === String(id) && tag.userId === user.id)) return;
    setData((current) => ({
      ...current,
      tags: current.tags.filter((tag) => String(tag.id) !== String(id)),
      notes: current.notes.map((note) => note.userId === user.id ? { ...note, tags: note.tags.filter((tagId) => String(tagId) !== String(id)) } : note),
    }));
  }

  const value = { mode: 'demo', data, user, loading: false, loadError: '', login, register, logout, createNote, updateNote, deleteNote, createTag, deleteTag };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
