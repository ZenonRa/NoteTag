import axios from 'axios';

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

const http = axios.create({ baseURL: API_URL, timeout: 10000 });

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const knownMessages = {
  'Invalid login or password': 'Неверный логин или пароль',
  'Login already exists': 'Этот логин уже занят',
  'Tag with this name already exists': 'Такой тег уже существует',
  'Note not found': 'Заметка не найдена',
  'Tag not found': 'Тег не найден',
};

function getError(error) {
  if (!error.response) return new ApiError(`Не удалось связаться с сервером (${API_URL}). Проверьте, что backend запущен.`);
  const { status, data } = error.response;
  const raw = data?.message;
  const message = Array.isArray(raw) ? raw.join('; ') : raw;
  if (status === 401 && !message) return new ApiError('Сессия закончилась. Войдите снова.', status);
  return new ApiError(knownMessages[message] || message || `Ошибка сервера (${status})`, status);
}

async function request(method, path, { token, data, params } = {}) {
  try {
    const response = await http.request({
      method, url: path, data, params,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data ?? null;
  } catch (error) { throw getError(error); }
}

async function allPages(path, token, filters = {}) {
  const first = await request('get', path, { token, params: { ...filters, page: 1, limit: 100 } });
  const totalPages = Math.max(1, first.totalPages || 1);
  if (totalPages === 1) return first.items;
  const otherPages = await Promise.all(Array.from({ length: totalPages - 1 }, (_, index) =>
    request('get', path, { token, params: { ...filters, page: index + 2, limit: 100 } })));
  return [first, ...otherPages].flatMap((page) => page.items);
}

export const api = {
  register: (login, password) => request('post', '/auth/register', { data: { login, password } }),
  login: (login, password) => request('post', '/auth/login', { data: { login, password } }),
  notes: (token, tagIds = []) => allPages('/notes', token, tagIds.length ? { tagIds: tagIds.join(',') } : {}),
  note: (token, id) => request('get', `/notes/${id}`, { token }),
  tags: (token) => allPages('/tags', token),
  adminUsers: (token) => allPages('/admin/users', token),
  adminStats: (token) => request('get', '/admin/stats', { token }),
  createNote: (token, content) => request('post', '/notes', { token, data: { content } }),
  updateNote: (token, id, content) => request('patch', `/notes/${id}`, { token, data: { content } }),
  deleteNote: (token, id) => request('delete', `/notes/${id}`, { token }),
  createTag: (token, name) => request('post', '/tags', { token, data: { name } }),
  deleteTag: (token, id) => request('delete', `/tags/${id}`, { token }),
  attachTag: (token, noteId, tagId) => request('post', `/notes/${noteId}/tags/${tagId}`, { token }),
  detachTag: (token, noteId, tagId) => request('delete', `/notes/${noteId}/tags/${tagId}`, { token }),
};

export function decodeSession(accessToken) {
  try {
    const part = accessToken.split('.')[1];
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    if (!Number.isInteger(payload.sub) || !payload.login || !['client', 'admin'].includes(payload.role)) return null;
    if (payload.exp && payload.exp * 1000 <= Date.now()) return null;
    return { token: accessToken, user: { id: payload.sub, login: payload.login, role: payload.role } };
  } catch { return null; }
}

// The current backend stores only `content`. Keep title and body reversible in that field.
export function encodeNote(title, body) {
  const heading = title.trim() || 'Без названия';
  const text = body.trim();
  return text ? `${heading}\n\n${text}` : heading;
}

export function decodeNote(note) {
  const raw = note.content || '';
  const divider = raw.indexOf('\n\n');
  return {
    id: note.id,
    title: divider >= 0 ? raw.slice(0, divider) : raw.slice(0, 120),
    content: divider >= 0 ? raw.slice(divider + 2) : '',
    tags: (note.tags || []).map((tag) => tag.id),
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}
