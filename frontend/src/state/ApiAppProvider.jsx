import { useEffect, useState } from 'react';
import { api, decodeNote, decodeSession, encodeNote } from '../api/notetag';
import { AppContext } from './context';

const SESSION_KEY = 'notetag-api-session-v1';
const emptyData = { users: [], notes: [], tags: [], stats: { usersCount: 0, notesCount: 0, tagsCount: 0 } };

function readSession() {
  try { return decodeSession(sessionStorage.getItem(SESSION_KEY) || ''); }
  catch { return null; }
}

async function loadData(session) {
  if (session.user.role === 'admin') {
    const [users, stats] = await Promise.all([api.adminUsers(session.token), api.adminStats(session.token)]);
    return { ...emptyData, users, stats };
  }
  const [notes, tags] = await Promise.all([api.notes(session.token), api.tags(session.token)]);
  return { ...emptyData, notes: notes.map((note) => ({ ...decodeNote(note), userId: session.user.id })), tags };
}

export function ApiAppProvider({ children }) {
  const [session, setSession] = useState(readSession);
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(Boolean(session));
  const [loadError, setLoadError] = useState('');
  const user = session?.user ?? null;

  useEffect(() => {
    if (session) sessionStorage.setItem(SESSION_KEY, session.token);
    else sessionStorage.removeItem(SESSION_KEY);
  }, [session]);

  useEffect(() => {
    if (!session) return;
    let active = true;
    loadData(session).then((next) => { if (active) { setData(next); setLoadError(''); } })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401) { setSession(null); setData(emptyData); }
        else setLoadError(error.message);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session]);

  async function refresh() {
    if (!session) return;
    try { setData(await loadData(session)); setLoadError(''); }
    catch (error) {
      if (error.status === 401) { logout(); throw new Error('Сессия закончилась. Войдите снова.'); }
      setLoadError(error.message);
      throw error;
    }
  }

  async function login(loginName, password) {
    const response = await api.login(loginName.trim(), password);
    const next = decodeSession(response.accessToken);
    if (!next) throw new Error('Сервер вернул некорректный токен');
    setData(emptyData);
    setLoading(true);
    setLoadError('');
    setSession(next);
    return next.user;
  }

  async function register(loginName, password) {
    await api.register(loginName.trim(), password);
    return login(loginName, password);
  }

  function logout() { setSession(null); setData(emptyData); setLoadError(''); setLoading(false); }

  async function createNote({ title, content, tags }) {
    const created = await api.createNote(session.token, encodeNote(title, content));
    try { await Promise.all(tags.map((tagId) => api.attachTag(session.token, created.id, tagId))); }
    catch (error) {
      const partial = new Error(`Заметка создана, но теги не удалось сохранить: ${error.message}`);
      partial.createdId = created.id;
      try { await refresh(); } catch { /* Keep the created note id for a safe retry. */ }
      throw partial;
    }
    await refresh();
    return created;
  }

  async function updateNote(id, changes) {
    const current = data.notes.find((note) => String(note.id) === String(id));
    await api.updateNote(session.token, id, encodeNote(changes.title, changes.content));
    const before = current?.tags || [];
    const added = changes.tags.filter((tagId) => !before.includes(tagId));
    const removed = before.filter((tagId) => !changes.tags.includes(tagId));
    try {
      await Promise.all([
        ...added.map((tagId) => api.attachTag(session.token, id, tagId)),
        ...removed.map((tagId) => api.detachTag(session.token, id, tagId)),
      ]);
    } catch (error) {
      await refresh();
      throw new Error(`Текст сохранён, но теги не удалось обновить: ${error.message}`);
    }
    await refresh();
  }

  async function deleteNote(id) { await api.deleteNote(session.token, id); await refresh(); }

  async function createTag(name) {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Введите название тега');
    const existing = data.tags.find((tag) => tag.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;
    const created = await api.createTag(session.token, trimmed);
    setData((current) => ({ ...current, tags: [...current.tags, created] }));
    return created;
  }

  async function deleteTag(id) { await api.deleteTag(session.token, id); await refresh(); }

  const value = { mode: 'api', data, user, loading, loadError, refresh, login, register, logout, createNote, updateNote, deleteNote, createTag, deleteTag };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
