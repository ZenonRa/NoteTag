import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ClientHeader from '../../components/ClientHeader';
import Icon from '../../components/Icon';
import { useApp } from '../../state/useApp';
import './NotesList.css';

const dateFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });

export default function NotesList() {
  const { data, user, createTag, deleteTag } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [sort, setSort] = useState('newest');
  const [tagModal, setTagModal] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [tagError, setTagError] = useState('');
  const [tagPending, setTagPending] = useState(false);

  const notes = useMemo(() => data.notes.filter((note) => note.userId === user.id), [data.notes, user.id]);
  const tags = useMemo(() => data.tags.filter((tag) => tag.userId === user.id), [data.tags, user.id]);
  const shown = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('ru');
    return notes.filter((note) =>
      (!selectedTag || note.tags.some((id) => String(id) === String(selectedTag))) &&
      (!search || `${note.title} ${note.content}`.toLocaleLowerCase('ru').includes(search))
    ).sort((a, b) => sort === 'oldest'
      ? new Date(a.updatedAt) - new Date(b.updatedAt)
      : new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [notes, query, selectedTag, sort]);

  async function addTag(event) {
    event.preventDefault();
    setTagPending(true);
    try { await createTag(newTag); setNewTag(''); setTagError(''); }
    catch (error) { setTagError(error.message); }
    finally { setTagPending(false); }
  }

  return <div className="app-page">
    <ClientHeader />
    <main className="notes-page">
      <div className="notes-intro">
        <div><p className="eyebrow">ВАШЕ ПРОСТРАНСТВО</p><h1>Мои заметки<span className="heading-dot">.</span></h1><p className="intro-subtitle">Мысли, планы и идеи — всё в одном месте.</p></div>
        <button className="button button-primary new-note-top" type="button" onClick={() => navigate('/notes/new')}><Icon name="plus" size={19} /> Новая заметка</button>
      </div>

      <div className="notes-summary">
        <div className="summary-icon"><Icon name="note" size={22} /></div>
        <div><strong>{notes.length}</strong><span>{notes.length === 1 ? 'заметка' : notes.length >= 2 && notes.length <= 4 ? 'заметки' : 'заметок'} в вашей коллекции</span></div>
        <div className="summary-divider" />
        <div className="summary-icon summary-tag"><Icon name="tag" size={21} /></div>
        <div><strong>{tags.length}</strong><span>{tags.length === 1 ? 'тег' : tags.length >= 2 && tags.length <= 4 ? 'тега' : 'тегов'} для порядка</span></div>
        <div className="summary-art"><Icon name="sparkle" size={30} /></div>
      </div>

      <div className="notes-toolbar">
        <div className="search-field"><Icon name="search" size={20} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по заметкам..." aria-label="Поиск по заметкам" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Очистить поиск"><Icon name="close" size={16} /></button>}</div>
        <label className="sort-field"><span>Сортировка:</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Сначала новые</option><option value="oldest">Сначала старые</option></select><Icon name="chevronDown" size={16} /></label>
      </div>

      <div className="tag-filter-row"><span className="filter-label"><Icon name="tag" size={16} /> Теги</span><div className="tag-filter-list"><button type="button" className={`filter-chip ${selectedTag === null ? 'active' : ''}`} onClick={() => setSelectedTag(null)}>Все заметки</button>{tags.map((tag) => <button type="button" key={tag.id} className={`filter-chip ${selectedTag === tag.id ? 'active' : ''}`} onClick={() => setSelectedTag(tag.id)}>{tag.name}</button>)}</div><button type="button" className="manage-tags" onClick={() => setTagModal(true)}>Управлять тегами <Icon name="arrowRight" size={15} /></button></div>

      <div className="section-heading"><div><h2>{selectedTag ? `Тег «${tags.find((tag) => tag.id === selectedTag)?.name ?? ''}»` : query ? 'Результаты поиска' : 'Все заметки'}</h2><p>{shown.length} из {notes.length}</p></div></div>

      {shown.length ? <div className="notes-grid">{shown.map((note) => <Link to={`/notes/${note.id}`} className="note-card" key={note.id}>
        <div className="note-card-top"><span className="note-card-icon"><Icon name="note" size={20} /></span><span className="note-card-arrow"><Icon name="arrowRight" size={18} /></span></div>
        <h3>{note.title || 'Без названия'}</h3><p className="note-preview">{note.content || 'Без дополнительного текста'}</p>
        <div className="note-card-tags">{note.tags.map((id) => { const tag = tags.find((item) => item.id === id); return tag ? <span className="note-tag" key={id}># {tag.name}</span> : null; })}</div>
        <div className="note-card-footer"><Icon name="calendar" size={15} /> Обновлено {dateFormatter.format(new Date(note.updatedAt))}</div>
      </Link>)}</div> : <div className="empty-state"><div className="empty-icon"><Icon name={notes.length ? 'search' : 'note'} size={29} /></div><h3>{notes.length ? 'Ничего не найдено' : 'Здесь пока нет заметок'}</h3><p>{notes.length ? 'Попробуйте изменить запрос или выбрать другой тег.' : 'Создайте первую заметку и сохраните важную мысль.'}</p>{notes.length ? <button type="button" className="button button-outline" onClick={() => { setQuery(''); setSelectedTag(null); }}>Сбросить фильтры</button> : <button type="button" className="button button-primary" onClick={() => navigate('/notes/new')}><Icon name="plus" size={18} /> Создать заметку</button>}</div>}
    </main>

    {tagModal && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setTagModal(false); }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="tag-modal-title"><div className="modal-head"><div><p className="eyebrow">ОРГАНИЗАЦИЯ</p><h2 id="tag-modal-title">Управление тегами</h2></div><button type="button" className="icon-button" onClick={() => setTagModal(false)} aria-label="Закрыть"><Icon name="close" size={20} /></button></div><p className="modal-description">Теги помогают быстро находить заметки. При удалении тега заметки сохранятся.</p><form className="tag-create-form" onSubmit={addTag}><input value={newTag} onChange={(event) => setNewTag(event.target.value)} placeholder="Название нового тега" maxLength={100} aria-label="Название нового тега" /><button type="submit" className="button button-primary" disabled={tagPending}><Icon name="plus" size={18} /> Добавить</button></form>{tagError && <p className="form-error" role="alert">{tagError}</p>}<div className="tag-management-list">{tags.length ? tags.map((tag) => <div key={tag.id}><span className="note-tag"># {tag.name}</span><span className="tag-usage">{notes.filter((note) => note.tags.includes(tag.id)).length} заметок</span><button type="button" className="icon-button danger" title={`Удалить тег ${tag.name}`} aria-label={`Удалить тег ${tag.name}`} disabled={tagPending} onClick={async () => { if (!window.confirm(`Удалить тег «${tag.name}»?`)) return; setTagPending(true); try { await deleteTag(tag.id); if (selectedTag === tag.id) setSelectedTag(null); setTagError(''); } catch (error) { setTagError(error.message); } finally { setTagPending(false); } }}><Icon name="trash" size={17} /></button></div>) : <p className="tag-list-empty">Пока нет тегов</p>}</div></div></div>}
  </div>;
}
