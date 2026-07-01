import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import './SettingsPage.css';

const ipc = window.electron;

export default function SettingsPage() {
  const { settings, setSettings } = useApp();
  const [javaInfo, setJavaInfo] = useState(null);
  const [saved, setSaved] = useState(false);
  const [appVersion, setAppVersion] = useState('');

  const s = settings || {};

  useEffect(() => {
    ipc.java.detect().then(setJavaInfo);
    ipc.app.version().then(setAppVersion);
  }, []);

  const update = (key, value) => {
    setSettings({ [key]: value });
    flashSaved();
  };

  const updateNested = (parentKey, key, value) => {
    setSettings({ [parentKey]: { ...(s[parentKey] || {}), [key]: value } });
    flashSaved();
  };

  let saveTimer;
  const flashSaved = () => {
    clearTimeout(saveTimer);
    setSaved(true);
    saveTimer = setTimeout(() => setSaved(false), 2000);
  };

  const selectGameDir = async () => {
    const dir = await ipc.fs.selectDir();
    if (dir) update('gameDir', dir);
  };

  const selectJava = async () => {
    const dir = await ipc.fs.selectDir();
    if (dir) update('javaPath', dir);
  };

  const resetGameDir = async () => {
    const { app } = window.electron;
    update('gameDir', '');
  };

  return (
    <div className="settings-page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1>Paramètres</h1>
          <p>Configuration du lanceur</p>
        </div>
        {saved && <span className="settings-saved">✓ Sauvegardé</span>}
      </div>

      {/* Java */}
      <div className="settings-section card">
        <div className="settings-section-title">Java</div>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Java détecté</span>
            <span className="settings-row-desc">
              {javaInfo === null
                ? 'Vérification…'
                : javaInfo.found
                ? `✓ Java ${javaInfo.version || ''} trouvé`
                : '✗ Java non trouvé dans le PATH'}
            </span>
          </div>
          <button className="btn btn-ghost" onClick={() => ipc.app.openExternal('https://adoptium.net/')}>
            Télécharger Java
          </button>
        </div>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Chemin Java personnalisé</span>
            <span className="settings-row-desc">Laissez vide pour utiliser Java du système</span>
          </div>
          <div style={{ display: 'flex', gap: 8, width: 300 }}>
            <input className="input" value={s.javaPath || ''} readOnly placeholder="Automatique" />
            <button className="btn btn-ghost" onClick={selectJava}>Choisir</button>
          </div>
        </div>
      </div>

      {/* Memory */}
      <div className="settings-section card">
        <div className="settings-section-title">Mémoire</div>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">RAM minimale (Mo)</span>
            <span className="settings-row-desc">Mémoire allouée au démarrage</span>
          </div>
          <input
            className="input settings-input-sm"
            type="number" min="512" max="8192" step="256"
            value={s.ram?.min || 1024}
            onChange={e => updateNested('ram', 'min', parseInt(e.target.value))}
          />
        </div>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">RAM maximale (Mo)</span>
            <span className="settings-row-desc">Mémoire maximale allouée</span>
          </div>
          <input
            className="input settings-input-sm"
            type="number" min="512" max="32768" step="256"
            value={s.ram?.max || 2048}
            onChange={e => updateNested('ram', 'max', parseInt(e.target.value))}
          />
        </div>

        <div className="ram-preview">
          <div className="ram-bar">
            <div className="ram-bar-fill" style={{ width: `${Math.min(100, ((s.ram?.max || 2048) / 16384) * 100)}%` }} />
          </div>
          <span className="ram-label">{((s.ram?.max || 2048) / 1024).toFixed(1)} Go alloués</span>
        </div>
      </div>

      {/* Display */}
      <div className="settings-section card">
        <div className="settings-section-title">Affichage</div>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Résolution</span>
            <span className="settings-row-desc">Taille de la fenêtre de jeu</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              className="input settings-input-sm"
              type="number" value={s.resolution?.width || 854}
              onChange={e => updateNested('resolution', 'width', parseInt(e.target.value))}
            />
            <span style={{ color: 'var(--text-muted)' }}>×</span>
            <input
              className="input settings-input-sm"
              type="number" value={s.resolution?.height || 480}
              onChange={e => updateNested('resolution', 'height', parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Plein écran</span>
            <span className="settings-row-desc">Lancer en mode plein écran</span>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={!!s.fullscreen} onChange={e => update('fullscreen', e.target.checked)} />
            <span className="toggle-track" />
          </label>
        </div>
      </div>

      {/* Launcher */}
      <div className="settings-section card">
        <div className="settings-section-title">Lanceur</div>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Fermer au lancement</span>
            <span className="settings-row-desc">Réduire le lanceur lorsque Minecraft démarre</span>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={!!s.closeOnLaunch} onChange={e => update('closeOnLaunch', e.target.checked)} />
            <span className="toggle-track" />
          </label>
        </div>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Dossier de jeu</span>
            <span className="settings-row-desc">{s.gameDir || 'Dossier par défaut (.crystal-launcher)'}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={selectGameDir}>Choisir</button>
            {s.gameDir && <button className="btn btn-ghost" onClick={resetGameDir}>Reset</button>}
          </div>
        </div>
      </div>

      {/* About */}
      <div className="settings-section card">
        <div className="settings-section-title">À propos</div>
        <div className="settings-about">
          <div className="about-logo">⬡</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Crystal Launcher</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Version {appVersion || '1.0.0'}</div>
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Code source</span>
            <span className="settings-row-desc">Projet open source sur GitHub</span>
          </div>
          <button className="btn btn-ghost" onClick={() => ipc.app.openExternal('https://github.com/yourusername/crystal-launcher')}>
            GitHub →
          </button>
        </div>
        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Signaler un bug</span>
          </div>
          <button className="btn btn-ghost" onClick={() => ipc.app.openExternal('https://github.com/yourusername/crystal-launcher/issues')}>
            Issues →
          </button>
        </div>
      </div>
    </div>
  );
}
