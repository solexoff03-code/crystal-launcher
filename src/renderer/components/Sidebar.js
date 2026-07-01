import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../App';
import './Sidebar.css';

const navItems = [
  { to: '/', icon: HomeIcon, label: 'Accueil', end: true },
  { to: '/versions', icon: CubeIcon, label: 'Versions' },
  { to: '/profiles', icon: SettingsSliderIcon, label: 'Profils' },
  { to: '/accounts', icon: PersonIcon, label: 'Comptes' },
  { to: '/console', icon: TerminalIcon, label: 'Console' },
];

export default function Sidebar() {
  const { activeAccount, accounts, gameRunning } = useApp();

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' sidebar-link--active' : ''}`
            }
          >
            <Icon />
            <span>{label}</span>
            {to === '/console' && gameRunning && (
              <span className="sidebar-dot sidebar-dot--green" />
            )}
            {to === '/accounts' && accounts.length === 0 && (
              <span className="sidebar-dot sidebar-dot--red" />
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `sidebar-link${isActive ? ' sidebar-link--active' : ''}`
          }
        >
          <GearIcon />
          <span>Paramètres</span>
        </NavLink>

        <div className="sidebar-account">
          {activeAccount ? (
            <>
              <div className="sidebar-account-avatar">
                {activeAccount.type === 'offline' ? (
                  <span>⚡</span>
                ) : (
                  <img
                    src={`https://crafatar.com/avatars/${activeAccount.uuid}?size=32&overlay`}
                    alt={activeAccount.username}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                )}
              </div>
              <div className="sidebar-account-info">
                <span className="sidebar-account-name">{activeAccount.username}</span>
                <span className={`badge badge-${activeAccount.type}`}>
                  {activeAccount.type === 'msa' ? 'Microsoft' : 'Hors-ligne'}
                </span>
              </div>
            </>
          ) : (
            <NavLink to="/accounts" className="sidebar-account-empty">
              Aucun compte
            </NavLink>
          )}
        </div>
      </div>
    </aside>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function CubeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
}
function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}
function TerminalIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5"/>
      <line x1="12" y1="19" x2="20" y2="19"/>
    </svg>
  );
}
function SettingsSliderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6"/>
      <line x1="4" y1="12" x2="20" y2="12"/>
      <line x1="4" y1="18" x2="20" y2="18"/>
      <circle cx="8" cy="6" r="2" fill="currentColor" stroke="none"/>
      <circle cx="16" cy="12" r="2" fill="currentColor" stroke="none"/>
      <circle cx="10" cy="18" r="2" fill="currentColor" stroke="none"/>
    </svg>
  );
}
