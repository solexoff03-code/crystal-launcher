import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../App';
import './HomePage.css';

const ipc = window.electron;

export default function HomePage() {
  const { activeAccount, settings, profiles, activeProfile, setActiveProfileState,
          launching, gameRunning, launchGame, launchProgress } = useApp();

  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState('');
  const [versionType, setVersionType] = useState('release');
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [news, setNews] = useState([]);
  const [launchError, setLaunchError] = useState('');

  useEffect(() => {
    loadVersions();
    loadNews();
  }, []);

  const loadVersions = async () => {
    setLoadingVersions(true);
    const data = await ipc.minecraft.getVersions();
    if (data.error) {
      setLoadingVersions(false);
      return;
    }
    setVersions(data.versions);
    setSelectedVersion(data.latest.release);
    setLoadingVersions(false);
  };

  const loadNews = async () => {
    // Static curated news since MC news API requires auth
    setNews([
      { id: 1, title: 'Minecraft 1.21.4 — Printemps', desc: 'La mise à jour printemps apporte de nouveaux mobs et biomes.', date: '2024-12-03', tag: 'Mise à jour' },
      { id: 2, title: 'Minecraft 1.21 — Tricky Trials', desc: "Les épreuves périlleuses ajoutent les Vaults et le Breeze.", date: '2024-06-13', tag: 'Mise à jour' },
      { id: 3, title: 'Minecraft Live 2024', desc: 'Découvrez les annonces officielles de Mojang.', date: '2024-10-13', tag: 'Événement' },
    ]);
  };

  const handleLaunch = async () => {
    if (!activeAccount) return;
    setLaunchError('');
    const result = await launchGame(selectedVersion);
    if (!result.success) setLaunchError(result.error);
  };

  const filteredVersions = versions.filter(v => {
    if (versionType === 'release') return v.type === 'release';
    if (versionType === 'snapshot') return v.type === 'snapshot';
    return true;
  });

  const progressPercent = launchProgress
    ? Math.round((launchProgress.task / launchProgress.total) * 100)
    : 0;

  return (
    <div className="home-page">
      {/* Hero launch panel */}
      <div className="launch-panel card">
        <div className="launch-panel-header">
          <div className="launch-hero-icon">⬡</div>
          <div>
            <h2 className="launch-title">Crystal Launcher</h2>
            <p className="launch-subtitle">Minecraft personnalisé</p>
          </div>
        </div>

        <div className="launch-controls">
          {/* Version selector */}
          <div className="launch-version-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Version</label>
              {loadingVersions ? (
                <div className="input" style={{ color: 'var(--text-muted)' }}>Chargement…</div>
              ) : (
                <select
                  className="input select"
                  value={selectedVersion}
                  onChange={e => setSelectedVersion(e.target.value)}
                  disabled={launching || gameRunning}
                >
                  {filteredVersions.slice(0, 50).map(v => (
                    <option key={v.id} value={v.id}>{v.id}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group" style={{ width: 130 }}>
              <label className="form-label">Type</label>
              <select
                className="input select"
                value={versionType}
                onChange={e => setVersionType(e.target.value)}
                disabled={launching || gameRunning}
              >
                <option value="release">Release</option>
                <option value="snapshot">Snapshot</option>
                <option value="all">Toutes</option>
              </select>
            </div>
          </div>

          {/* Profile */}
          {profiles.length > 0 && (
            <div className="form-group">
              <label className="form-label">Profil</label>
              <select
                className="input select"
                value={activeProfile || ''}
                onChange={e => setActiveProfileState(e.target.value || null)}
                disabled={launching || gameRunning}
              >
                <option value="">Profil par défaut</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* RAM info */}
          <div className="launch-info-row">
            <span className="launch-info-item">
              <span className="launch-info-icon">🧠</span>
              RAM : {settings?.ram?.max || 2048} Mo max
            </span>
            <span className="launch-info-item">
              <span className="launch-info-icon">📁</span>
              {activeAccount?.username || 'Non connecté'}
            </span>
          </div>

          {/* Progress bar */}
          {launching && launchProgress && (
            <div className="launch-progress">
              <div className="launch-progress-header">
                <span className="launch-progress-label">{launchProgress.type || 'Téléchargement…'}</span>
                <span className="launch-progress-pct">{progressPercent}%</span>
              </div>
              <div className="launch-progress-bar">
                <div
                  className="launch-progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {launching && !launchProgress && (
            <div className="launch-progress">
              <div className="launch-progress-label pulse">Initialisation du lanceur…</div>
            </div>
          )}

          {launchError && (
            <div className="launch-error">
              ⚠️ {launchError}
            </div>
          )}

          {/* Launch button */}
          {!activeAccount ? (
            <Link to="/accounts" className="btn btn-primary launch-btn">
              Connexion requise →
            </Link>
          ) : gameRunning ? (
            <button className="btn btn-success launch-btn" disabled>
              <span className="spin" style={{ display: 'inline-block', fontSize: 14 }}>↻</span>
              Minecraft en cours…
            </button>
          ) : (
            <button
              className="btn btn-primary launch-btn"
              onClick={handleLaunch}
              disabled={launching || !selectedVersion}
            >
              {launching ? (
                <><span className="spin" style={{ display: 'inline-block' }}>↻</span> Lancement…</>
              ) : (
                <>▶ Jouer — {selectedVersion}</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="home-stats">
        <div className="stat-card card">
          <div className="stat-icon" style={{ color: 'var(--accent)' }}>⬡</div>
          <div className="stat-value">{versions.filter(v => v.type === 'release').length}</div>
          <div className="stat-label">Versions release</div>
        </div>
        <div className="stat-card card">
          <div className="stat-icon" style={{ color: 'var(--purple)' }}>🎭</div>
          <div className="stat-value">{profiles.length}</div>
          <div className="stat-label">Profils créés</div>
        </div>
        <div className="stat-card card">
          <div className="stat-icon" style={{ color: 'var(--green)' }}>👤</div>
          <div className="stat-value">{activeAccount ? '✓' : '✗'}</div>
          <div className="stat-label">Compte actif</div>
        </div>
      </div>

      {/* News */}
      <div className="section">
        <div className="section-title">Actualités Minecraft</div>
        <div className="news-list">
          {news.map(item => (
            <div key={item.id} className="news-card card">
              <div className="news-tag">{item.tag}</div>
              <h3 className="news-title">{item.title}</h3>
              <p className="news-desc">{item.desc}</p>
              <span className="news-date">{item.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
