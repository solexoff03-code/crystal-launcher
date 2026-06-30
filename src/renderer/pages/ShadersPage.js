import React, { useState, useEffect } from 'react';
import './ShadersPage.css';
const ipc = window.electron;

export default function ShadersPage() {
  const [shaders, setShaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { loadShaders(); }, []);

  const loadShaders = async () => {
    const list = await ipc.shaders.list();
    setShaders(list || []);
  };

  const install = async () => {
    setLoading(true); setMsg('');
    const r = await ipc.shaders.install();
    if (r.success) { setMsg(`✓ "${r.name}" installé !`); await loadShaders(); }
    else if (r.error) setMsg('Erreur : ' + r.error);
    setLoading(false);
  };

  const remove = async (name) => {
    await ipc.shaders.delete(name);
    await loadShaders();
  };

  const openFolder = () => ipc.shaders.openFolder();

  const getIcon = (name) => {
    if (name.toLowerCase().includes('bsl')) return '🌊';
    if (name.toLowerCase().includes('seus')) return '☀️';
    if (name.toLowerCase().includes('complementary')) return '🌸';
    if (name.toLowerCase().includes('sildur')) return '✨';
    if (name.toLowerCase().includes('chocapic')) return '🍫';
    return '🎨';
  };

  return (
    <div className="shaders-page">
      <div className="page-header">
        <h1>Shaders</h1>
        <p>Gérez vos packs de shaders Minecraft</p>
      </div>

      <div className="shaders-toolbar">
        <button className="btn btn-primary" onClick={install} disabled={loading}>
          {loading ? <><span className="spin">⟳</span> Installation…</> : '+ Installer un shader'}
        </button>
        <button className="btn btn-ghost" onClick={openFolder}>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          Ouvrir le dossier
        </button>
      </div>

      {msg && <div className={`shader-msg${msg.startsWith('✓') ? ' shader-msg--ok' : ' shader-msg--err'}`}>{msg}</div>}

      {shaders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎨</div>
          <h3>Aucun shader installé</h3>
          <p>Installez un fichier .zip de shader pack pour améliorer les graphismes de Minecraft</p>
          <div className="shader-hint">
            <p>Shaders populaires :</p>
            <div className="shader-links">
              <button className="shader-link-btn" onClick={() => ipc.app.openExternal('https://www.curseforge.com/minecraft/customization/bsl-shaders')}>BSL Shaders</button>
              <button className="shader-link-btn" onClick={() => ipc.app.openExternal('https://www.complementary.dev/shaders/')}>Complementary</button>
              <button className="shader-link-btn" onClick={() => ipc.app.openExternal('https://www.curseforge.com/minecraft/customization/seus-renewed')}>SEUS</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="shaders-grid">
          {shaders.map(name => (
            <div key={name} className="shader-card">
              <div className="shader-icon">{getIcon(name)}</div>
              <div className="shader-info">
                <div className="shader-name">{name.replace('.zip', '')}</div>
                <div className="shader-type">{name.endsWith('.zip') ? 'Pack ZIP' : 'Dossier'}</div>
              </div>
              <button className="btn-icon" onClick={() => remove(name)} title="Supprimer">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="shader-note card">
        <div className="shader-note-icon">💡</div>
        <div>
          <div className="shader-note-title">Comment utiliser les shaders</div>
          <div className="shader-note-body">Les shaders nécessitent <strong>OptiFine</strong> ou <strong>Iris Shaders</strong> installé dans Minecraft. Une fois en jeu, allez dans Options → Graphismes → Shader Packs.</div>
        </div>
      </div>
    </div>
  );
}
