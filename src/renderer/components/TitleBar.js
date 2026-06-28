import React from 'react';
import './TitleBar.css';

const ipc = window.electron;

export default function TitleBar() {
  return (
    <div className="titlebar">
      <div className="titlebar-drag" />
      <div className="titlebar-logo">
        <span className="titlebar-icon">⬡</span>
        <span className="titlebar-name">Crystal Launcher</span>
      </div>
      <div className="titlebar-drag" />
      <div className="titlebar-controls">
        <button className="titlebar-btn" onClick={() => ipc.minimize()} title="Réduire">
          <svg width="12" height="2" viewBox="0 0 12 2" fill="currentColor">
            <rect width="12" height="2" rx="1"/>
          </svg>
        </button>
        <button className="titlebar-btn" onClick={() => ipc.maximize()} title="Agrandir">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="0.75" y="0.75" width="9.5" height="9.5" rx="1.5"/>
          </svg>
        </button>
        <button className="titlebar-btn titlebar-btn--close" onClick={() => ipc.close()} title="Fermer">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
            <line x1="1" y1="1" x2="11" y2="11"/>
            <line x1="11" y1="1" x2="1" y2="11"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
