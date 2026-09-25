import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/useApp';
import Brand from './Brand';
import Icon from './Icon';

export default function ClientHeader({ back = false }) {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  return <header className="client-header">
    <div className="client-header-inner">
      {back ? <button className="header-back" type="button" onClick={() => navigate('/notes')} aria-label="К списку заметок"><Icon name="arrowLeft" size={19} /></button> : null}
      <button className="brand-button" type="button" onClick={() => navigate('/notes')}><Brand /></button>
      <div className="header-right">
        <span className="header-user"><span className="avatar">{user?.login?.slice(0, 1).toUpperCase()}</span><span>{user?.login}</span></span>
        <button className="icon-button header-logout" type="button" onClick={() => { logout(); navigate('/login'); }} title="Выйти" aria-label="Выйти"><Icon name="logout" size={18} /></button>
      </div>
    </div>
  </header>;
}
