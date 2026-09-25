import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Brand from '../../components/Brand';
import Icon from '../../components/Icon';
import { useApp } from '../../state/useApp';

const dateFormatter = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function Admin() {
  const { data, user, logout, mode } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('users');
  const [query, setQuery] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const users = useMemo(() => data.users.filter((item) => item.login.toLowerCase().includes(query.toLowerCase())), [data.users, query]);
  const clients = data.users.filter((item) => item.role === 'client');
  const stats = mode === 'api' ? data.stats : { usersCount: data.users.length, notesCount: data.notes.length, tagsCount: data.tags.length };

  function switchTab(next) { setTab(next); setMobileMenu(false); }
  function exit() { logout(); navigate('/login'); }

  return <div className="admin-page">
    <aside className={`admin-sidebar ${mobileMenu ? 'open' : ''}`}>
      <div className="admin-sidebar-brand"><Brand light /><span>ADMIN</span></div>
      <p className="admin-nav-label">РАБОЧЕЕ ПРОСТРАНСТВО</p>
      <nav className="admin-nav" aria-label="Администрирование">
        <button type="button" className={tab === 'users' ? 'active' : ''} onClick={() => switchTab('users')}><Icon name="users" size={19} /> Пользователи</button>
        <button type="button" className={tab === 'stats' ? 'active' : ''} onClick={() => switchTab('stats')}><Icon name="chart" size={19} /> Статистика</button>
      </nav>
      <div className="admin-sidebar-bottom"><div className="admin-profile"><span className="admin-avatar">{user.login[0].toUpperCase()}</span><div><strong>{user.login}</strong><span>Администратор</span></div></div><button type="button" onClick={exit}><Icon name="logout" size={19} /> Выйти</button></div>
    </aside>

    <main className="admin-main">
      <header className="admin-topbar"><button type="button" className="admin-mobile-menu icon-button" onClick={() => setMobileMenu((value) => !value)} aria-label="Открыть меню"><Icon name="grid" size={21} /></button><span>Панель управления <span className="admin-topbar-divider">/</span> <strong>{tab === 'users' ? 'Пользователи' : 'Статистика'}</strong></span><span className="admin-topbar-avatar">{user.login[0].toUpperCase()}</span></header>
      <div className="admin-content">
        <div className="admin-intro"><p className="eyebrow">ОБЗОР СИСТЕМЫ</p><h1>{tab === 'users' ? 'Пользователи' : 'Статистика'}<span className="heading-dot">.</span></h1><p>{tab === 'users' ? 'Просматривайте список зарегистрированных пользователей.' : 'Основные показатели вашего пространства NoteTag.'}</p></div>
        <div className="admin-stats-grid">
          <div className="admin-stat-card"><span className="admin-stat-icon indigo"><Icon name="users" size={21} /></span><span>Пользователей</span><strong>{stats.usersCount}</strong><small>{clients.length} клиентов в списке</small></div>
          <div className="admin-stat-card"><span className="admin-stat-icon blue"><Icon name="note" size={21} /></span><span>Заметок</span><strong>{stats.notesCount}</strong><small>Во всей системе</small></div>
          <div className="admin-stat-card"><span className="admin-stat-icon mint"><Icon name="tag" size={21} /></span><span>Тегов</span><strong>{stats.tagsCount}</strong><small>Создано пользователями</small></div>
        </div>
        {tab === 'users' ? <section className="admin-table-card">
          <div className="admin-table-heading"><div><h2>Все пользователи</h2><p>Логины и роли без доступа к содержимому заметок</p></div><div className="search-field admin-search"><Icon name="search" size={19} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по логину" aria-label="Поиск пользователей" /></div></div>
          <div className="table-scroll"><table><thead><tr><th>ПОЛЬЗОВАТЕЛЬ</th><th>ДАТА РЕГИСТРАЦИИ</th><th>РОЛЬ</th></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td><span className="user-cell"><span className="user-cell-avatar">{item.login[0].toUpperCase()}</span><strong>{item.login}</strong></span></td><td>{dateFormatter.format(new Date(item.createdAt))}</td><td>{item.role === 'admin' ? 'Администратор' : 'Клиент'}</td></tr>)}</tbody></table>{!users.length && <p className="table-empty">Пользователи не найдены</p>}</div>
          <div className="admin-table-footer">Показано {users.length} из {data.users.length} пользователей</div>
        </section> : <section className="admin-details">
          <div className="admin-detail-card"><div className="admin-detail-title"><span className="admin-stat-icon indigo"><Icon name="users" size={21} /></span><div><h2>Аудитория</h2><p>Зарегистрированные аккаунты</p></div></div><div className="detail-row"><span>Клиенты</span><strong>{clients.length}</strong></div><div className="detail-row"><span>Администраторы</span><strong>{data.users.length - clients.length}</strong></div><div className="detail-row"><span>Всего пользователей</span><strong>{stats.usersCount}</strong></div></div>
          <div className="admin-detail-card"><div className="admin-detail-title"><span className="admin-stat-icon blue"><Icon name="note" size={21} /></span><div><h2>Контент</h2><p>Только сводные данные</p></div></div><div className="detail-row"><span>Всего заметок</span><strong>{stats.notesCount}</strong></div><div className="detail-row"><span>Всего тегов</span><strong>{stats.tagsCount}</strong></div><div className="detail-row"><span>Заметок на клиента</span><strong>{clients.length ? (stats.notesCount / clients.length).toFixed(1) : '0'}</strong></div></div>
        </section>}
      </div>
    </main>
  </div>;
}
