import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../App';
import './Sidebar.css';

const NAV = [
  { to: '/',          icon: '🏠', label: 'Accueil'    },
  { to: '/versions',  icon: '📦', label: 'Versions'   },
  { to: '/profiles',  icon: '🎮', label: 'Profils'    },
  { to: '/accounts',  icon: '👤', label: 'Comptes'    },
  { to: '/console',   icon: '📊', label: 'Console'    },
  { to: '/shaders',   icon: '🎨', label: 'Shaders'    },
  { to: '/settings',  icon: '⚙️', label: 'Paramètres' },
];

export default function Sidebar() {
  const { activeAccount } = useApp();

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">⬡</span>
        <span className="sidebar-logo-name">CRYSTAL<br/>LAUNCHER</span>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {activeAccount ? (
          <div className="sidebar-account">
            <div className="sidebar-avatar">
              {activeAccount.type === 'offline' ? '⚡' : '👤'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="sidebar-username">{activeAccount.username}</div>
              <div className={`sidebar-status${activeAccount.type === 'offline' ? ' offline' : ''}`}>
                {activeAccount.type === 'offline' ? 'HORS-LIGNE' : 'MICROSOFT'}
              </div>
            </div>
          </div>
        ) : (
          <div className="sidebar-account">
            <div className="sidebar-avatar">👤</div>
            <div>
              <div className="sidebar-username">Non connecté</div>
              <div className="sidebar-status offline">DÉCONNECTÉ</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
