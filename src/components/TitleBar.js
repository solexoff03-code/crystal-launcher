import React, { useState, useEffect } from 'react';
import './TitleBar.css';
const ipc = window.electron;

export default function TitleBar() {
  const [ver, setVer] = useState('');
  useEffect(() => { ipc.app.version().then(setVer); }, []);

  return (
    <div className="titlebar">
      <div className="titlebar-left">
        <span className="titlebar-icon">⬡</span>
        <span className="titlebar-title">Crystal Launcher</span>
        {ver && <span className="titlebar-version">v{ver}</span>}
      </div>
      <div className="titlebar-buttons">
        <button className="titlebar-btn" onClick={() => ipc.minimize()}>─</button>
        <button className="titlebar-btn" onClick={() => ipc.maximize()}>□</button>
        <button className="titlebar-btn close" onClick={() => ipc.close()}>✕</button>
      </div>
    </div>
  );
}
