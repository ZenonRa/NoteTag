import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Brand from '../../components/Brand';
import Icon from '../../components/Icon';
import { useApp } from '../../state/useApp';

export default function Login({ mode }) {
  const isRegister = mode === 'register';
  const { login, register, mode: dataMode } = useApp();
  const navigate = useNavigate();
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (isRegister && password !== repeat) { setError('Пароли не совпадают'); return; }
    setPending(true);
    try {
      const account = isRegister ? await register(loginName, password) : await login(loginName, password);
      navigate(account.role === 'admin' ? '/admin' : '/notes', { replace: true });
    } catch (err) { setError(err.message || 'Не удалось войти'); }
    finally { setPending(false); }
  }

  async function openDemo(role) {
    setError('');
    setPending(true);
    try {
      const credentials = dataMode === 'api'
        ? role === 'admin' ? ['demo_admin', 'admin123'] : ['demo_andrey', 'password123']
        : role === 'admin' ? ['admin', 'admin1234'] : ['ivanov', 'demo1234'];
      const account = await login(...credentials);
      navigate(account.role === 'admin' ? '/admin' : '/notes', { replace: true });
    } catch (err) { setError(err.message || 'Не удалось открыть демо'); }
    finally { setPending(false); }
  }

  return <main className="auth-page">
    <section className="auth-art" aria-label="NoteTag">
      <div className="auth-art-top"><Brand light /></div>
      <div className="auth-art-content">
        <div className="auth-art-icon"><Icon name="note" size={31} strokeWidth={1.5} /></div>
        <p className="auth-kicker">МЫСЛИ ПОД РУКОЙ</p>
        <h1>Ваши идеи.<br />На своём месте.</h1>
        <p>Сохраняйте важное, раскладывайте по тегам и находите нужное за секунды.</p>
      </div>
      <div className="auth-art-bottom"><span className="auth-art-line" /> Простое пространство для ваших заметок</div>
      <div className="auth-orb auth-orb-one" /><div className="auth-orb auth-orb-two" />
    </section>

    <section className="auth-panel">
      <div className="auth-mobile-brand"><Brand /></div>
      <div className="auth-card">
        <div className="auth-heading-icon"><Icon name={isRegister ? 'sparkle' : 'note'} size={24} /></div>
        <p className="eyebrow">{isRegister ? 'НОВЫЙ АККАУНТ' : 'С ВОЗВРАЩЕНИЕМ'}</p>
        <h2>{isRegister ? 'Создайте аккаунт' : 'Войдите в NoteTag'}</h2>
        <p className="auth-subtitle">{isRegister ? 'Начните собирать свои идеи в одном месте.' : 'Ваши заметки и идеи уже ждут вас.'}</p>

        <form className="auth-form" onSubmit={submit}>
          <label htmlFor="login-name">Логин</label>
          <input id="login-name" autoComplete="username" value={loginName} onChange={(event) => setLoginName(event.target.value)} placeholder="Введите логин" required />
          <label htmlFor="password">Пароль</label>
          <div className="password-field"><input id="password" type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Введите пароль" required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}><Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} /></button></div>
          {isRegister && <><label htmlFor="repeat-password">Повторите пароль</label><input id="repeat-password" type="password" autoComplete="new-password" value={repeat} onChange={(event) => setRepeat(event.target.value)} placeholder="Повторите пароль" required /></>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary auth-submit" type="submit" disabled={pending}>{pending ? 'Подождите…' : isRegister ? 'Создать аккаунт' : 'Войти'}<Icon name="arrowRight" size={18} /></button>
        </form>

        <p className="auth-switch">{isRegister ? 'Уже есть аккаунт?' : 'Нет аккаунта?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Войти' : 'Зарегистрироваться'}</Link></p>

        {(import.meta.env.DEV || dataMode === 'demo') && <div className="demo-access"><span>ИЛИ ПОПРОБУЙТЕ ДЕМО</span><div><button type="button" onClick={() => openDemo('client')} disabled={pending}>Клиент</button><button type="button" onClick={() => openDemo('admin')} disabled={pending}>Администратор</button></div></div>}
      </div>
      <p className="auth-footnote">NoteTag · Всё важное на виду</p>
    </section>
  </main>;
}
