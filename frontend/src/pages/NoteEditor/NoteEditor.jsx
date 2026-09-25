import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ClientHeader from '../../components/ClientHeader';
import Icon from '../../components/Icon';
import { useApp } from '../../state/useApp';

export default function NoteEditor() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { data, user, createNote, updateNote, deleteNote, createTag } = useApp();
  const existing = id ? data.notes.find((item) => String(item.id) === String(id) && item.userId === user.id) : null;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [content, setContent] = useState(existing?.content ?? '');
  const [selectedTags, setSelectedTags] = useState(existing?.tags ?? []);
  const [tagPicker, setTagPicker] = useState(false);
  const [tagName, setTagName] = useState('');
  const [error, setError] = useState(location.state?.warning || '');
  const [pending, setPending] = useState(false);
  const tags = data.tags.filter((tag) => tag.userId === user.id);
  const changed = title !== (existing?.title ?? '') || content !== (existing?.content ?? '') || JSON.stringify([...selectedTags].sort()) !== JSON.stringify([...(existing?.tags ?? [])].sort());

  function goBack() {
    if (changed && !window.confirm('Изменения не сохранены. Вернуться к заметкам?')) return;
    navigate('/notes');
  }

  async function save(event) {
    event?.preventDefault();
    if (pending) return;
    if (!title.trim() && !content.trim()) { setError('Добавьте заголовок или текст заметки'); return; }
    const values = { title: title.trim() || 'Без названия', content, tags: selectedTags };
    setPending(true);
    try {
      if (existing) await updateNote(existing.id, values);
      else await createNote(values);
      navigate('/notes');
    } catch (err) {
      if (err.createdId) navigate(`/notes/${err.createdId}`, { replace: true, state: { warning: err.message } });
      else setError(err.message || 'Не удалось сохранить заметку');
    }
    finally { setPending(false); }
  }

  async function remove() {
    if (!existing || !window.confirm('Удалить эту заметку? Это действие нельзя отменить.')) return;
    setPending(true);
    try { await deleteNote(existing.id); navigate('/notes'); }
    catch (err) { setError(err.message || 'Не удалось удалить заметку'); }
    finally { setPending(false); }
  }

  async function addTag(event) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      const tag = await createTag(tagName);
      setSelectedTags((current) => current.includes(tag.id) ? current : [...current, tag.id]);
      setTagName(''); setError(''); setTagPicker(false);
    } catch (err) { setError(err.message); }
    finally { setPending(false); }
  }

  if (id && !existing) return <div className="app-page"><ClientHeader back /><main className="editor-not-found"><div className="empty-icon"><Icon name="note" size={29} /></div><h1>Заметка не найдена</h1><p>Возможно, она была удалена или принадлежит другому пользователю.</p><button className="button button-primary" onClick={() => navigate('/notes')}>К заметкам</button></main></div>;

  return <div className="app-page"><ClientHeader back /><main className="editor-page">
    <div className="editor-nav"><button type="button" onClick={goBack}><Icon name="arrowLeft" size={18} /> Все заметки</button><span> / </span><strong>{existing ? 'Редактирование' : 'Новая заметка'}</strong></div>
    <div className="editor-heading"><div><p className="eyebrow">{existing ? 'РЕДАКТИРОВАНИЕ ЗАМЕТКИ' : 'НОВАЯ ЗАМЕТКА'}</p><h1>{existing ? 'Сохраните мысль яркой.' : 'Начните с идеи.'}</h1><p>Запишите важное и добавьте теги, чтобы легко вернуться к нему позже.</p></div>{existing && <button type="button" className="button-delete" onClick={remove} disabled={pending}><Icon name="trash" size={17} /> Удалить</button>}</div>
    <form className="editor-card" onSubmit={save} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') save(event); }}>
      <label className="editor-label" htmlFor="note-title">ЗАГОЛОВОК</label>
      <input className="editor-title" id="note-title" value={title} onChange={(event) => { setTitle(event.target.value); setError(''); }} placeholder="Название заметки" maxLength={120} autoFocus />
      <div className="editor-rule" />
      <span className="editor-label">ТЕГИ</span>
      <div className="editor-tags">{selectedTags.map((tagId) => { const tag = tags.find((item) => item.id === tagId); return tag ? <span className="editor-tag" key={tag.id}># {tag.name}<button type="button" aria-label={`Убрать тег ${tag.name}`} onClick={() => setSelectedTags((current) => current.filter((item) => item !== tagId))}><Icon name="close" size={13} /></button></span> : null; })}<button type="button" className="add-tag-button" onClick={() => setTagPicker((value) => !value)}><Icon name="plus" size={15} /> Добавить тег</button></div>
      {tagPicker && <div className="tag-picker"><div className="tag-picker-head">Выберите тег</div><div className="tag-picker-options">{tags.length ? tags.map((tag) => <button type="button" key={tag.id} className={selectedTags.includes(tag.id) ? 'selected' : ''} onClick={() => setSelectedTags((current) => current.includes(tag.id) ? current.filter((item) => item !== tag.id) : [...current, tag.id])}># {tag.name}{selectedTags.includes(tag.id) && <Icon name="check" size={16} />}</button>) : <p>Тегов пока нет</p>}</div><div className="tag-picker-create"><input value={tagName} onChange={(event) => setTagName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addTag(event); } }} placeholder="Новый тег" maxLength={100} aria-label="Новый тег" /><button type="button" onClick={addTag} aria-label="Создать тег" disabled={pending}><Icon name="plus" size={18} /></button></div></div>}
      <div className="editor-rule" />
      <label className="editor-label" htmlFor="note-content">СОДЕРЖИМОЕ</label>
      <textarea className="editor-content" id="note-content" value={content} onChange={(event) => { setContent(event.target.value); setError(''); }} placeholder="Начните писать здесь..." />
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="editor-actions"><span>{content.length} символов</span><div><button type="button" className="button button-outline" onClick={goBack} disabled={pending}>Отмена</button><button type="submit" className="button button-primary" disabled={pending}><Icon name="check" size={18} /> {pending ? 'Сохраняем…' : existing ? 'Сохранить изменения' : 'Создать заметку'}</button></div></div>
    </form>
  </main></div>;
}
