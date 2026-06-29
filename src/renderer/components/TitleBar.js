import React from 'react';
import './TitleBar.css';
const ipc = window.electron;
export default function TitleBar() {
  return (
    <div className="titlebar">
      <div className="tb-dots">
        <button className="dot dot-r" onClick={() => ipc.close()} title="Fermer"/>
        <button className="dot dot-y" onClick={() => ipc.minimize()} title="Réduire"/>
        <button className="dot dot-g" onClick={() => ipc.maximize()} title="Agrandir"/>
      </div>
      <div className="tb-drag">
        <span className="tb-logo-small">⬡</span>
        <span className="tb-title">Crystal Launcher</span>
      </div>
    </div>
  );
}
