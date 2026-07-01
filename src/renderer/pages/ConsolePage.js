import React, { useEffect, useRef } from 'react';
import { useApp } from '../App';
import './ConsolePage.css';

export default function ConsolePage() {
  const { consoleLogs, gameRunning, launching } = useApp();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleLogs]);

  const getLogClass = (type) => {
    if (type === 'error') return 'log-error';
    if (type === 'info') return 'log-info';
    return 'log-default';
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  const copyLogs = () => {
    const text = consoleLogs.map(l => `[${formatTime(l.time)}] ${l.text}`).join('\n');
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="console-page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1>Console</h1>
          <p>{gameRunning ? 'Minecraft en cours d\'exécution' : launching ? 'Démarrage…' : 'En attente'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {(gameRunning || launching) && (
            <span className="console-status">
              <span className="console-status-dot" />
              {gameRunning ? 'En jeu' : 'Démarrage…'}
            </span>
          )}
          <button className="btn btn-ghost" onClick={copyLogs} disabled={consoleLogs.length === 0}>
            Copier les logs
          </button>
        </div>
      </div>

      <div className="console-box">
        {consoleLogs.length === 0 ? (
          <div className="console-empty">
            <span>En attente du lancement de Minecraft…</span>
          </div>
        ) : (
          consoleLogs.map((log, i) => (
            <div key={i} className={`console-line ${getLogClass(log.type)}`}>
              <span className="console-time">[{formatTime(log.time)}]</span>
              <span className="console-text">{log.text}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
